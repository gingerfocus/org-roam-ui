import React, { useEffect, useState } from 'react'
import { NodeObject } from 'force-graph'
import { Box, Flex, Text, Link, Code, Heading, Divider, Spinner } from '@chakra-ui/react'
import { LinksByNodeId, NodeById } from '../../pages'
import { Backlinks } from './Backlinks'
import { OrgRoamNode } from '../../api'

export interface NoteProps {
  setPreviewNode: any
  previewNode: NodeObject | null
  nodeById: NodeById
  linksByNodeId: LinksByNodeId
  setSidebarHighlightedNode: any
  justification: number
  justificationList: string[]
  openContextMenu: any
  outline: boolean
  collapse: boolean
}

function parseBasicOrgContent(content: string): React.ReactNode[] {
  if (!content) return []

  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let inCodeBlock = false
  let codeBlockContent: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (line.startsWith('#+BEGIN_SRC') || line.startsWith('#+BEGIN_EXAMPLE')) {
      inCodeBlock = true
      codeBlockContent = []
      continue
    }

    if (line.startsWith('#+END_SRC') || line.startsWith('#+END_EXAMPLE')) {
      inCodeBlock = false
      if (codeBlockContent.length > 0) {
        elements.push(
          <Box key={`code-${i}`} my={2} p={3} bg="gray.100" borderRadius="md">
            <Code display="block" whiteSpace="pre-wrap" fontSize="sm">
              {codeBlockContent.join('\n')}
            </Code>
          </Box>
        )
      }
      codeBlockContent = []
      continue
    }

    if (inCodeBlock) {
      codeBlockContent.push(line)
      continue
    }

    if (line.startsWith('* ')) {
      const headingLevel = (line.match(/^\*+/)?.[0]?.length || 1)
      const headingText = line.replace(/^\*+\s*/, '')
      const size = headingLevel === 1 ? 'lg' : headingLevel === 2 ? 'md' : 'sm'
      elements.push(
        <Heading key={i} size={size} mt={4} mb={2} fontWeight="bold">
          {headingText}
        </Heading>
      )
      continue
    }

    if (line.startsWith('** ')) {
      const headingText = line.replace(/^\*+\s*/, '')
      elements.push(
        <Heading key={i} size="sm" mt={3} mb={1} fontWeight="semibold">
          {headingText}
        </Heading>
      )
      continue
    }

    if (line.startsWith('*** ')) {
      const headingText = line.replace(/^\*+\s*/, '')
      elements.push(
        <Heading key={i} size="xs" mt={2} mb={1}>
          {headingText}
        </Heading>
      )
      continue
    }

    if (line.trim() === '') {
      elements.push(<Box key={i} h={2} />)
      continue
    }

    if (line.startsWith('- ')) {
      const itemText = line.substring(2)
      elements.push(
        <Flex key={i} align="flex-start" ml={4} mb={1}>
          <Text mr={2}>•</Text>
          <Text flex={1}>{renderInlineContent(itemText)}</Text>
        </Flex>
      )
      continue
    }

    if (/^\d+\.\s/.test(line)) {
      const itemText = line.replace(/^\d+\.\s*/, '')
      elements.push(
        <Flex key={i} align="flex-start" ml={4} mb={1}>
          <Text mr={2}>{line.match(/^\d+/)?.[0]}.</Text>
          <Text flex={1}>{renderInlineContent(itemText)}</Text>
        </Flex>
      )
      continue
    }

    elements.push(
      <Text key={i} mb={1}>
        {renderInlineContent(line)}
      </Text>
    )
  }

  return elements
}

function renderInlineContent(text: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  let remaining = text
  let key = 0

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/^\*(.+?)\*/)
    const italicMatch = remaining.match(/^\/(.+?)\//)
    const codeMatch = remaining.match(/^~(.+?)~/)
    const linkMatch = remaining.match(/^\[\[([^\]]+)\]\[([^\]]+)\]\]/)
    const plainLinkMatch = remaining.match(/^\[\[([^\]]+)\]\]/)
    const propertyMatch = remaining.match(/^:PROPERTIES:.*?:END:/)

    if (propertyMatch) {
      remaining = remaining.slice(propertyMatch[0].length)
      continue
    }

    if (boldMatch) {
      parts.push(<Text key={key++} as="b">{boldMatch[1]}</Text>)
      remaining = remaining.slice(boldMatch[0].length)
      continue
    }

    if (italicMatch) {
      parts.push(<Text key={key++} as="em">{italicMatch[1]}</Text>)
      remaining = remaining.slice(italicMatch[0].length)
      continue
    }

    if (codeMatch) {
      parts.push(<Code key={key++} fontSize="sm">{codeMatch[1]}</Code>)
      remaining = remaining.slice(codeMatch[0].length)
      continue
    }

    if (linkMatch) {
      parts.push(
        <Link key={key++} color="blue.500" href={linkMatch[1]} isExternal>
          {linkMatch[2]}
        </Link>
      )
      remaining = remaining.slice(linkMatch[0].length)
      continue
    }

    if (plainLinkMatch) {
      parts.push(
        <Link key={key++} color="blue.500" href={plainLinkMatch[1]} isExternal>
          {plainLinkMatch[1]}
        </Link>
      )
      remaining = remaining.slice(plainLinkMatch[0].length)
      continue
    }

    const nextSpecial = Math.min(
      remaining.indexOf('*') !== -1 ? remaining.indexOf('*') : Infinity,
      remaining.indexOf('/') !== -1 ? remaining.indexOf('/') : Infinity,
      remaining.indexOf('~') !== -1 ? remaining.indexOf('~') : Infinity,
      remaining.indexOf('[[') !== -1 ? remaining.indexOf('[[') : Infinity,
    )

    if (nextSpecial === Infinity || nextSpecial === 0) {
      parts.push(remaining[0] || '')
      remaining = remaining.slice(1)
    } else {
      parts.push(remaining.slice(0, nextSpecial))
      remaining = remaining.slice(nextSpecial)
    }
  }

  return parts
}

export const Note = (props: NoteProps) => {
  const {
    setPreviewNode,
    justificationList,
    justification,
    previewNode,
    nodeById,
    linksByNodeId,
    setSidebarHighlightedNode,
    openContextMenu,
    outline,
  } = props

  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!previewNode?.id || !nodeById[previewNode.id as string]?.file) {
      setContent('')
      return
    }

    const node = previewNode as OrgRoamNode
    const filePath = node.file

    setLoading(true)
    fetch(`/node/${encodeURIComponent(node.id)}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch')
        return res.text()
      })
      .then((text) => {
        setContent(text)
        setLoading(false)
      })
      .catch(() => {
        setContent('')
        setLoading(false)
      })
  }, [previewNode?.id, nodeById])

  const extraStyle = { textAlign: justificationList[justification] as 'justify' | 'start' | 'end' | 'center' }

  return (
    <Box
      pr={8}
      pt={2}
      height="100%"
      className="org"
      sx={extraStyle}
    >
      {previewNode?.id && (
        <Flex
          className="wrapClass"
          height="100%"
          flexDirection="column"
          justifyContent="space-between"
        >
          <Box>
            {loading ? (
              <Flex justify="center" align="center" py={10}>
                <Spinner size="lg" />
              </Flex>
            ) : content ? (
              parseBasicOrgContent(content)
            ) : (
              <Text color="gray.500" fontStyle="italic">
                No content available
              </Text>
            )}
          </Box>
          <Box mt={6}>
            <Divider my={4} />
            <Backlinks
              previewNode={previewNode}
              setPreviewNode={setPreviewNode}
              nodeById={nodeById}
              linksByNodeId={linksByNodeId}
              nodeByCite={{}}
              setSidebarHighlightedNode={setSidebarHighlightedNode}
              openContextMenu={openContextMenu}
              outline={outline}
              attachDir=""
              useInheritance={false}
              macros={{}}
            />
          </Box>
        </Flex>
      )}
    </Box>
  )
}