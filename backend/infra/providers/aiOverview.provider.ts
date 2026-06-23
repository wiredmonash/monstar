import type { GoogleGenAI } from '@google/genai';

import Review from '@models/review';
import SETU from '@models/setu';
import Unit from '@models/unit';
import type { IUnit, IReviewLean, ISETULean } from '@models/types';

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
console.log(
  `[AIOverview][Init] GEMINI_MODEL environment variable: '${process.env.GEMINI_MODEL}', using: '${GEMINI_MODEL}'`
);
const MAX_REVIEW_SAMPLES = 15;
const MAX_REVIEW_TEXT_LENGTH = 800;
const MAX_SETU_SEASONS = 4;
const MIN_REGENERATION_DAYS = 120; // roughly every semester

class AiOverviewProvider {
  static geminiClientPromise: Promise<GoogleGenAI | null> | null = null;

  /**
   * Lazily import the Google GenAI client to avoid loading
   * the dependency when the API key is not configured.
   */
  static async getGeminiClient() {
    if (!process.env.GEMINI_API_KEY) {
      console.warn(
        '[AIOverview] GEMINI_API_KEY missing. Skipping overview generation.'
      );
      return null;
    }

    if (!this.geminiClientPromise) {
      this.geminiClientPromise = import('@google/genai')
        .then(
          ({ GoogleGenAI }) =>
            new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
        )
        .catch((error) => {
          console.error(
            '[AIOverview] Failed to initialise Gemini client:',
            error
          );
          return null;
        });
    }

    return this.geminiClientPromise;
  }

  /**
   * Generate AI overview for a singular unit
   */
  static async generateOverviewForUnit(
    unit: IUnit,
    options: { force?: boolean } = {}
  ) {
    const { force = false } = options;

    if (!Array.isArray(unit.reviews) || unit.reviews.length === 0) {
      return { status: 'skipped', reason: 'no-reviews' };
    }

    if (!this.shouldGenerateOverview(unit, force)) {
      return { status: 'skipped', reason: 'fresh' };
    }

    const client = await this.getGeminiClient();
    if (!client) {
      return { status: 'skipped', reason: 'no-client' };
    }

    const reviewDocs = await Review.find({ unit: unit._id })
      .sort({ createdAt: -1 })
      .lean();

    if (!reviewDocs.length) {
      return { status: 'skipped', reason: 'no-reviews' };
    }

    const reviewSamples = reviewDocs.slice(0, MAX_REVIEW_SAMPLES);
    const setuEntries = await SETU.find({ unit_code: unit.unitCode })
      .sort({ Season: -1 })
      .limit(MAX_SETU_SEASONS)
      .lean();

    const prompt = buildPrompt({
      unit,
      setuEntries,
      reviews: reviewSamples,
      totalReviewCount: reviewDocs.length,
    });

    console.log(
      `[AIOverview][Model] Using model: ${GEMINI_MODEL} for unit ${unit.unitCode}`
    );
    console.log(
      `[AIOverview][Prompt] Generated prompt for unit ${unit.unitCode}\n${prompt}\n\n`
    );

    try {
      const result = await client.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 512,
        },
      } as Parameters<typeof client.models.generateContent>[0]);

      const summary = result?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!summary) {
        console.warn(`[AIOverview] Empty response for unit ${unit.unitCode}`);
        return { status: 'error', reason: 'empty-response' };
      }

      unit.aiOverview = {
        summary: summary.trim(),
        generatedAt: new Date(),
        model: GEMINI_MODEL,
        totalReviewsConsidered: reviewDocs.length,
        reviewSampleSize: reviewSamples.length,
        setuSeasons: setuEntries.map((entry) => entry.Season),
      };
      await unit.save();

      return { status: 'updated', summary: unit.aiOverview.summary };
    } catch (error) {
      console.error(
        `[AIOverview] Failed to generate overview for unit ${unit.unitCode}:`,
        error
      );
      return { status: 'error', reason: 'gemini-error', error };
    }
  }

  /**
   * Generate AI overviews for all units with at least one review
   */
  static async generateOverviewsForAllUnits(
    options: { force?: boolean; delayMs?: number } = {}
  ) {
    const { force = false, delayMs = 500 } = options;

    const units = await Unit.find({
      reviews: { $exists: true, $not: { $size: 0 } },
    });

    if (!units.length) {
      console.log('[AIOverview] No units with reviews found for generation.');
      return { processed: 0, updated: 0 };
    }

    let updated = 0;
    let processed = 0;

    console.log(
      `[AIOverview] Starting generation for ${units.length} units (force: ${force}, delay: ${delayMs}ms)`
    );

    for (const unit of units) {
      processed += 1;
      console.log(
        `\n[AIOverview] ========== Processing ${processed}/${units.length}: ${unit.unitCode} ==========`
      );

      const { status, reason } = await this.generateOverviewForUnit(unit, {
        force,
      });

      if (status === 'updated') {
        updated += 1;
        console.log(
          `[AIOverview] ✓ Successfully updated ${unit.unitCode} (${updated} total updates)`
        );
      } else if (status === 'skipped') {
        console.log(
          `[AIOverview] ⊘ Skipped ${unit.unitCode} (reason: ${reason})`
        );
      } else if (status === 'error') {
        console.log(
          `[AIOverview] ✗ Error processing ${unit.unitCode} (reason: ${reason})`
        );
      }

      if (delayMs) {
        await sleep(delayMs);
      }
    }

    console.log(`\n[AIOverview] ========== Completed generation ==========`);
    console.log(
      `[AIOverview] Processed: ${units.length}, Updated: ${updated}, Skipped: ${processed - updated}`
    );
    return { processed: units.length, updated };
  }

  static shouldGenerateOverview(unit: IUnit, force = false) {
    if (force) return true;
    if (!unit.aiOverview || !unit.aiOverview.summary) return true;

    const totalReviews = Array.isArray(unit.reviews) ? unit.reviews.length : 0;
    if (unit.aiOverview.totalReviewsConsidered !== totalReviews) return true;

    if (!unit.aiOverview.generatedAt) return true;

    const ageMs = Date.now() - new Date(unit.aiOverview.generatedAt).getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    return ageDays >= MIN_REGENERATION_DAYS;
  }
}

const buildPrompt = ({
  unit,
  setuEntries,
  reviews,
  totalReviewCount,
}: {
  unit: IUnit;
  setuEntries: ISETULean[];
  reviews: IReviewLean[];
  totalReviewCount: number;
}) => {
  const instructions =
    'You summarise Monash University student feedback. Speak as a summariser (e.g. "Students report..."). Highlight consensus, note disagreements, and avoid speculation.';

  const unitMeta =
    `<unit>\n` +
    `  <code>${escapeXml(unit.unitCode)}</code>\n` +
    `  <name>${escapeXml(unit.name || '')}</name>\n` +
    `  <avg-overall>${typeof unit.avgOverallRating === 'number' ? unit.avgOverallRating.toFixed(2) : ''}</avg-overall>\n` +
    `  <avg-enjoyment>${typeof unit.avgContentRating === 'number' ? unit.avgContentRating.toFixed(2) : ''}</avg-enjoyment>\n` +
    `  <avg-simplicity>${typeof unit.avgFacultyRating === 'number' ? unit.avgFacultyRating.toFixed(2) : ''}</avg-simplicity>\n` +
    `  <avg-usefulness>${typeof unit.avgRelevancyRating === 'number' ? unit.avgRelevancyRating.toFixed(2) : ''}</avg-usefulness>\n` +
    `  <total-reviews>${totalReviewCount}</total-reviews>\n` +
    `  ${buildSetuXml(setuEntries)}\n` +
    `  ${buildReviewsXml(reviews)}\n` +
    '</unit>';

  const task = `${instructions}\n\nUse the XML below as your only source. Produce a concise (3-4 sentences) overview.`;
  return `${task}\n\n${unitMeta}`;
};

const buildReviewsXml = (reviews: IReviewLean[]) => {
  if (!reviews.length) return '<reviews />';

  const rows = reviews.map((review) => {
    return (
      `    <review>\n` +
      `      <title>${escapeXml(review.title || '')}</title>\n` +
      `      <semester>${escapeXml(review.semester || '')}</semester>\n` +
      `      <year>${review.year || ''}</year>\n` +
      `      <grade>${escapeXml(review.grade || '')}</grade>\n` +
      `      ${formatRatings(review)}\n` +
      `      <description>${sanitiseReviewBody(review.description || '')}</description>\n` +
      `    </review>`
    );
  });

  return `<reviews>\n${rows.join('\n')}\n  </reviews>`;
};

const formatRatings = (review: IReviewLean) => {
  const parts: string[] = [];
  if (typeof review.overallRating === 'number') {
    parts.push(`<overall>${review.overallRating}</overall>`);
  }
  if (typeof review.contentRating === 'number') {
    parts.push(`<enjoyment>${review.contentRating}</enjoyment>`);
  }
  if (typeof review.facultyRating === 'number') {
    parts.push(`<simplicity>${review.facultyRating}</simplicity>`);
  }
  if (typeof review.relevancyRating === 'number') {
    parts.push(`<usefulness>${review.relevancyRating}</usefulness>`);
  }
  return parts.length > 0 ? parts.join('\n      ') : '';
};

const buildSetuXml = (entries: ISETULean[]) => {
  if (!entries.length) return '<setu />';

  const rows = entries.map((entry) => {
    const aggMean = Array.isArray(entry.agg_score)
      ? entry.agg_score[0]
      : undefined;
    const aggMedian = Array.isArray(entry.agg_score)
      ? entry.agg_score[1]
      : undefined;
    return (
      `    <setu-entry season="${escapeXml(entry.Season)}">\n` +
      `        <responses>${entry.Responses}</responses>\n` +
      `        <invited>${entry.Invited}</invited>\n` +
      (typeof aggMean === 'number'
        ? `        <aggregate-mean>${aggMean.toFixed(2)}</aggregate-mean>\n`
        : '') +
      (typeof aggMedian === 'number'
        ? `        <aggregate-median>${aggMedian.toFixed(2)}</aggregate-median>\n`
        : '') +
      (entry.I8 && entry.I8.length
        ? `        <overall-satisfaction>${entry.I8.join(', ')}</overall-satisfaction>\n`
        : '') +
      '    </setu-entry>'
    );
  });

  return `<setu>\n${rows.join('\n')}\n  </setu>`;
};

/**
 * Normalise review text to reduce token usage while keeping salient details.
 */
const sanitiseReviewBody = (body = '') => {
  const raw = body == null ? '' : String(body);
  const truncated =
    raw.length > MAX_REVIEW_TEXT_LENGTH
      ? `${raw.slice(0, MAX_REVIEW_TEXT_LENGTH)}...`
      : raw;

  return escapeXml(truncated.replace(/\s+/g, ' ').trim());
};

/**
 * Helper to pause between API calls to respect quotas/rate limits.
 */
const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Escape characters that would otherwise break XML formatting.
 */
const escapeXml = (value = '') => {
  const safe = value == null ? '' : String(value);

  return safe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

export = AiOverviewProvider;
