function findWireBetween(edges, nodeA, handleA, nodeB, handleB) {
  return edges.find(
    (e) =>
      (e.source === nodeA && e.sourceHandle === handleA && e.target === nodeB && e.targetHandle === handleB) ||
      (e.source === nodeB && e.sourceHandle === handleB && e.target === nodeA && e.targetHandle === handleA),
  );
}

export function solveDcCircuit(nodes, edges) {
  const loadAmps = {};
  const edgeAmps = {};

  for (const edge of edges) {
    edgeAmps[edge.id] = 0;
  }

  const sources = nodes.filter((n) => n.type === "dcSource");
  const loads = nodes.filter((n) => n.type === "dcLoad");

  for (const load of loads) {
    loadAmps[load.id] = 0;

    for (const source of sources) {
      const posWire = findWireBetween(edges, source.id, "pos", load.id, "pos");
      const negWire = findWireBetween(edges, source.id, "neg", load.id, "neg");

      if (posWire && negWire && source.data.volts > 0) {
        const amps = load.data.watts / source.data.volts;
        loadAmps[load.id] += amps;
        edgeAmps[posWire.id] += amps;
        edgeAmps[negWire.id] += amps;
      }
    }
  }

  return { loadAmps, edgeAmps };
}
