import { SortOrder } from "../graphql/types.js";

export function sortOrderToSQLOrderBy(sortOrder: SortOrder | undefined): string {
  switch (sortOrder) {
    case SortOrder.OLDEST:
      return 'asc';
    default:
      return 'desc';
  }
}