import { Types } from 'mongoose';

export class Notification {
  _id: Types.ObjectId;
  data: ReviewData;
  navigateTo: String;
  isRead: boolean;
  constructor(
    _id: Types.ObjectId,
    data: ReviewData,
    navigateTo: String,
    isRead: boolean
  ) {
    this._id = _id;
    this.data = data;
    this.navigateTo = navigateTo;
    this.isRead = isRead;
  }
}

export class ReviewData {
  message: String;
  user: {
    profileImg: String;
    username: String;
  };
  constructor(message: String, user: any) {
    this.message = message;
    this.user = user;
  }
}
