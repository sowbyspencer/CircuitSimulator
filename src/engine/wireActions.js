export function connectWire(edges, params) {
  const alreadyExists = edges.some(
    (e) =>
      (e.source === params.source &&
        e.sourceHandle === params.sourceHandle &&
        e.target === params.target &&
        e.targetHandle === params.targetHandle) ||
      (e.source === params.target && e.sourceHandle === params.targetHandle && e.target === params.source && e.targetHandle === params.sourceHandle),
  );
  if (alreadyExists) return edges;

  const id = params.id ?? `wire-${crypto.randomUUID()}`;
  return [...edges, { ...params, id }];
}

export function moveWire(edges, oldEdge, newConnection) {
  return edges.map((edge) =>
    edge.id === oldEdge.id
      ? {
          ...edge,
          source: newConnection.source,
          sourceHandle: newConnection.sourceHandle,
          target: newConnection.target,
          targetHandle: newConnection.targetHandle,
        }
      : edge,
  );
}

export function disconnectWire(edges, edgeId) {
  return edges.filter((edge) => edge.id !== edgeId);
}
