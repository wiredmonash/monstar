import type { JwtPayload } from 'jsonwebtoken';

declare global {
  /**
   * Decoded JWT payload. Tokens are signed by TokenProvider with `{ id, isAdmin }`.
   */
  interface TokenPayload extends JwtPayload {
    id: string;
    isAdmin?: boolean;
  }

  namespace Express {
    interface Request {
      // Populated by userMiddleware from the decoded JWT.
      user?: TokenPayload;
    }
  }
}

export {};
