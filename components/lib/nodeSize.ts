import { initialVisuals } from '../config'
import { LinksByNodeId } from '../../pages'
import { NodeObject } from 'force-graph'

export const nodeSize = ({
  linksByNodeId,
  visuals,
  highlightedNodes,
  previouslyHighlightedNodes,
  opacity,
  node,
}: {
  node: NodeObject
  visuals: typeof initialVisuals
  highlightedNodes: Record<string, any>
  previouslyHighlightedNodes: Record<string, any>
  opacity: number
  linksByNodeId: LinksByNodeId
}) => {
  return 5
}