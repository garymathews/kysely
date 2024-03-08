/// <reference types="./query-utils.d.ts" />
/**
 * A helper method to determine if a query builder object is of type {@link SelectQueryBuilder}.
 *
 * Useful when using the {@link AnyQueryBuilder} type.
 */
export function isSelectQueryBuilder(qb) {
    return !!qb.isSelectQueryBuilder;
}
/**
 * A helper method to determine if a query builder object is of type {@link InsertQueryBuilder}.
 *
 * Useful when using the {@link AnyQueryBuilder} type.
 */
export function isInsertQueryBuilder(qb) {
    return !!qb.isInsertQueryBuilder;
}
/**
 * A helper method to determine if a query builder object is of type {@link UpdateQueryBuilder}.
 *
 * Useful when using the {@link AnyQueryBuilder} type.
 */
export function isUpdateQueryBuilder(qb) {
    return !!qb.isUpdateQueryBuilder;
}
/**
 * A helper method to determine if a query builder object is of type {@link DeleteQueryBuilder}.
 *
 * Useful when using the {@link AnyQueryBuilder} type.
 */
export function isDeleteQueryBuilder(qb) {
    return !!qb.isDeleteQueryBuilder;
}
/**
 * A helper method to determine if a query builder object is of type {@link MergeQueryBuilder}.
 *
 * Useful when using the {@link AnyQueryBuilder} type.
 */
export function isMergeQueryBuilder(qb) {
    return !!qb.isMergeQueryBuilder;
}
