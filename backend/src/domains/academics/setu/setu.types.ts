import type { DocOf, PlainOf } from '@shared/types';

import SetuModel from './setu.model';

export type ISETU = DocOf<typeof SetuModel>;
export type ISETULean = PlainOf<typeof SetuModel>;
