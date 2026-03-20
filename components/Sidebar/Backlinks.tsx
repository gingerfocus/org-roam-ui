import { LinksByNodeId, NodeByCite, NodeById } from '../../pages/index'
import { NodeObject, LinkObject } from 'force-graph'
import { VStack, Box, Text, StackDivider, Link } from '@chakra-ui/react'
import React from 'react'
import { OrgRoamNode } from '../../api'

export interface BacklinksProps {
  previewNode: NodeObject | OrgRoamNode
  setPreviewNode: any
  nodeById: NodeById
  linksByNodeId: LinksByNodeId
  nodeByCite: NodeByCite
  setSidebarHighlightedNode: any
  openContextMenu: any
  outline: boolean
  attachDir: string
  useInheritance: boolean
  macros: { [key: string]: string }
}

function normalizeLinkEnds(link: LinkObject): [string, string] {
  const source = typeof link.source === 'object' ? (link.source as any).id : link.source
  const target = typeof link.target === 'object' ? (link.target as any).id : link.target
  return [source as string, target as string]
}

export const Backlinks = (props: BacklinksProps) => {
  const {
    previewNode,
    setPreviewNode,
    nodeById,
    linksByNodeId,
  } = props
  
  const links = linksByNodeId[(previewNode as OrgRoamNode)?.id] ?? []

  const backLinks = links
    .filter((link: LinkObject) => {
      const [source, target] = normalizeLinkEnds(link)
      return source !== previewNode?.id
    })
    .map((l) => l.source)

  return (
    <Box className="backlinks" borderRadius="sm" mt={6} p={4} bg="white" mb={10}>
      <Text fontSize="md" fontWeight="semibold">{`Linked references (${backLinks.length})`}</Text>
      <VStack
        py={2}
        spacing={3}
        alignItems="start"
        divider={<StackDivider borderColor="gray.500" />}
        align="stretch"
        color="gray.800"
      >
        {previewNode?.id &&
          backLinks.map((link) => {
            const targetNode = nodeById[link as string]
            const title = targetNode?.title ?? link as string
            return (
              <Box overflow="hidden" py={1} borderRadius="sm" width="100%" key={link}>
                <Link
                  color="blue.500"
                  cursor="pointer"
                  onClick={() => {
                    if (targetNode) {
                      setPreviewNode(targetNode)
                    }
                  }}
                  _hover={{ textDecoration: 'underline' }}
                >
                  {title}
                </Link>
              </Box>
            )
          })}
      </VStack>
    </Box>
  )
}