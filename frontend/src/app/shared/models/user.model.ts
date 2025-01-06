import { Types } from "mongoose";

export class User {
    _id: Types.ObjectId;
    email: string;
    username: string;
    reviews: Types.ObjectId[];
    profileImg: string;
    admin: boolean;
    verified: boolean;
    likedReviews: Types.ObjectId[];
    dislikedReviews: Types.ObjectId[];

    constructor (
        _id?: Types.ObjectId, 
        email?: string, 
        username?: string, 
        reviews?: Types.ObjectId[], 
        profileImg?: string, 
        admin?: boolean, 
        verified?: boolean, 
        likedReviews?: Types.ObjectId[],
        dislikedReviews?: Types.ObjectId[]
    ) {
        this._id = _id || new Types.ObjectId();
        this.email = email || '';
        this.username = username || email?.slice(0, 8) || '';
        this.reviews = reviews || [];
        this.profileImg = profileImg || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSWwfGUCDwrZZK12xVpCOqngxSpn0BDpq6ewQ&s';
        this.admin = admin || false;
        this.verified = verified || false;
        this.likedReviews = likedReviews || [];
        this.dislikedReviews = dislikedReviews || [];
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

    
}