// Preview builds (preview-worktree skill): relative URLs so requests stay
// same-origin and flow through the dev-server proxy to the per-slot backend.
export const environment = {
  production: false,
  apiUrl: '/api/v1',
  apiV2Url: '/api/v2',
  setuUrl: '/api/v2/setus',
  githubUrl: '/api/v2/github',
  enableSetuCards: false,
};
