import asyncHandler from '@utilities/asyncHandler';

import {
  isValidJobStatus,
  isValidJobRoleType,
  normalizeJobStatus,
  normalizeJobRoleType,
} from '@constants/jobOptions';
import JobService from '@services/job.service';

class JobController {
  static getAll = asyncHandler(async (req, res) => {
    const jobs = await JobService.fetchAll();
    return res.status(200).json(jobs);
  });

  static getOpen = asyncHandler(async (req, res) => {
    const jobs = await JobService.fetchOpen();
    return res.status(200).json(jobs);
  });

  static getByStatus = asyncHandler(async (req, res) => {
    const { status } = req.params;
    if (!isValidJobStatus(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: OPEN, CLOSED, Opening Soon`,
      });
    }
    const jobs = await JobService.fetchByStatus(normalizeJobStatus(status));
    return res.status(200).json(jobs);
  });

  static getById = asyncHandler(async (req, res) => {
    const { notionId } = req.params;
    const job = await JobService.fetchByNotionId(notionId);
    return res.status(200).json(job);
  });

  static getByRoleType = asyncHandler(async (req, res) => {
    const { roleType } = req.params;
    if (!isValidJobRoleType(roleType)) {
      return res.status(400).json({
        error: `Invalid role type. Must be one of: Consulting, Education, Events, Finance, HR, IT, Marketing / Media, Other, Partnerships / Sponsorships, Subcommittee`,
      });
    }
    const jobs = await JobService.fetchByRoleType(
      normalizeJobRoleType(roleType)
    );
    return res.status(200).json(jobs);
  });

  static refreshCache = asyncHandler(async (req, res) => {
    await JobService.invalidateCache();
    return res
      .status(200)
      .json({ message: 'Jobs cache invalidated successfully' });
  });
}

export = JobController;
