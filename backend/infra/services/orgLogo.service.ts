import { cloudinary } from '@providers/cloudinary.provider';
import OrgLogoRepository from '@repositories/orgLogo.repository';

class OrgLogoService {
  static normalise(name) {
    return name.toLowerCase().trim();
  }

  static async getAll() {
    return await OrgLogoRepository.findAll();
  }

  static async uploadLogo(orgName, logoUrl) {
    const normalised = this.normalise(orgName);

    // Delete old Cloudinary image if one already exists
    const existing = await OrgLogoRepository.findByOrganisation(normalised);
    if (existing) {
      try {
        const urlParts = existing.logoUrl.split('/');
        const fileName = urlParts[urlParts.length - 1].split('.')[0];
        const publicId = `orgs/${fileName}`;
        await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        console.error(
          `[OrgLogo] Error deleting old image from Cloudinary: ${err.message}`
        );
      }
    }

    return await OrgLogoRepository.upsert(normalised, logoUrl);
  }

  static async deleteLogo(orgName) {
    const normalised = this.normalise(orgName);
    const logo = await OrgLogoRepository.findByOrganisation(normalised);
    if (!logo) return null;

    // Delete from Cloudinary
    try {
      const urlParts = logo.logoUrl.split('/');
      const fileName = urlParts[urlParts.length - 1].split('.')[0];
      const publicId = `orgs/${fileName}`;
      await cloudinary.uploader.destroy(publicId);
    } catch (err) {
      console.error(
        `[OrgLogo] Error deleting image from Cloudinary: ${err.message}`
      );
    }

    return await OrgLogoRepository.deleteByOrganisation(normalised);
  }
}

export = OrgLogoService;
