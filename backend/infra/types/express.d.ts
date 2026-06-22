// Ambient augmentation: `req.user` is populated by verifyToken / userMiddleware
// from the decoded JWT. Loosely typed for the structural conversion; tightened
// to a concrete payload shape in Phase 4.
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export {};
