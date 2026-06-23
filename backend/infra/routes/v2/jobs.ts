import express from 'express';
import multer from 'multer';

import JobController from '@controllers/job.controller';
import OrgLogoController from '@controllers/orgLogo.controller';
import adminMiddleware from '@middleware/admin.middleware';
import userMiddleware from '@middleware/user.middleware';
import { orgStorage } from '@providers/cloudinary.provider';

const router = express.Router();
const uploadLogo = multer({ storage: orgStorage });

router.get(
  '/',
  // #swagger.tags = ['Jobs']
  // #swagger.summary = 'Get all jobs'
  JobController.getAll
);

router.get(
  '/open',
  // #swagger.tags = ['Jobs']
  // #swagger.summary = 'Get all open job listings'
  JobController.getOpen
);

router.get(
  '/logos',
  // #swagger.tags = ['Jobs']
  // #swagger.summary = 'Get all organisation logos'
  OrgLogoController.getAll
);

router.put(
  '/logos',
  adminMiddleware,
  uploadLogo.single('logo'),
  // #swagger.tags = ['Jobs']
  // #swagger.summary = 'Upload or update an organisation logo (admin only)'
  OrgLogoController.upload
);

router.delete(
  '/logos/:organisation',
  adminMiddleware,
  // #swagger.tags = ['Jobs']
  // #swagger.summary = 'Delete an organisation logo (admin only)'
  OrgLogoController.delete
);

router.get(
  '/status/:status',
  // #swagger.tags = ['Jobs']
  // #swagger.summary = 'Get job listings by status (OPEN, CLOSED, Opening Soon)'
  JobController.getByStatus
);

router.get(
  '/role-type/:roleType',
  // #swagger.tags = ['Jobs']
  // #swagger.summary = 'Get job listings by role type category'
  JobController.getByRoleType
);

router.get(
  '/:notionId',
  // #swagger.tags = ['Jobs']
  // #swagger.summary = 'Get a single job listing by ID'
  JobController.getById
);

router.post(
  '/refresh-cache',
  userMiddleware,
  // #swagger.tags = ['Jobs']
  // #swagger.summary = 'Invalidate jobs cache (auth required)'
  JobController.refreshCache
);

export default router;
