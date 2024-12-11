import { Review } from "./review.model";

export class User {
    email: string;
    username: string;
    reviews: Review[];
    profileImg: string;
    admin: boolean;

    constructor (email: string, username?: string, reviews?: Review[], profileImg?: string, admin?: boolean) {
        this.email = email;
        this.username = username || email.slice(0, 8);
        this.reviews = reviews || [];
        this.profileImg = profileImg || '';
        this.admin = admin || false;
    }
}