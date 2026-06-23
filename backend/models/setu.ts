import mongoose, {
  Schema,
  Model,
  InferSchemaType,
  HydratedDocument,
} from 'mongoose';

const setuSchema = new Schema(
  {
    unit_code: { type: String, required: true, index: true },
    unit_name: { type: String, required: true },
    code: { type: String, required: true },
    Season: { type: String, required: true },
    Responses: { type: Number, required: true },
    Invited: { type: Number, required: true },
    Response_Rate: { type: Number },
    Level: { type: Number },
    /**
     * Evaluation metrics for SETU (I1 - I13)
     *
     * Array will have two values: [median/5, mean/5]
     */
    I1: { type: [Number] },
    I2: { type: [Number] },
    I3: { type: [Number] },
    I4: { type: [Number] },
    I5: { type: [Number] },
    I6: { type: [Number] },
    I7: { type: [Number] },
    I8: { type: [Number] },
    I9: { type: [Number] },
    I10: { type: [Number] },
    I11: { type: [Number] },
    I12: { type: [Number] },
    I13: { type: [Number] },
    agg_score: { type: [Number] },
  },
  { timestamps: true }
);

// Create compound index for faster queries
setuSchema.index({ unit_code: 1, Season: 1 });

type ISetu = InferSchemaType<typeof setuSchema>;

interface SetuAverage {
  _id: string;
  averageAggScore: number;
  totalResponses: number;
}

interface SetuModel extends Model<ISetu> {
  findByUnitCode(unitCode: string): Promise<HydratedDocument<ISetu>[]>;
  getAverageScores(unitCode: string): Promise<SetuAverage[]>;
}

// Static method to get SETU data by unit code
setuSchema.statics.findByUnitCode = function (unitCode: string) {
  return SETU.find({ unit_code: unitCode }).sort({ Season: -1 });
};

// Static method to get average SETU scores for a unit
setuSchema.statics.getAverageScores = function (unitCode: string) {
  return SETU.aggregate([
    { $match: { unit_code: unitCode } },
    {
      $group: {
        _id: '$unit_code',
        averageAggScore: { $avg: { $arrayElemAt: ['$agg_score', 0] } },
        totalResponses: { $sum: '$Responses' },
      },
    },
  ]);
};

const SETU = mongoose.model<ISetu, SetuModel>('SETU', setuSchema);
export default SETU;
