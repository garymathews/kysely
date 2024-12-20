/// <reference types="./over-builder.d.ts" />
import { OverNode } from '../operation-node/over-node.js';
import { parseOrderBy, } from '../parser/order-by-parser.js';
import { parsePartitionBy, } from '../parser/partition-by-parser.js';
import { freeze } from '../util/object-utils.js';
import { preventAwait } from '../util/prevent-await.js';
export class OverBuilder {
    #props;
    constructor(props) {
        this.#props = freeze(props);
    }
    /**
     * Adds an order by clause item inside the over function.
     *
     * ```ts
     * const result = await db
     *   .selectFrom('person')
     *   .select(
     *     (eb) => eb.fn.avg<number>('age').over(
     *       ob => ob.orderBy('first_name', 'asc').orderBy('last_name', 'asc')
     *     ).as('average_age')
     *   )
     *   .execute()
     * ```
     *
     * The generated SQL (PostgreSQL):
     *
     * ```sql
     * select avg("age") over(order by "first_name" asc, "last_name" asc) as "average_age"
     * from "person"
     * ```
     */
    orderBy(orderBy, direction) {
        return new OverBuilder({
            overNode: OverNode.cloneWithOrderByItems(this.#props.overNode, parseOrderBy([orderBy, direction])),
        });
    }
    partitionBy(partitionBy) {
        return new OverBuilder({
            overNode: OverNode.cloneWithPartitionByItems(this.#props.overNode, parsePartitionBy(partitionBy)),
        });
    }
    /**
     * Simply calls the provided function passing `this` as the only argument. `$call` returns
     * what the provided function returns.
     */
    $call(func) {
        return func(this);
    }
    toOperationNode() {
        return this.#props.overNode;
    }
}
preventAwait(OverBuilder, "don't await OverBuilder instances. They are never executed directly and are always just a part of a query.");
