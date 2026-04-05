import { useWindowSize } from '@react-hook/window-size'
import React, { useEffect, useRef, useState, Suspense, lazy } from 'react'
import ReconnectingWebSocket from 'reconnecting-websocket'
import type { OrgRoamGraphReponse, OrgRoamNode, OrgRoamLink } from './vite-env.d.ts'

import ForceGraph2D from 'react-force-graph-2d'
// import ForceGraph3D from 'react-force-graph-3d'

export type NodeById = { [nodeId: string]: OrgRoamNode | undefined }
export type NodesByFile = { [file: string]: OrgRoamNode[] | undefined }

import EXAMPLE from '../example.json' assert { type: 'json' };

function genRandomTree(N = 300, reverse = false) {
  return {
    nodes: [...Array(N).keys()].map(i => ({ id: i })),
    links: [...Array(N).keys()]
      .map(id => ({
        [reverse ? 'target' : 'source']: id,
        [reverse ? 'source' : 'target']: Math.round(Math.random() * (id-1))
      }))
  };
}

export default function App() {
  const [showPage, setShowPage] = useState(false)
  const [graphData, setGraphData] = useState<any | null>(null)
  const [windowWidth, windowHeight] = useWindowSize()
  const graphRef = useRef(null)

  useEffect(() => { setShowPage(true) }, [])

  const nodeByIdRef = useRef<NodeById>({})

  const updateGraphData = (orgRoamGraphData: OrgRoamGraphReponse) => {
    console.log(orgRoamGraphData)

    const oldNodeById = nodeByIdRef.current ?? []
    const importNodes = orgRoamGraphData.nodes ?? []
    const importLinks = orgRoamGraphData.links ?? []
    const nodesByFile = importNodes.reduce<NodesByFile>((acc, node) => {
      return {
        ...acc,
        [node.file]: [...(acc[node.file] ?? []), node],
      }
    }, {})

    // generate links between level 2 nodes and the level 1 node above it
    // org-roam does not generate such links, so we have to put them in ourselves
    const headingLinks: OrgRoamLink[] = Object.keys(nodesByFile).flatMap((file) => {
      const nodesInFile = nodesByFile[file] ?? []
      // "file node" as opposed to "heading node"
      const fileNode = nodesInFile.find((node) => node.level === 0)
      const headingNodes = nodesInFile.filter((node) => node.level !== 0)

      if (!fileNode) {
        return []
      }
      return headingNodes.map((headingNode) => {
        const smallerHeadings = nodesInFile.filter((node) => {
          if (
            node.level >= headingNode.level || node.pos >= headingNode.pos
          ) {
            return false
          }
          return true
        })

        // get the nearest heading
        const target = smallerHeadings.reduce((acc, node) => {
          if (node.level > acc.level) {
            acc = node
          }
          return acc
        }, fileNode)

        return [
            {
              source: headingNode.id,
              target: target?.id || fileNode.id,
              type: 'heading',
            },
            {
              source: headingNode.id,
              target: fileNode.id,
              type: 'parent',
            }
        ]
      })
    }).flat()

    nodeByIdRef.current = Object.fromEntries(importNodes.map((node) => [node.id, node]))

    const dirtyLinks = [...importLinks, ...headingLinks]
    const nonExistantNodes: OrgRoamNode[] = []
    const links = dirtyLinks.map((link) => {
      const sourceId = link.source as string
      const targetId = link.target as string
      if (!nodeByIdRef.current[sourceId]) {
        nonExistantNodes.push({
          id: sourceId,
          tags: ['bad'],
          properties: { FILELESS: 'yes', bad: 'yes' },
          file: '',
          title: sourceId,
          level: 0,
          pos: 0,
          olp: null,
        })
        return { ...link, type: 'bad' }
      }
      if (!nodeByIdRef.current[targetId]) {
        nonExistantNodes.push({
          id: targetId,
          tags: ['bad'],
          properties: { FILELESS: 'yes', bad: 'yes' },
          file: '',
          title: targetId,
          level: 0,
          pos: 0,
          olp: null,
        })
        return { ...link, type: 'bad' }
      }
      return link
    })

    nodeByIdRef.current = {
      ...nodeByIdRef.current,
      ...Object.fromEntries(nonExistantNodes.map((node) => [node.id, node])),
    }

    const nodes = [...importNodes, ...nonExistantNodes]

    const orgRoamGraphDataProcessed = { nodes, links }

    const newNodes = [
      // ...currentGraphData.nodes.flatMap((node: NodeObject) => {
      //   const newNode = nodeByIdRef.current[node?.id!] ?? false
      //   if (!newNode) {
      //     return []
      //   }
      //   return [{ ...node, ...newNode }]
      // }),
      ...Object.keys(nodeByIdRef.current)
        .filter((id) => !oldNodeById[id])
        .map((id) => {
          return nodeByIdRef.current![id] as OrgRoamNode
        }),
    ]

    const nodeIndex = newNodes.reduce<{ [id: string]: number }>((acc, node, index) => {
      const id = node?.id as string
      return {
        ...acc,
        [id]: index,
      }
    }, {})

    const newerLinks = links.map((link) => {
      return {
        ...link,
        source: newNodes[nodeIndex![link.source]],
        target: newNodes[nodeIndex![link.target]],
      }
    })

    console.log(newNodes)
    console.log(newerLinks)

    setGraphData({ nodes: newNodes, links: newerLinks })
  }

  useEffect(() => {
      const data = genRandomTree()
      // const data = EXAMPLE
      setGraphData(data)
  }, [])

  const WebSocketRef = useRef<ReconnectingWebSocket | null>(null);
  useEffect(() => {
    // initialize websocket
    const ws = new ReconnectingWebSocket('ws://localhost:35903')
    WebSocketRef.current = ws
    ws.addEventListener('open', () => {
      console.log('Connected')
      ws.send("s\n") // send
    })
    ws.addEventListener('message', (event: any) => {
      console.log(event, 'message')
      const message = JSON.parse(event.data)
      switch (message.type) {
        case 'graphdata':
          return updateGraphData(message.data)
        default:
          return console.error('unknown message type', message.type)
      }
    })
  }, [])

  if (!showPage) { return <>Bad</> }
  if (!graphData) { return <></> }

  return (
    <div style={{position: "absolute"}}>
      <div style={{overflow: "hidden"}}>
        <Suspense fallback={null}>
          <ForceGraph2D
            graphData={graphData}
            width={windowWidth}
            height={windowHeight}
          />
        </Suspense>
      </div>
    </div>
  )
}

