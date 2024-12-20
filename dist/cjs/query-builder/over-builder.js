"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OverBuilder = void 0;
const over_node_js_1 = require("../operation-node/over-node.js");
const order_by_parser_js_1 = require("../parser/order-by-parser.js");
const partition_by_parser_js_1 = require("../parser/partition-by-parser.js");
const object_utils_js_1 = require("../util/object-utils.js");
const prevent_await_js_1 = require("../util/prevent-await.js");
class OverBuilder {
    #props;
    constructor(props) {
        this.#props = (0, object_utils_js_1.freeze)(props);
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
            overNode: over_node_js_1.OverNode.cloneWithOrderByItems(this.#props.overNode, (0, order_by_parser_js_1.parseOrderBy)([orderBy, direction])),
        });
    }
    partitionBy(partitionBy) {
        return new OverBuilder({
            overNode: over_node_js_1.OverNode.cloneWithPartitionByItems(this.#props.overNode, (0, partition_by_parser_js_1.parsePartitionBy)(partitionBy)),
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
exports.OverBuilder = OverBuilder;
(0, prevent_await_js_1.preventAwait)(OverBuilder, "don't await OverBuilder instances. They are never executed directly and are always just a part of a query.");
