import mongoose, { Schema } from 'mongoose';

const orgLogoSchema = new Schema(
  {
    organisation: { type: String, required: true, unique: true },
    logoUrl: { type: String, required: true },
  },
  { timestamps: true }
);

// Normalise org name to lowercase + trimmed before saving
orgLogoSchema.pre('save', function (next) {
  if (this.organisation) {
    this.organisation = this.organisation.toLowerCase().trim();
  }
  next();
});

const OrgLogo = mongoose.model('OrgLogo', orgLogoSchema);
export = OrgLogo;
