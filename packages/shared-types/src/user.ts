import type { EntityId, IsoDateTimeString } from './common';

export type UserRole = 'user' | 'admin' | 'developer';

/** Shared user domain model. Authentication credentials are intentionally excluded. */
export interface User {
  id: EntityId;
  displayName: string;
  email?: string;
  phone?: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
}
