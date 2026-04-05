/// <reference types="vite/client" />

export type OrgRoamGraphReponse = {
  nodes: OrgRoamNode[]
  links: OrgRoamLink[]
  tags: string[]
}

export type OrgRoamNode = {
  id: string
  file: string
  title: string
  // heading level
  level: number
  // line number
  pos: number
  // outline path
  olp: string[] | null
  properties: { [key: string]: string | number }
  tags: string[]
}

export type OrgRoamLink = {
  source: string
  target: string
  type: string
}
