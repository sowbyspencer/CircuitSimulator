import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createPaletteNode, deleteNodeAndEdges, updateNodeData } from './appActions.js';

describe('Canvas component actions', () => {
  it('creates source and load nodes with their documented defaults', () => {
    assert.deepEqual(createPaletteNode('dcSource', 'src-1', { x: 10, y: 20 }), {
      id: 'src-1',
      type: 'dcSource',
      position: { x: 10, y: 20 },
      data: { volts: 12 },
    });
    assert.deepEqual(createPaletteNode('dcLoad', 'load-1', { x: 30, y: 40 }), {
      id: 'load-1',
      type: 'dcLoad',
      position: { x: 30, y: 40 },
      data: { nominalVolts: 12, watts: 120 },
    });
  });

  it('updates only the selected node data', () => {
    const nodes = [
      { id: 'src-1', type: 'dcSource', data: { volts: 12 } },
      { id: 'load-1', type: 'dcLoad', data: { nominalVolts: 12, watts: 120 } },
    ];
    const updated = updateNodeData(nodes, 'load-1', { watts: 240 });

    assert.deepEqual(updated[0], nodes[0]);
    assert.deepEqual(updated[1].data, { nominalVolts: 12, watts: 240 });
    assert.deepEqual(nodes[1].data, { nominalVolts: 12, watts: 120 });
  });

  it('deletes a node and all wires connected to it', () => {
    const nodes = [
      { id: 'src-1', type: 'dcSource' },
      { id: 'load-1', type: 'dcLoad' },
      { id: 'load-2', type: 'dcLoad' },
    ];
    const edges = [
      { id: 'e1', source: 'src-1', target: 'load-1' },
      { id: 'e2', source: 'load-1', target: 'load-2' },
      { id: 'e3', source: 'src-1', target: 'load-2' },
    ];

    assert.deepEqual(deleteNodeAndEdges(nodes, edges, 'load-1'), {
      nodes: [nodes[0], nodes[2]],
      edges: [edges[2]],
    });
  });
});
