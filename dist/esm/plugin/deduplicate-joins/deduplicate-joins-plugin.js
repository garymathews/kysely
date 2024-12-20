/// <reference types="./deduplicate-joins-plugin.d.ts" />
import { DeduplicateJoinsTransformer } from './deduplicate-joins-transformer.js';
/**
 * Plugin that removes duplicate joins from queries.
 *
 * See [this recipe](https://github.com/koskimas/kysely/tree/master/site/docs/recipes/deduplicate-joins.md)
 */
export class DeduplicateJoinsPlugin {
    #transformer = new DeduplicateJoinsTransformer();
    transformQuery(args) {
        return this.#transformer.transformNode(args.node);
    }
    transformResult(args) {
        return Promise.resolve(args.result);
    }
}
