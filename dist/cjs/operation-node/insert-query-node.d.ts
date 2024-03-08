import { ColumnNode } from './column-node.js';
import { ExplainNode } from './explain-node.js';
import { OnConflictNode } from './on-conflict-node.js';
import { OnDuplicateKeyNode } from './on-duplicate-key-node.js';
import { OperationNode } from './operation-node.js';
import { ReturningNode } from './returning-node.js';
import { TableNode } from './table-node.js';
import { TopNode } from './top-node.js';
import { WithNode } from './with-node.js';
export type InsertQueryNodeProps = Omit<InsertQueryNode, 'kind' | 'into'>;
export interface InsertQueryNode extends OperationNode {
    readonly kind: 'InsertQueryNode';
    readonly into?: TableNode;
    readonly columns?: ReadonlyArray<ColumnNode>;
    readonly values?: OperationNode;
    readonly returning?: ReturningNode;
    readonly onConflict?: OnConflictNode;
    readonly onDuplicateKey?: OnDuplicateKeyNode;
    readonly with?: WithNode;
    readonly ignore?: boolean;
    readonly replace?: boolean;
    readonly explain?: ExplainNode;
    readonly defaultValues?: boolean;
    readonly top?: TopNode;
}
/**
 * @internal
 */
export declare const InsertQueryNode: Readonly<{
    is(node: OperationNode): node is InsertQueryNode;
    create(into: TableNode, withNode?: WithNode, replace?: boolean): InsertQueryNode;
    createWithoutInto(): InsertQueryNode;
    cloneWith(insertQuery: InsertQueryNode, props: InsertQueryNodeProps): InsertQueryNode;
}>;