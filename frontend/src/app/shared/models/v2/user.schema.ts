export interface IUser {
  _id: string;
  email: string;
  username?: string;
  isGoogleUser: boolean;
  googleID: string | null;

  reviews: string[];

  profileImg?: string;
  admin: boolean;

  refreshToken?: string;
  refreshTokenExpires?: Date;

  likedReviews: string[];
  dislikedReviews: string[];

  notifications: string[];
}

export type AuthState = 'logged out' | 'logged in';
