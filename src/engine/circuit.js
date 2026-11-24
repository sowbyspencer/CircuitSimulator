function solveLinearSystem(A, b) {
  const n = b.length;
  const M = A.map((row, i) => [...row, b.at(i)]);

  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(M.at(row).at(col)) > Math.abs(M.at(pivot).at(col))) {
        pivot = row;
      }
    }
    if (Math.abs(M.at(pivot).at(col)) < 1e-12) continue;
    [M[col], M[pivot]] = [M[pivot], M[col]];

    const div = M.at(col).at(col);
    for (let j = col; j <= n; j++) M[col][j] /= div;

    for (let row = 0; row < n; row++) {
      if (row !== col) {
        const factor = M.at(row).at(col);
        for (let j = col; j <= n; j++) {
          M[row][j] -= factor * M.at(col).at(j);
        }
      }
    }
  }
  return M.map((row) => row.at(n));
}

function solveSingleDcCircuit(nodes, edges) {
  const loadAmps = {};
  const loadVolts = {};
  const sourceAmps = {};
  const sourceInputAmps = {};
  const edgeAmps = {};
  const edgeSignedAmps = {};
  const shortNets = new Set();

  for (const edge of edges) {
    edgeAmps[edge.id] = 0;
    edgeSignedAmps[edge.id] = 0;
  }

  const sources = nodes.filter((n) => n.type === "dcSource");
  const loads = nodes.filter((n) => n.type === "dcLoad");

  for (const s of sources) {
    sourceAmps[s.id] = 0;
    sourceInputAmps[s.id] = 0;
  }
  for (const l of loads) {
    loadAmps[l.id] = 0;
    loadVolts[l.id] = 0;
  }

  // 1. Group connected terminal handles into electrical Nets
  const adj = new Map();
  const allHandles = new Set();
  for (const n of nodes) {
    allHandles.add(`${n.id}:pos`);
    allHandles.add(`${n.id}:neg`);
  }
  for (const h of allHandles) adj.set(h, []);
  for (const e of edges) {
    const a = `${e.source}:${e.sourceHandle}`;
    const b = `${e.target}:${e.targetHandle}`;
    if (!adj.has(a)) adj.set(a, []);
    if (!adj.has(b)) adj.set(b, []);
    adj.get(a).push({ to: b, edgeId: e.id });
    adj.get(b).push({ to: a, edgeId: e.id });
  }

  const handleToNet = new Map();
  let netCount = 0;
  for (const h of allHandles) {
    if (handleToNet.has(h)) continue;
    const netId = netCount++;
    const queue = [h];
    handleToNet.set(h, netId);
    while (queue.length > 0) {
      const curr = queue.shift();
      for (const { to } of adj.get(curr) || []) {
        if (!handleToNet.has(to)) {
          handleToNet.set(to, netId);
          queue.push(to);
        }
      }
    }
  }

  // 2. Check ideal source voltage consistency & detect dead shorts
  const idealVolts = new Map();
  const sourceNets = new Set();
  let hasShortCircuit = false;
  const loadResistances = new Map();

  for (const s of sources) {
    const negNet = handleToNet.get(`${s.id}:neg`);
    if (idealVolts.has(negNet)) continue;

    idealVolts.set(negNet, 0);
    sourceNets.add(negNet);
    const queue = [negNet];

    while (queue.length > 0) {
      const currNet = queue.shift();
      const v = idealVolts.get(currNet);

      for (const src of sources) {
        const sNeg = handleToNet.get(`${src.id}:neg`);
        const sPos = handleToNet.get(`${src.id}:pos`);
        const step = src.data.volts || 0;

        if (sNeg === sPos && step > 0) {
          hasShortCircuit = true;
          shortNets.add(sNeg);
        }

        if (sNeg === currNet) {
          const expectedPos = v + step;
          if (!idealVolts.has(sPos)) {
            idealVolts.set(sPos, expectedPos);
            sourceNets.add(sPos);
            queue.push(sPos);
          } else if (Math.abs(idealVolts.get(sPos) - expectedPos) > 1e-6) {
            hasShortCircuit = true;
            shortNets.add(currNet);
            shortNets.add(sNeg);
            shortNets.add(sPos);
          }
        }
        if (sPos === currNet) {
          const expectedNeg = v - step;
          if (!idealVolts.has(sNeg)) {
            idealVolts.set(sNeg, expectedNeg);
            sourceNets.add(sNeg);
            queue.push(sNeg);
          } else if (Math.abs(idealVolts.get(sNeg) - expectedNeg) > 1e-6) {
            hasShortCircuit = true;
            shortNets.add(currNet);
            shortNets.add(sNeg);
            shortNets.add(sPos);
          }
        }
      }
    }
  }

  if (hasShortCircuit) {
    const shortEdgeIds = edges
      .filter((edge) => {
        const sourceNet = handleToNet.get(`${edge.source}:${edge.sourceHandle}`);
        const targetNet = handleToNet.get(`${edge.target}:${edge.targetHandle}`);
        return shortNets.has(sourceNet) || shortNets.has(targetNet);
      })
      .map((edge) => edge.id);

    return {
      loadAmps,
      loadVolts,
      sourceAmps,
      sourceInputAmps,
      edgeAmps,
      edgeSignedAmps,
      shortEdgeIds,
      hasShortCircuit: true,
    };
  }

  // 3. Build Modified Nodal Analysis (MNA) Conductance Matrix across Nets + Voltage Sources
  const size = netCount + sources.length;
  const G = Array.from({ length: size }, () => Array(size).fill(0));
  const I = Array(size).fill(0);

  for (let i = 0; i < netCount; i++) {
    G[i][i] += 1e-9;
  }

  sources.forEach((src, idx) => {
    const p = handleToNet.get(`${src.id}:pos`);
    const n = handleToNet.get(`${src.id}:neg`);
    const vIdx = netCount + idx;

    G[p][vIdx] += 1;
    G[n][vIdx] -= 1;
    G[vIdx][p] += 1;
    G[vIdx][n] -= 1;
    G[vIdx][vIdx] -= 1e-6;
    I[vIdx] = src.data.volts || 0;
  });

  // Stamp DC Loads as Conductances (1 / R)
  for (const load of loads) {
    const p = handleToNet.get(`${load.id}:pos`);
    const n = handleToNet.get(`${load.id}:neg`);
    if (p === n || !load.data.watts || load.data.watts <= 0) continue;

    const directBusVolts = sourceNets.has(p) && sourceNets.has(n) ? Math.abs(idealVolts.get(p) - idealVolts.get(n)) : 0;
    const vRef = directBusVolts > 0 ? directBusVolts : load.data.nominalVolts || 12;
    const R = (vRef * vRef) / load.data.watts;
    const g = 1 / R;

    G[p][p] += g;
    G[n][n] += g;
    G[p][n] -= g;
    G[n][p] -= g;
    loadResistances.set(load.id, R);
  }

  const solution = solveLinearSystem(G, I);
  const netV = solution.slice(0, netCount);

  // 4. Extract Load Volts/Amps, Source Amps, and Signed Handle Currents
  const handleCurrent = new Map();
  for (const h of allHandles) handleCurrent.set(h, 0);

  sources.forEach((src, idx) => {
    const signedOutput = Math.round(-solution.at(netCount + idx) * 1000) / 1000;
    sourceAmps[src.id] = Math.max(0, signedOutput);
    sourceInputAmps[src.id] = Math.max(0, -signedOutput);
    handleCurrent.set(`${src.id}:pos`, handleCurrent.get(`${src.id}:pos`) + signedOutput);
    handleCurrent.set(`${src.id}:neg`, handleCurrent.get(`${src.id}:neg`) - signedOutput);
  });

  for (const load of loads) {
    const p = handleToNet.get(`${load.id}:pos`);
    const n = handleToNet.get(`${load.id}:neg`);
    const R = loadResistances.get(load.id);
    if (!R) continue;

    const signedVDiff = netV.at(p) - netV.at(n);
    const absVDiff = Math.abs(signedVDiff);
    if (absVDiff <= 1e-4) continue;

    const signedAmps = Math.round((signedVDiff / R) * 1000) / 1000;
    const absAmps = Math.abs(signedAmps);

    loadVolts[load.id] = Math.round(absVDiff * 1000) / 1000;
    loadAmps[load.id] = absAmps;

    handleCurrent.set(`${load.id}:pos`, handleCurrent.get(`${load.id}:pos`) - signedAmps);
    handleCurrent.set(`${load.id}:neg`, handleCurrent.get(`${load.id}:neg`) + signedAmps);
  }

  // 5. Solve signed & absolute wire edge currents across each Net.
  // A spanning-tree walk leaves parallel return wires at 0A. Instead, solve
  // the wire network with equal-resistance wires so parallel paths share flow.
  for (let netId = 0; netId < netCount; netId++) {
    const netHandles = [...allHandles].filter((h) => handleToNet.get(h) === netId);
    if (netHandles.length <= 1) continue;

    const netEdges = edges.filter((edge) => {
      const source = `${edge.source}:${edge.sourceHandle}`;
      const target = `${edge.target}:${edge.targetHandle}`;
      return handleToNet.get(source) === netId && handleToNet.get(target) === netId && source !== target;
    });
    if (netEdges.length === 0) continue;

    const indexByHandle = new Map(netHandles.map((handle, index) => [handle, index]));
    const ground = netHandles.length - 1;
    const reducedSize = netHandles.length - 1;
    const conductance = Array.from({ length: reducedSize }, () => Array(reducedSize).fill(0));
    const injection = Array(reducedSize).fill(0);

    for (const handle of netHandles) {
      const index = indexByHandle.get(handle);
      if (index < reducedSize) injection[index] = handleCurrent.get(handle) || 0;
    }

    for (const edge of netEdges) {
      const source = `${edge.source}:${edge.sourceHandle}`;
      const target = `${edge.target}:${edge.targetHandle}`;
      const sourceIndex = indexByHandle.get(source);
      const targetIndex = indexByHandle.get(target);
      if (sourceIndex < reducedSize) conductance[sourceIndex][sourceIndex] += 1;
      if (targetIndex < reducedSize) conductance[targetIndex][targetIndex] += 1;
      if (sourceIndex < reducedSize && targetIndex < reducedSize) {
        conductance[sourceIndex][targetIndex] -= 1;
        conductance[targetIndex][sourceIndex] -= 1;
      }
    }

    const potentials = reducedSize > 0 ? solveLinearSystem(conductance, injection) : [];
    const potentialAt = (handle) => {
      const index = indexByHandle.get(handle);
      return index === ground ? 0 : potentials[index];
    };

    for (const edge of netEdges) {
      const source = `${edge.source}:${edge.sourceHandle}`;
      const target = `${edge.target}:${edge.targetHandle}`;
      const signed = Math.round((potentialAt(source) - potentialAt(target)) * 1000) / 1000;
      edgeSignedAmps[edge.id] += signed;
      edgeAmps[edge.id] += Math.abs(signed);
    }
  }

  return {
    loadAmps,
    loadVolts,
    sourceAmps,
    sourceInputAmps,
    edgeAmps,
    edgeSignedAmps,
    shortEdgeIds: [],
    hasShortCircuit: false,
  };
}

export function solveDcCircuit(nodes, edges) {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const componentByNodeId = new Map();
  const components = [];
  const adjacency = new Map(nodes.map((node) => [node.id, []]));

  for (const edge of edges) {
    if (!adjacency.has(edge.source) || !adjacency.has(edge.target)) continue;
    adjacency.get(edge.source).push(edge.target);
    adjacency.get(edge.target).push(edge.source);
  }

  for (const node of nodes) {
    if (componentByNodeId.has(node.id)) continue;

    const componentNodeIds = [];
    const queue = [node.id];
    componentByNodeId.set(node.id, components.length);

    while (queue.length > 0) {
      const nodeId = queue.shift();
      componentNodeIds.push(nodeId);
      for (const neighborId of adjacency.get(nodeId) || []) {
        if (!componentByNodeId.has(neighborId)) {
          componentByNodeId.set(neighborId, components.length);
          queue.push(neighborId);
        }
      }
    }

    components.push(componentNodeIds);
  }

  const result = {
    loadAmps: {},
    loadVolts: {},
    sourceAmps: {},
    sourceInputAmps: {},
    edgeAmps: {},
    edgeSignedAmps: {},
    shortEdgeIds: [],
    hasShortCircuit: false,
  };

  for (const edge of edges) {
    result.edgeAmps[edge.id] = 0;
    result.edgeSignedAmps[edge.id] = 0;
  }

  for (const componentNodeIds of components) {
    const componentNodeIdSet = new Set(componentNodeIds);
    const componentNodes = componentNodeIds.map((nodeId) => nodeById.get(nodeId));
    const componentEdges = edges.filter(
      (edge) => componentNodeIdSet.has(edge.source) && componentNodeIdSet.has(edge.target),
    );
    const componentResult = solveSingleDcCircuit(componentNodes, componentEdges);

    Object.assign(result.loadAmps, componentResult.loadAmps);
    Object.assign(result.loadVolts, componentResult.loadVolts);
    Object.assign(result.sourceAmps, componentResult.sourceAmps);
    Object.assign(result.sourceInputAmps, componentResult.sourceInputAmps);
    Object.assign(result.edgeAmps, componentResult.edgeAmps);
    Object.assign(result.edgeSignedAmps, componentResult.edgeSignedAmps);
    result.shortEdgeIds.push(...componentResult.shortEdgeIds);
    result.hasShortCircuit ||= componentResult.hasShortCircuit;
  }

  return result;
}
