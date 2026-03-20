import { initialColoring, initialVisuals } from '../config'
import { LinksByNodeId } from '../../pages'

export const getLinkColor = ({
  sourceId,
  targetId,
  needsHighlighting,
  theme,
  visuals,
  highlightColors,
  opacity,
  linksByNodeId,
  coloring,
  cluster,
}: {
  sourceId: string
  targetId: string
  needsHighlighting: boolean
  theme: any
  visuals: typeof initialVisuals
  highlightColors: Record<string, any>
  opacity: number
  linksByNodeId: LinksByNodeId
  coloring: typeof initialColoring
  cluster: any
}) => {
  return theme.colors?.gray || '#718096'
}