import { cloudinary } from '@providers/cloudinary.provider';
import OrgLogoRepository from '@repositories/orgLogo.repository';
import { getErrorMessage } from '@utilities/getErrorMessage';

class OrgLogoService {
  static normalise(name: string) {
    return name.toLowerCase().trim();
  }

  static async getAll() {
    return await OrgLogoRepository.findAll();
  }

  static async uploadLogo(orgName: string, logoUrl: string) {
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
          `[OrgLogo] Error deleting old image from Cloudinary: ${getErrorMessage(err)}`
        );
      }
    }

    return await OrgLogoRepository.upsert(normalised, logoUrl);
  }

  static async deleteLogo(orgName: string) {
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
        `[OrgLogo] Error deleting image from Cloudinary: ${getErrorMessage(err)}`
      );
    }

    return await OrgLogoRepository.deleteByOrganisation(normalised);
  }
}

export default OrgLogoService;
