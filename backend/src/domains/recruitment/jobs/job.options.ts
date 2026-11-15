const JOB_STATUS = {
  OPEN: 'OPEN',
  CLOSED: 'CLOSED',
  OPENING_SOON: 'Opening Soon',
};

const JOB_ROLE_TYPE = {
  CONSULTING: 'Consulting',
  EDUCATION: 'Education',
  EVENTS: 'Events',
  FINANCE: 'Finance',
  HR: 'HR',
  IT: 'IT',
  MARKETING_MEDIA: 'Marketing / Media',
  OTHER: 'Other',
  PARTNERSHIPS_SPONSORSHIPS: 'Partnerships / Sponsorships',
  SUBCOMMITTEE: 'Subcommittee',
};

function normalizeJobStatus(status: string) {
  const match = Object.values(JOB_STATUS).find(
    (s) => s.toUpperCase() === status.toUpperCase()
  );
  return match ?? null;
}

function normalizeJobRoleType(roleType: string) {
  const match = Object.values(JOB_ROLE_TYPE).find(
    (rt) => rt.toLowerCase() === roleType.toLowerCase()
  );
  return match ?? null;
}

export { JOB_STATUS, JOB_ROLE_TYPE, normalizeJobStatus, normalizeJobRoleType };
