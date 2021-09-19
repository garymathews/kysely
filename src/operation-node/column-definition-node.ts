import { freeze } from '../util/object-utils'
import { CheckConstraintNode } from './check-constraint-node'
import { columnNode, ColumnNode } from './column-node'
import { DataTypeNode } from './data-type-node'
import { OperationNode } from './operation-node'
import { RawNode } from './raw-node'
import { ReferencesNode } from './references-node'
import { ValueNode } from './value-node'

export type ColumnDefinitionNodeParams = Omit<
  Partial<ColumnDefinitionNode>,
  'kind'
>
export type ColumnDataTypeNode = DataTypeNode | RawNode

export interface ColumnDefinitionNode extends OperationNode {
  readonly kind: 'ColumnDefinitionNode'
  readonly column: ColumnNode
  readonly dataType: ColumnDataTypeNode
  readonly references?: ReferencesNode
  readonly isPrimaryKey: boolean
  readonly isAutoIncrementing: boolean
  readonly isUnique: boolean
  readonly isNullable: boolean
  readonly defaultTo?: ValueNode | RawNode
  readonly check?: CheckConstraintNode
}

/**
 * @internal
 */
export const columnDefinitionNode = freeze({
  is(node: OperationNode): node is ColumnDefinitionNode {
    return node.kind === 'ColumnDefinitionNode'
  },

  create(column: string, dataType: ColumnDataTypeNode): ColumnDefinitionNode {
    return freeze({
      kind: 'ColumnDefinitionNode',
      column: columnNode.create(column),
      dataType,
      isPrimaryKey: false,
      isAutoIncrementing: false,
      isUnique: false,
      isNullable: true,
    })
  },

  cloneWith(
    node: ColumnDefinitionNode,
    params: ColumnDefinitionNodeParams
  ): ColumnDefinitionNode {
    return freeze({
      ...node,
      ...params,
    })
  },
})