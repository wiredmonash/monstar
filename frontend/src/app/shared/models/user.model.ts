import { Types } from "mongoose";

export class User {
    _id: Types.ObjectId;
    email: string;
    username: string;
    reviews: Types.ObjectId[];
    profileImg: string;
    admin: boolean;
    verified: boolean;

    constructor (_id?: Types.ObjectId, email?: string, username?: string, reviews?: Types.ObjectId[], profileImg?: string, admin?: boolean, verified?: boolean) {
        this._id = _id || new Types.ObjectId();
        this.email = email || '';
        this.username = username || email?.slice(0, 8) || '';
        this.reviews = reviews || [];
        this.profileImg = profileImg || '';
        this.admin = admin || false;
        this.verified = verified || false;
    }
}