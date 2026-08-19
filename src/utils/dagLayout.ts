import type { Node, Edge } from '@xyflow/react';

/**
 *  Intelligent Hierarchical DAG Auto-Layout Engine
 * Computes topological depth layers and spaces nodes cleanly without external heavy dependencies.
 */
export function autoLayoutDAG(nodes: Node[], edges: Edge[]): { nodes: Node[]; edges: Edge[] } {
  if (nodes.length === 0) return { nodes, edges };

  // 1. Build adjacency list and in-degree map
  const inDegree: Record<string, number> = {};
  const adjList: Record<string, string[]> = {};

  nodes.forEach((n) => {
    inDegree[n.id] = 0;
    adjList[n.id] = [];
  });

  edges.forEach((e) => {
    if (adjList[e.source] && inDegree[e.target] !== undefined) {
      adjList[e.source].push(e.target);
      inDegree[e.target] = (inDegree[e.target] || 0) + 1;
    }
  });

  // 2. Assign depth / column rank via BFS / Topological Leveling
  const depths: Record<string, number> = {};
  const queue: string[] = [];

  // Sources have in-degree 0
  nodes.forEach((n) => {
    if (inDegree[n.id] === 0) {
      queue.push(n.id);
      depths[n.id] = 0;
    }
  });

  // Fallback if graph has cycles: assign 0 to all remaining
  nodes.forEach((n) => {
    if (depths[n.id] === undefined) {
      depths[n.id] = 0;
    }
  });

  // Process queue
  let head = 0;
  while (head < queue.length) {
    const u = queue[head++];
    const currentDepth = depths[u];

    for (const v of adjList[u] || []) {
      const nextDepth = currentDepth + 1;
      if (depths[v] === undefined || nextDepth > depths[v]) {
        depths[v] = nextDepth;
        queue.push(v);
      }
    }
  }

  // 3. Group nodes by depth column
  const columns: Record<number, Node[]> = {};
  nodes.forEach((n) => {
    const d = depths[n.id] || 0;
    if (!columns[d]) columns[d] = [];
    columns[d].push(n);
  });

  // 4. Calculate grid positions with generous spacing
  const HORIZONTAL_GAP = 280; // Distance between stages
  const VERTICAL_GAP = 180;   // Distance between parallel nodes in same stage
  const START_X = 120;
  const START_Y = 120;

  const newNodes = nodes.map((node) => {
    const d = depths[node.id] || 0;
    const colNodes = columns[d] || [node];
    const indexInCol = colNodes.findIndex((n) => n.id === node.id);

    // Center nodes vertically relative to the largest column
    const totalHeight = (colNodes.length - 1) * VERTICAL_GAP;
    const yOffset = -totalHeight / 2 + indexInCol * VERTICAL_GAP;

    const posX = START_X + d * HORIZONTAL_GAP;
    const posY = START_Y + 240 + yOffset;

    return {
      ...node,
      position: {
        x: Math.round(posX),
        y: Math.round(Math.max(80, posY)),
      },
    };
  });

  return { nodes: newNodes, edges };
}
