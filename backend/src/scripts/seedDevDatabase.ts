/* --------- Load env + register @ aliases (must run before any import) ------ */
import '../bootstrap';

/* ----------------------------- Module imports ----------------------------- */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import mongoose from 'mongoose';

import Review from '@domains/academics/reviews/review.model';
import Unit from '@domains/academics/units/unit.model';
import User from '@domains/identity/users/user.model';
import { dbConnect } from '@infrastructure/database/mongodb';

/**
 * Seeds a local development database with synthetic sample data: the full
 * unit catalogue (from docs/sample-data/processed_units.json) plus fictional
 * users and reviews so the core browse/review flows work out of the box.
 *
 * Safe to repeat: exits early if data already exists. Pass --reset to drop
 * the database and reseed. All generated data is fictional.
 *
 * Usage: npm run seed [-- --reset]
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RESET = process.argv.includes('--reset');

/* ------------------------------ Safety guard ------------------------------ */
// This script wipes and writes whole collections, so refuse to touch anything
// that is not the local/compose database.
const ALLOWED_HOSTS = ['mongo', 'localhost', '127.0.0.1'];
const connString = process.env.MONGODB_CONN_STRING ?? '';
const connHost = new URL(connString).hostname;

if (!ALLOWED_HOSTS.includes(connHost)) {
  console.error(
    `[Seed] Refusing to seed non-local database host "${connHost}". ` +
      `Allowed hosts: ${ALLOWED_HOSTS.join(', ')}`
  );
  process.exit(1);
}

const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

/* ------------------------------- Sample data ------------------------------ */
// Fictional students. Authcates follow the Monash shape (4 letters + 4
// digits) but belong to no real person. The first one is an admin.
// prettier-ignore
const AUTHCATES = [
  'abcd0001', 'efgh0002', 'ijkl0003', 'mnop0004', 'qrst0005', 'uvwx0006',
  'yzab0007', 'cdef0008', 'ghij0009', 'klmn0010', 'opqr0011', 'stuv0012',
];

// Units that get reviews (popular first-year + core units). Any code missing
// from the catalogue JSON is skipped at runtime.
const REVIEWED_UNIT_CODES = [
  'FIT1008',
  'FIT1045',
  'FIT1047',
  'FIT1049',
  'FIT2001',
  'FIT2004',
  'FIT2099',
  'FIT2102',
  'FIT3155',
  'FIT3171',
  'MAT1830',
  'MAT1841',
  'MTH1030',
  'ENG1005',
  'ACB1020',
  'PSY1011',
  'BIO1011',
  'CHM1051',
  'ECC1000',
  'LAW1111',
];

const REVIEW_TITLES = [
  'Solid unit, would recommend',
  'Challenging but rewarding',
  'Great content, rough assessments',
  'Carried by the tutors',
  'Lectures were hit and miss',
  'Surprisingly enjoyable',
  'Heavy workload, plan ahead',
  'Good intro to the topic',
  'Exam was fair',
  'Group work was painful',
  'Best unit I have taken so far',
  'Average unit, does the job',
];

const REVIEW_BODIES = [
  'The weekly applied sessions were the highlight. Content builds steadily and the assignments actually test what was taught. Start the final assignment early — it takes longer than it looks.',
  'Lectures felt disorganised at times, but the tutorial materials were excellent. The exam focused heavily on the second half of the semester.',
  'Workload is heavier than the credit points suggest. That said, the teaching team responded quickly on the forums and consultations were genuinely useful.',
  'The unit assumes more background knowledge than the handbook implies. If you have not done the recommended prior units, expect to put in extra hours in the first few weeks.',
  'Assessments were spread out well so there was never a crunch week. Marking was consistent and the feedback was actually actionable.',
  'Content is interesting but the pace is quick. Recorded lectures made it manageable. The group project depends a lot on who you get matched with.',
  'One of the better-run units in the course. Clear expectations, practice exams that matched the real thing, and staff who clearly wanted students to do well.',
  'The theory is dry but the practical work makes up for it. Labs were well designed and built directly toward the assignments.',
  'Fine as a core unit. Nothing spectacular, but everything works: clear notes, reasonable assessments, no surprises in the exam.',
  'Hard unit, generous marking. The concepts take a while to click, but once they do the assignments are satisfying to complete.',
];

const SEMESTERS = ['First semester', 'Second semester'];
const GRADES = ['HD', 'HD', 'D', 'D', 'C', 'P', 'N'];

/* --------------------------------- Seeding -------------------------------- */
async function seed() {
  await dbConnect();
  const db = mongoose.connection;

  if (RESET) {
    console.log(`[Seed] --reset: dropping database "${db.name}"`);
    await db.dropDatabase();
  } else if ((await Unit.estimatedDocumentCount()) > 0) {
    console.log(
      '[Seed] Database already contains data — nothing to do. ' +
        'Run "npm run seed -- --reset" to wipe and reseed.'
    );
    await mongoose.disconnect();
    return;
  }

  /* Units — full catalogue, same field mapping as the v1 bulk-create flow. */
  const unitsJson = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, '../docs/sample-data/processed_units.json'),
      'utf-8'
    )
  ) as Record<string, any>;

  const unitDocs = Object.entries(unitsJson).map(([unitCode, unit]) => ({
    unitCode: unitCode.toLowerCase(),
    name: unit.title,
    description: unit.description || '',
    level: unit.level,
    creditPoints: parseInt(unit.credit_points, 10),
    school: unit.school,
    academicOrg: unit.academic_org,
    scaBand: unit.sca_band,
    requisites: unit.requisites,
    offerings: unit.offerings,
  }));

  await Unit.insertMany(unitDocs, { ordered: false });
  console.log(`[Seed] Inserted ${unitDocs.length} units`);

  /* Users — fictional, pre-verified Google accounts. */
  const users = await User.insertMany(
    AUTHCATES.map((authcate, i) => ({
      email: `${authcate}@student.monash.edu`,
      username: authcate,
      isGoogleUser: true,
      googleID: `seed-${authcate}`,
      verified: true,
      admin: i === 0,
    }))
  );
  console.log(`[Seed] Inserted ${users.length} users`);

  /* Reviews — a spread of ratings across well-known units. */
  const reviewedUnits = await Unit.find({
    unitCode: { $in: REVIEWED_UNIT_CODES.map((c) => c.toLowerCase()) },
  });

  let reviewTotal = 0;
  let topUnit: { id: mongoose.Types.ObjectId; count: number } | null = null;
  for (const unit of reviewedUnits) {
    const authors = [...users]
      .sort(() => Math.random() - 0.5)
      .slice(0, randomInt(2, 8));

    const reviews = await Review.insertMany(
      authors.map((author) => {
        const overallRating = randomInt(1, 5);
        return {
          title: pick(REVIEW_TITLES),
          description: pick(REVIEW_BODIES),
          semester: pick(SEMESTERS),
          year: randomInt(2022, 2025),
          grade: pick(GRADES),
          overallRating,
          // Keep the other ratings within one point of overall so the
          // averages look plausible.
          relevancyRating: Math.min(5, Math.max(1, overallRating + randomInt(-1, 1))),
          facultyRating: Math.min(5, Math.max(1, overallRating + randomInt(-1, 1))),
          contentRating: Math.min(5, Math.max(1, overallRating + randomInt(-1, 1))),
          likes: randomInt(0, 15),
          dislikes: randomInt(0, 4),
          unit: unit._id,
          author: author._id,
        };
      })
    );

    const avg = (field: string) =>
      reviews.reduce((sum, r) => sum + (r.get(field) as number), 0) /
      reviews.length;

    await Unit.updateOne(
      { _id: unit._id },
      {
        $push: { reviews: { $each: reviews.map((r) => r._id) } },
        $set: {
          avgOverallRating: avg('overallRating'),
          avgRelevancyRating: avg('relevancyRating'),
          avgFacultyRating: avg('facultyRating'),
          avgContentRating: avg('contentRating'),
        },
      }
    );

    await Promise.all(
      reviews.map((review) =>
        User.updateOne(
          { _id: review.author },
          { $push: { reviews: review._id } }
        )
      )
    );

    reviewTotal += reviews.length;
    if (!topUnit || reviews.length > topUnit.count) {
      topUnit = { id: unit._id, count: reviews.length };
    }
  }
  console.log(
    `[Seed] Inserted ${reviewTotal} reviews across ${reviewedUnits.length} units`
  );

  /* Tag the unit with the most reviews, mirroring TagManager. */
  if (topUnit) {
    await Unit.updateOne(
      { _id: topUnit.id },
      { $set: { tags: ['most-reviews'] } }
    );
  }

  console.log('[Seed] Done');
  await mongoose.disconnect();
}

seed().catch((error) => {
  console.error('[Seed] Failed:', error);
  process.exit(1);
});
