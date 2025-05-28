import { SortOrder } from "../graphql/types.js";
import crypto from 'crypto';

export function sortOrderToSQLOrderBy(sortOrder: SortOrder | undefined): string {
  switch (sortOrder) {
    case SortOrder.OLDEST:
      return 'asc';
    default:
      return 'desc';
  }
}

export function createHash(obj: Record<string, any>): string {
  const stringifiedObj = JSON.stringify({ ...obj, HASH_VERSION: 1 });
  return crypto.createHash('sha256').update(stringifiedObj).digest('hex');
}