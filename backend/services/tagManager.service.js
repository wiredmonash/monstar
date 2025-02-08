const Unit = require('../models/unit');

class TagManager {
    static async updateMostReviewsTag(threshold = 10) {
        console.log(`[TagManager] Updating most-reviews tag for units with more than ${threshold} reviews`);
        const session = await Unit.startSession();
        
        try {
            await session.withTransaction(async () => {
                console.log('[TagManager] Starting transaction');

                // Find units exceeding threshold
                cnosole.log('[TagManager] Finding units with most reviews...');
                const unitsWithMostReviews = await Unit.find({
                    reviewCount: { $gt: threshold }
                })
                .sort({ reviewCount: -1 })
                .limit(1)
                .session(session);

                console.log(`[TagManager] Found ${unitsWithMostReviews.length} units exceeding threshold`);

                // Batch update to remove tags
                console.log('[TagManager] Removing existing most-reviews tags...');
                const removeResult = await Unit.updateMany(
                    { tags: 'most-reviews' },
                    { $pull: { tags: 'most-reviews' } },
                    { session }
                );
                console.log(`[TagManager] Removed tags from ${removeResult.modifiedCount} units`);

                // Add tag to top unit
                if (unitsWithMostReviews.length > 0) {
                    const topUnit = unitsWithMostReviews[0];
                    console.log(`[TagManager] Adding most-reviews tag to ${topUnit.unitCode}`);

                    await Unit.findByIdAndUpdate(
                        unitsWithMostReviews[0]._id,
                        { $addToSet: { tags: 'most-reviews' } },
                        { session }
                    );
                    console.log('[TagManager] Tag added successfully');
                } else {
                    console.log('[TagManager] No units found exceeding threshold');
                }
            });
            console.log('[TagManager] Transaction complete');
        } 
        catch (error) {
            console.error(`[TagManager] Transaction failed: ${error}`);
        }
        finally {
            console.log(`[TagManager] Ending session`);
            await session.endSession();
        }
    }
}

module.exports = TagManager;