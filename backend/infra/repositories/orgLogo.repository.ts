import OrgLogo from '@models/orgLogo';

class OrgLogoRepository {
  static async findAll() {
    return await OrgLogo.find();
  }

  static async findByOrganisation(org) {
    return await OrgLogo.findOne({
      organisation: org.toLowerCase().trim(),
    });
  }

  static async upsert(org, logoUrl) {
    const normalised = org.toLowerCase().trim();
    return await OrgLogo.findOneAndUpdate(
      { organisation: normalised },
      { organisation: normalised, logoUrl },
      { upsert: true, new: true }
    );
  }

  static async deleteByOrganisation(org) {
    return await OrgLogo.findOneAndDelete({
      organisation: org.toLowerCase().trim(),
    });
  }
}

export = OrgLogoRepository;
