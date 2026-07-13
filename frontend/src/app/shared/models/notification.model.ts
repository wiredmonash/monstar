
export class Notification {
  _id: string;
  data: ReviewData;
  navigateTo: string;
  isRead: boolean;
  constructor(
    _id: string,
    data: ReviewData,
    navigateTo: string,
    isRead: boolean
  ) {
    this._id = _id;
    this.data = data;
    this.navigateTo = navigateTo;
    this.isRead = isRead;
  }
}

export class ReviewData {
  message: string;
  user: {
    profileImg: string;
    username: string;
  };
  constructor(message: string, user: any) {
    this.message = message;
    this.user = user;
  }
}
