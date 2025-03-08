import { Unit } from './unit.model';
import { User } from './user.model';

export class Notification {
  id: number;
  username: User['username'];
  profileImg: User['profileImg'];
  unit: Unit['unitCode'];

  constructor(
    id: number,
    username: User['username'],
    profileImg: User['profileImg'],
    unit: Unit['unitCode']
  ) {
    this.id = id;
    this.username = username;
    this.profileImg =
      profileImg ||
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSWwfGUCDwrZZK12xVpCOqngxSpn0BDpq6ewQ&s';
    this.unit = unit;
  }
}
