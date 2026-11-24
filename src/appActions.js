export function createPaletteNode(type, id, position) {
  return {
    id,
    type,
    position,
    data: type === 'dcSource' ? { volts: 12 } : { nominalVolts: 12, watts: 120 },
  };
}

export function updateNodeData(nodes, nodeId, patch) {
  return nodes.map((node) =>
    node.id === nodeId ? { ...node, data: { ...node.data, ...patch } } : node,
  );
}

export function deleteNodeAndEdges(nodes, edges, nodeId) {
  return {
    nodes: nodes.filter((node) => node.id !== nodeId),
    edges: edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
  };
}
