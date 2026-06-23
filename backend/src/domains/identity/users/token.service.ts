import crypto from 'node:crypto';

import jwt, { SignOptions } from 'jsonwebtoken';
import type { Types } from 'mongoose';

class TokenProvider {
  static REFRESH_TOKEN_BYTE_LENGTH = 40;

  static ACCESS_TOKEN_EXPIRY = 15 * 60 * 1000; // 15 minutes
  static REFRESH_TOKEN_EXPIRY = 180 * 24 * 60 * 60 * 1000; // 180 days

  static generateAccessToken(
    userId: string | Types.ObjectId,
    isAdmin: boolean
  ) {
    const options: SignOptions = {
      expiresIn:
        this.ACCESS_TOKEN_EXPIRY.toString() as SignOptions['expiresIn'],
    };
    return jwt.sign(
      { id: userId, isAdmin },
      process.env.JWT_SECRET as string,
      options
    );
  }

  static generateRefreshToken() {
    return crypto.randomBytes(this.REFRESH_TOKEN_BYTE_LENGTH).toString('hex');
  }

  static hashRefreshToken(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}

export default TokenProvider;
