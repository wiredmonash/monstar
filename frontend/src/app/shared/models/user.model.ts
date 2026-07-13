
// Define interface for user data
export interface UserData {
  _id?: string;
  email?: string;
  username?: string;
  isGoogleUser?: boolean;
  reviews?: string[];
  profileImg?: string;
  admin?: boolean;
  verified?: boolean;
  likedReviews?: string[];
  dislikedReviews?: string[];
  notifications?: object[];
}

export class User {
  _id!: string;
  email!: string;
  username!: string;
  isGoogleUser!: boolean;
  reviews!: string[];
  profileImg!: string;
  admin!: boolean;
  verified!: boolean;
  likedReviews!: string[];
  dislikedReviews!: string[];
  notifications!: object[];

  constructor(data?: UserData) {
    // Default avatar URL
    const defaultAvatar =
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSWwfGUCDwrZZK12xVpCOqngxSpn0BDpq6ewQ&s';

    if (!data) {
      // Handle case where data is undefined
      this._id = '';
      this.email = '';
      this.username = '';
      this.isGoogleUser = false;
      this.reviews = [];
      this.profileImg = defaultAvatar;
      this.admin = false;
      this.verified = false;
      this.likedReviews = [];
      this.dislikedReviews = [];
      this.notifications = [];
      return;
    }

    // Assign values with safe property access
    this._id = data._id ?? '';
    this.email = data.email ?? '';

    // Derive username from email if not provided
    this.username = data.username ?? data.email?.slice(0, 8) ?? '';

    this.isGoogleUser = data.isGoogleUser ?? false;
    this.reviews = data.reviews ?? [];
    this.profileImg = data.profileImg ?? defaultAvatar;
    this.admin = data.admin ?? false;
    this.verified = data.verified ?? false;
    this.likedReviews = data.likedReviews ?? [];
    this.dislikedReviews = data.dislikedReviews ?? [];
    this.notifications = data.notifications ?? [];
  }

  // Maintain backward compaitibility for constructing User objects
  static fromDetailedConstructor(
    _id?: string,
    email?: string,
    username?: string,
    isGoogleUser?: boolean,
    reviews?: string[],
    profileImg?: string,
    admin?: boolean,
    verified?: boolean,
    likedReviews?: string[],
    dislikedReviews?: string[],
    notifications?: object[]
  ): User {
    return new User({
      _id,
      email,
      username,
      isGoogleUser,
      reviews,
      profileImg,
      admin,
      verified,
      likedReviews,
      dislikedReviews,
      notifications,
    });
  }

  removeNotification(notificationId: string) {
    this.notifications = this.notifications.filter(
      (id) => String(id) !== notificationId
    );
  }

  addLikedReview(reviewId: string): void {
    this.likedReviews.push(reviewId);
  }

  removeLikedReview(reviewId: string): void {
    this.likedReviews = this.likedReviews.filter((id) => id !== reviewId);
  }

  addDislikedReview(reviewId: string): void {
    this.dislikedReviews.push(reviewId);
  }

  removeDislikedReview(reviewId: string): void {
    this.dislikedReviews = this.dislikedReviews.filter((id) => id !== reviewId);
  }

  // Additional helper methods
  hasLikedReview(reviewId: string | string): boolean {
    const idString = reviewId.toString();
    return this.likedReviews.some((id) => id.toString() === idString);
  }

  hasDislikedReview(reviewId: string | string): boolean {
    const idString = reviewId.toString();
    return this.dislikedReviews.some((id) => id.toString() === idString);
  }
}
