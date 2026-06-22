import asyncHandler from '@utilities/asyncHandler';

import OrgLogoService from '@services/orgLogo.service';

class OrgLogoController {
  static getAll = asyncHandler(async (req, res) => {
    const logos = await OrgLogoService.getAll();
    return res.status(200).json(logos);
  });

  static upload = asyncHandler(async (req, res) => {
    const { organisation } = req.body;
    if (!organisation) {
      return res.status(400).json({ error: 'Organisation name is required' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Logo file is required' });
    }

    const logoUrl = req.file.path;
    const logo = await OrgLogoService.uploadLogo(organisation, logoUrl);
    return res
      .status(200)
      .json({ message: 'Logo uploaded successfully', data: logo });
  });

  static delete = asyncHandler(async (req, res) => {
    const organisation = req.params.organisation;
    const deleted = await OrgLogoService.deleteLogo(organisation);

    if (!deleted) {
      return res.status(404).json({ error: 'Logo not found' });
    }

    return res.status(200).json({ message: 'Logo deleted successfully' });
  });
}

export = OrgLogoController;
