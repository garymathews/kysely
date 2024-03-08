"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isMergeQueryBuilder = exports.isDeleteQueryBuilder = exports.isUpdateQueryBuilder = exports.isInsertQueryBuilder = exports.isSelectQueryBuilder = void 0;
/**
 * A helper method to determine if a query builder object is of type {@link SelectQueryBuilder}.
 *
 * Useful when using the {@link AnyQueryBuilder} type.
 */
function isSelectQueryBuilder(qb) {
    return !!qb.isSelectQueryBuilder;
}
exports.isSelectQueryBuilder = isSelectQueryBuilder;
/**
 * A helper method to determine if a query builder object is of type {@link InsertQueryBuilder}.
 *
 * Useful when using the {@link AnyQueryBuilder} type.
 */
function isInsertQueryBuilder(qb) {
    return !!qb.isInsertQueryBuilder;
}
exports.isInsertQueryBuilder = isInsertQueryBuilder;
/**
 * A helper method to determine if a query builder object is of type {@link UpdateQueryBuilder}.
 *
 * Useful when using the {@link AnyQueryBuilder} type.
 */
function isUpdateQueryBuilder(qb) {
    return !!qb.isUpdateQueryBuilder;
}
exports.isUpdateQueryBuilder = isUpdateQueryBuilder;
/**
 * A helper method to determine if a query builder object is of type {@link DeleteQueryBuilder}.
 *
 * Useful when using the {@link AnyQueryBuilder} type.
 */
function isDeleteQueryBuilder(qb) {
    return !!qb.isDeleteQueryBuilder;
}
exports.isDeleteQueryBuilder = isDeleteQueryBuilder;
/**
 * A helper method to determine if a query builder object is of type {@link MergeQueryBuilder}.
 *
 * Useful when using the {@link AnyQueryBuilder} type.
 */
function isMergeQueryBuilder(qb) {
    return !!qb.isMergeQueryBuilder;
}
exports.isMergeQueryBuilder = isMergeQueryBuilder;
