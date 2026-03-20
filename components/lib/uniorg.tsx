import React from 'react'
import { LinksByNodeId, NodeByCite, NodeById } from '../../pages/index'

export interface ProcessedOrg {
  content: any
}

export interface UniOrgProps {
  nodeById: NodeById
  previewNode: any
  setPreviewNode: any
  nodeByCite: NodeByCite
  setSidebarHighlightedNode: any
  openContextMenu: any
  outline: boolean
  collapse: boolean
  linksByNodeId: LinksByNodeId
  macros?: { [key: string]: string }
  attachDir: string
  useInheritance: boolean
}

export const UniOrg = (props: UniOrgProps) => {
  return React.createElement('div', null, 'Org content rendering not implemented')
}