import { OrgRoamNode } from '../../api'
import { initialColoring, initialVisuals } from '../config'
import { LinksByNodeId } from '../../pages'

export const getNodeColor = ({
  node,
  theme,
  highlightedNodes,
  previouslyHighlightedNodes,
  visuals,
  tagColors,
  highlightColors,
  opacity,
  emacsNodeId,
  linksByNodeId,
  cluster,
  coloring,
}: {
  node: OrgRoamNode
  theme: any
  visuals: typeof initialVisuals
  highlightedNodes: Record<string, any>
  previouslyHighlightedNodes: Record<string, any>
  tagColors: Record<string, any>
  highlightColors: Record<string, any>
  opacity: number
  emacsNodeId: string | null
  linksByNodeId: LinksByNodeId
  cluster: any
  coloring: typeof initialColoring
}) => {
  return theme.colors?.blue || '#3182ce'
}