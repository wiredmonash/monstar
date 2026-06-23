import type { DocOf } from '@shared/types';

import UserModel from './user.model';

export type IUser = DocOf<typeof UserModel>;
