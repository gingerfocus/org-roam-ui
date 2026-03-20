import React, { useEffect, useState } from 'react'

import { Toolbar } from './Toolbar'
import { TagBar } from './TagBar'
import { Note } from './Note'
import { Title } from './Title'

import { VStack, Flex, Box, IconButton, useDisclosure } from '@chakra-ui/react'
import { GraphData, NodeObject, LinkObject } from 'force-graph'
import { OrgRoamNode } from '../../api'
import { LinksByNodeId, NodeByCite, NodeById, Scope } from '../../pages/index'
import { usePersistantState } from '../lib/persistant-state'
import { initialFilter, TagColors } from '../config'
import { BiDotsVerticalRounded } from 'react-icons/bi'

export interface SidebarProps {
  isOpen: boolean
  onClose: any
  onOpen: any
  nodeById: NodeById
  previewNode: NodeObject | null
  setPreviewNode: any
  linksByNodeId: LinksByNodeId
  nodeByCite: NodeByCite
  setSidebarHighlightedNode: any
  canUndo: any
  canRedo: any
  resetPreviewNode: any
  previousPreviewNode: any
  nextPreviewNode: any
  openContextMenu: any
  scope: Scope
  setScope: any
  windowWidth: number
  filter: typeof initialFilter
  setFilter: any
  tagColors: TagColors
  setTagColors: any
  macros?: { [key: string]: string }
  attachDir: string
  useInheritance: boolean
}

export const Sidebar = (props: SidebarProps) => {
  const {
    isOpen,
    onOpen,
    onClose,
    previewNode,
    setPreviewNode,
    nodeById,
    linksByNodeId,
    nodeByCite,
    setSidebarHighlightedNode,
    canUndo,
    canRedo,
    resetPreviewNode,
    previousPreviewNode,
    nextPreviewNode,
    openContextMenu,
    windowWidth,
    filter,
    setFilter,
    tagColors,
    setTagColors,
    macros,
    attachDir,
    useInheritance,
  } = props

  const [previewRoamNode, setPreviewRoamNode] = useState<OrgRoamNode | undefined>()
  const [sidebarWidth, setSidebarWidth] = usePersistantState<number>('sidebarWidth', 400)

  useEffect(() => {
    if (!previewNode?.id) {
      onClose()
      return
    }
    onOpen()
    setPreviewRoamNode(previewNode as OrgRoamNode)
  }, [previewNode?.id])

  const [justification, setJustification] = usePersistantState('justification', 1)
  const [outline, setOutline] = usePersistantState('outline', false)
  const justificationList = ['justify', 'start', 'end', 'center']
  const [collapse, setCollapse] = useState(false)

  if (!isOpen) {
    return null
  }

  return (
    <Box
      position="fixed"
      right={0}
      top={0}
      h="100vh"
      w={`${sidebarWidth}px`}
      minW="220px"
      maxW={`${windowWidth - 200}px`}
      zIndex={10}
      bg="gray.50"
      borderLeft="1px solid"
      borderColor="gray.200"
      overflow="hidden"
    >
      <Flex flexDir="column" h="100vh" pl={2} color="black" bg="alt.100" width="100%">
        <Flex
          pl={2}
          alignItems="center"
          color="black"
          width="100%"
          borderBottom="1px solid"
          borderColor="gray.200"
        >
          <Toolbar
            {...{
              setJustification,
              setIndent: () => {},
              setFont: () => {},
              justification,
              setPreviewNode,
              canUndo,
              canRedo,
              resetPreviewNode,
              previousPreviewNode,
              nextPreviewNode,
              outline,
              setOutline,
              collapse,
              setCollapse,
            }}
          />
          <Flex flexDir="row" ml="auto">
            <IconButton
              m={1}
              icon={<BiDotsVerticalRounded />}
              aria-label="Options"
              variant="subtle"
              onClick={(e) => {
                openContextMenu(previewNode, e, {
                  left: undefined,
                  top: 12,
                  right: -windowWidth + 20,
                  bottom: undefined,
                })
              }}
            />
          </Flex>
        </Flex>
        <Box flex={1} overflowY="auto" p={4}>
          {previewRoamNode && (
            <VStack
              flexGrow={1}
              alignItems="left"
              bg="alt.100"
              paddingLeft={4}
            >
              <Title previewNode={previewRoamNode} />
              <TagBar
                {...{ filter, setFilter, tagColors, setTagColors, openContextMenu, previewNode }}
              />
              <Note
                {...{
                  setPreviewNode,
                  previewNode,
                  nodeById,
                  nodeByCite,
                  setSidebarHighlightedNode,
                  justification,
                  justificationList,
                  linksByNodeId,
                  openContextMenu,
                  outline,
                  setOutline,
                  collapse,
                  macros,
                  attachDir,
                  useInheritance,
                }}
              />
            </VStack>
          )}
        </Box>
      </Flex>
    </Box>
  )
}