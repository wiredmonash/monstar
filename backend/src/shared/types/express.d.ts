import type { JwtPayload } from 'jsonwebtoken';

declare global {
  /**
   * Decoded JWT payload. Tokens are signed by TokenProvider with `{ id, isAdmin }`.
   * `admin` is also declared because verifyUser/verifyAdmin read `req.user.admin`
   * (a pre-existing mismatch with the signed `isAdmin` field, preserved as-is).
   */
  interface TokenPayload extends JwtPayload {
    id: string;
    isAdmin?: boolean;
    admin?: boolean;
  }

  namespace Express {
    interface Request {
      // Populated by verifyToken / userMiddleware from the decoded JWT.
      user?: TokenPayload;
    }
  }
}

export {};
