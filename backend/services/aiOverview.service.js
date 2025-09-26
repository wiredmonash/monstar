const Unit = require('../models/unit');
const Review = require('../models/review');
const SETU = require('../models/setu');

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
console.log(`[AIOverview][Init] GEMINI_MODEL environment variable: '${process.env.GEMINI_MODEL}', using: '${GEMINI_MODEL}'`);
const MAX_REVIEW_SAMPLES = 15;
const MAX_REVIEW_TEXT_LENGTH = 800;
const MAX_SETU_SEASONS = 4;
const MIN_REGENERATION_DAYS = 120; // roughly every semester

let geminiClientPromise = null;

/**
 * Lazily import the Google GenAI client to avoid loading
 * the dependency when the API key is not configured.
 */
async function getGeminiClient() {
    if (!process.env.GEMINI_API_KEY) {
        console.warn('[AIOverview] GEMINI_API_KEY missing. Skipping overview generation.');
        return null;
    }

    if (!geminiClientPromise) {
        geminiClientPromise = import('@google/genai')
            .then(({ GoogleGenAI }) => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }))
            .catch((error) => {
                console.error('[AIOverview] Failed to initialise Gemini client:', error);
                return null;
            });
    }

    return geminiClientPromise;
}

/**
 * Helper to pause between API calls to respect quotas/rate limits.
 */
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Escape characters that would otherwise break XML formatting.
 */
function escapeXml(value = '') {
    const safe = value == null ? '' : String(value);

    return safe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/**
 * Normalise review text to reduce token usage while keeping salient details.
 */
function sanitiseReviewBody(body = '') {
    const raw = body == null ? '' : String(body);
    const truncated = raw.length > MAX_REVIEW_TEXT_LENGTH
        ? `${raw.slice(0, MAX_REVIEW_TEXT_LENGTH)}...`
        : raw;

    return escapeXml(truncated.replace(/\s+/g, ' ').trim());
}

function formatRatings(review) {
    const parts = [];
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
    return parts.join('');
}

function buildSetuXml(entries) {
    if (!entries.length) return '<setu />';

    const rows = entries.map((entry) => {
        const aggMean = Array.isArray(entry.agg_score) ? entry.agg_score[0] : undefined;
        const aggMedian = Array.isArray(entry.agg_score) ? entry.agg_score[1] : undefined;
        return `    <setu-entry season="${escapeXml(entry.Season)}">\n` +
            `        <responses>${entry.Responses}</responses>\n` +
            `        <invited>${entry.Invited}</invited>\n` +
            (typeof aggMean === 'number' ? `        <aggregate-mean>${aggMean.toFixed(2)}</aggregate-mean>\n` : '') +
            (typeof aggMedian === 'number' ? `        <aggregate-median>${aggMedian.toFixed(2)}</aggregate-median>\n` : '') +
            (entry.I8 && entry.I8.length ? `        <overall-satisfaction>${entry.I8.join(', ')}</overall-satisfaction>\n` : '') +
            '    </setu-entry>';
    });

    return `<setu>\n${rows.join('\n')}\n</setu>`;
}

function buildReviewsXml(reviews) {
    if (!reviews.length) return '<reviews />';

    const rows = reviews.map((review) => {
        return `    <review>` +
            `<title>${escapeXml(review.title || '')}</title>` +
            `<semester>${escapeXml(review.semester || '')}</semester>` +
            `<year>${review.year || ''}</year>` +
            `<grade>${escapeXml(review.grade || '')}</grade>` +
            `${formatRatings(review)}` +
            `<description>${sanitiseReviewBody(review.description || '')}</description>` +
            `</review>`;
    });

    return `<reviews>\n${rows.join('\n')}\n</reviews>`;
}

function buildPrompt({ unit, setuEntries, reviews, totalReviewCount }) {
    const instructions = 'You summarise Monash University student feedback. Speak as a summariser (e.g. "Students report..."). Highlight consensus, note disagreements, and avoid speculation.';

    const unitMeta = `<unit>` +
        `<code>${escapeXml(unit.unitCode)}</code>` +
        `<name>${escapeXml(unit.name || '')}</name>` +
        `<avg-overall>${typeof unit.avgOverallRating === 'number' ? unit.avgOverallRating.toFixed(2) : ''}</avg-overall>` +
        `<avg-enjoyment>${typeof unit.avgContentRating === 'number' ? unit.avgContentRating.toFixed(2) : ''}</avg-enjoyment>` +
        `<avg-simplicity>${typeof unit.avgFacultyRating === 'number' ? unit.avgFacultyRating.toFixed(2) : ''}</avg-simplicity>` +
        `<avg-usefulness>${typeof unit.avgRelevancyRating === 'number' ? unit.avgRelevancyRating.toFixed(2) : ''}</avg-usefulness>` +
        `<total-reviews>${totalReviewCount}</total-reviews>` +
        `${buildSetuXml(setuEntries)}` +
        `${buildReviewsXml(reviews)}` +
        '</unit>';

    const task = `${instructions}\n\nUse the XML below as your only source. Produce a concise (3-4 sentences) overview.`;
    return `${task}\n\n${unitMeta}`;
}

function shouldGenerateOverview(unit, force = false) {
    if (force) return true;
    if (!unit.aiOverview || !unit.aiOverview.summary) return true;

    const totalReviews = Array.isArray(unit.reviews) ? unit.reviews.length : 0;
    if (unit.aiOverview.totalReviewsConsidered !== totalReviews) return true;

    if (!unit.aiOverview.generatedAt) return true;

    const ageMs = Date.now() - new Date(unit.aiOverview.generatedAt).getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    return ageDays >= MIN_REGENERATION_DAYS;
}

async function generateOverviewForUnit(unit, options = {}) {
    const { force = false } = options;

    if (!Array.isArray(unit.reviews) || unit.reviews.length === 0) {
        return { status: 'skipped', reason: 'no-reviews' };
    }

    if (!shouldGenerateOverview(unit, force)) {
        return { status: 'skipped', reason: 'fresh' };
    }

    const client = await getGeminiClient();
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

    console.log(`[AIOverview][Model] Using model: ${GEMINI_MODEL} for unit ${unit.unitCode}`);
    console.log(`[AIOverview][Prompt] Generated prompt for unit ${unit.unitCode}\n${prompt}\n\n`);

    try {
        const result = await client.models.generateContent({
            model: GEMINI_MODEL,
            contents: prompt,
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 512,
            },
        });

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
        console.error(`[AIOverview] Failed to generate overview for unit ${unit.unitCode}:`, error);
        return { status: 'error', reason: 'gemini-error', error };
    }
}

async function generateOverviewsForAllUnits(options = {}) {
    const { force = false, delayMs = 500 } = options;

    const units = await Unit.find({
        reviews: { $exists: true, $not: { $size: 0 } },
    });

    if (!units.length) {
        console.log('[AIOverview] No units with reviews found for generation.');
        return { processed: 0, updated: 0 };
    }

    let updated = 0;

    for (const unit of units) {
        const { status } = await generateOverviewForUnit(unit, { force });
        if (status === 'updated') {
            updated += 1;
        }

        if (delayMs) {
            await sleep(delayMs);
        }
    }

    console.log(`[AIOverview] Completed generation. Processed: ${units.length}, Updated: ${updated}`);
    return { processed: units.length, updated };
}

module.exports = {
    generateOverviewForUnit,
    generateOverviewsForAllUnits,
};
