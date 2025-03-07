import { Types } from "mongoose";

// Define interface for user data
export interface UserData {
  _id?: Types.ObjectId;
  email?: string;
  username?: string;
  isGoogleUser?: boolean;
  reviews?: Types.ObjectId[];
  profileImg?: string;
  admin?: boolean;
  verified?: boolean;
  likedReviews?: Types.ObjectId[];
  dislikedReviews?: Types.ObjectId[];
}

export class User {
  _id!: Types.ObjectId;
  email!: string;
  username!: string;
  isGoogleUser!: boolean;
  reviews!: Types.ObjectId[];
  profileImg!: string;
  admin!: boolean;
  verified!: boolean;
  likedReviews!: Types.ObjectId[];
  dislikedReviews!: Types.ObjectId[];

  constructor(data?: UserData) {
    // Default avatar URL
    const defaultAvatar = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSWwfGUCDwrZZK12xVpCOqngxSpn0BDpq6ewQ&s';
    
    if (!data) {
      // Handle case where data is undefined
      this._id = new Types.ObjectId();
      this.email = '';
      this.username = '';
      this.isGoogleUser = false;
      this.reviews = [];
      this.profileImg = defaultAvatar;
      this.admin = false;
      this.verified = false;
      this.likedReviews = [];
      this.dislikedReviews = [];
      return;
    }

    // Assign values with safe property access
    this._id = data._id ?? new Types.ObjectId();
    this.email = data.email ?? '';
    
    // Derive username from email if not provided
    this.username = data.username ?? (data.email?.slice(0, 8) ?? '');
    
    this.isGoogleUser = data.isGoogleUser ?? false;
    this.reviews = data.reviews ?? [];
    this.profileImg = data.profileImg ?? defaultAvatar;
    this.admin = data.admin ?? false;
    this.verified = data.verified ?? false;
    this.likedReviews = data.likedReviews ?? [];
    this.dislikedReviews = data.dislikedReviews ?? [];
  }

  // Maintain backward compaitibility for constructing User objects
  static fromDetailedConstructor(
    _id?: Types.ObjectId, 
    email?: string, 
    username?: string, 
    isGoogleUser?: boolean,
    reviews?: Types.ObjectId[], 
    profileImg?: string, 
    admin?: boolean, 
    verified?: boolean, 
    likedReviews?: Types.ObjectId[],
    dislikedReviews?: Types.ObjectId[]
  ): User {
    return new User({
      _id, email, username, isGoogleUser, reviews,
      profileImg, admin, verified, likedReviews, dislikedReviews
    });
  }

  addLikedReview(reviewId: Types.ObjectId): void {
    this.likedReviews.push(reviewId);
  }

  removeLikedReview(reviewId: Types.ObjectId): void {
    this.likedReviews = this.likedReviews.filter(id => id !== reviewId);
  }

  addDislikedReview(reviewId: Types.ObjectId): void {
    this.dislikedReviews.push(reviewId);
  }

  removeDislikedReview(reviewId: Types.ObjectId): void {
    this.dislikedReviews = this.dislikedReviews.filter(id => id !== reviewId);
  }

  // Additional helper methods
  hasLikedReview(reviewId: Types.ObjectId | string): boolean {
    const idString = reviewId.toString();
    return this.likedReviews.some(id => id.toString() === idString);
  }

  hasDislikedReview(reviewId: Types.ObjectId | string): boolean {
    const idString = reviewId.toString();
    return this.dislikedReviews.some(id => id.toString() === idString);
  }
}