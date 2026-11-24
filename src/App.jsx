import React, { useCallback, useMemo, useRef } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  ConnectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { solveDcCircuit } from './engine/circuit.js';
import { connectWire, moveWire, disconnectWire } from './engine/wireActions.js';
import { DcSourceNode } from './components/DcSourceNode.jsx';
import { DcLoadNode } from './components/DcLoadNode.jsx';

const nodeTypes = {
  dcSource: DcSourceNode,
  dcLoad: DcLoadNode,
};

const initialNodes = [
  { id: 'src-1', type: 'dcSource', position: { x: 100, y: 150 }, data: { volts: 12 } },
  { id: 'load-1', type: 'dcLoad', position: { x: 420, y: 150 }, data: { watts: 120 } },
];

const initialEdges = [];

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const edgeReconnectSuccessful = useRef(true);

  const simulation = useMemo(() => solveDcCircuit(nodes, edges), [nodes, edges]);

  const displayNodes = useMemo(
    () =>
      nodes.map((node) => {
        if (node.type === 'dcSource') {
          return {
            ...node,
            data: {
              ...node.data,
              amps: simulation.sourceAmps[node.id] ?? 0,
              inputAmps: simulation.sourceInputAmps?.[node.id] ?? 0,
            },
          };
        }
        if (node.type === 'dcLoad') {
          return {
            ...node,
            data: {
              ...node.data,
              amps: simulation.loadAmps[node.id] ?? 0,
              volts: simulation.loadVolts[node.id] ?? 0,
            },
          };
        }
        return node;
      }),
    [nodes, simulation]
  );

  const displayEdges = useMemo(
    () =>
      edges.map((edge) => {
        const amps = simulation.edgeAmps[edge.id] ?? 0;
        const signedAmps = simulation.edgeSignedAmps?.[edge.id] ?? amps;
        const isShort = simulation.shortEdgeIds?.includes(edge.id) ?? false;
        return {
          ...edge,
          animated: amps > 0,
          className: signedAmps < 0 ? 'reverse-flow' : '',
          label: isShort ? 'SHORT' : amps > 0 ? `${amps.toFixed(1)}A` : '0A',
          style: {
            stroke: isShort ? '#ef4444' : amps > 0 ? '#10b981' : '#64748b',
            strokeWidth: 2,
          },
        };
      }),
    [edges, simulation]
  );


  const onConnect = useCallback(
    (params) => setEdges((eds) => connectWire(eds, params)),
    [setEdges]
  );

  const onReconnectStart = useCallback(() => {
    edgeReconnectSuccessful.current = false;
  }, []);

  const onReconnect = useCallback(
    (oldEdge, newConnection) => {
      edgeReconnectSuccessful.current = true;
      setEdges((els) => moveWire(els, oldEdge, newConnection));
    },
    [setEdges]
  );

  const onReconnectEnd = useCallback(
    (_, edge) => {
      if (!edgeReconnectSuccessful.current) {
        setEdges((eds) => disconnectWire(eds, edge.id));
      }
      edgeReconnectSuccessful.current = true;
    },
    [setEdges]
  );

  const addSource = () => {
    const id = `src-${Date.now()}`;
    setNodes((nds) =>
      nds.concat({ id, type: 'dcSource', position: { x: 100, y: 50 + nds.length * 40 }, data: { volts: 12 } })
    );
  };

  const addLoad = () => {
    const id = `load-${Date.now()}`;
    setNodes((nds) =>
      nds.concat({ id, type: 'dcLoad', position: { x: 420, y: 50 + nds.length * 40 }, data: { watts: 120 } })
    );
  };

    return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        .react-flow__edge.reverse-flow path.react-flow__edge-path {
          animation-direction: reverse;
        }
      `}</style>

      <div
        style={{
          padding: '10px 16px',
          background: '#1e293b',
          borderBottom: '1px solid #334155',
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
          color: '#f8fafc',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <strong>Circuit Simulator</strong>
        <button onClick={addSource} style={{ padding: '6px 12px', cursor: 'pointer' }}>
          + DC Source (12V)
        </button>
        <button onClick={addLoad} style={{ padding: '6px 12px', cursor: 'pointer' }}>
          + DC Load (120W)
        </button>

        {simulation.hasShortCircuit && (
          <span
            style={{
              background: '#7f1d1d',
              color: '#fecaca',
              border: '1px solid #ef4444',
              padding: '4px 10px',
              borderRadius: '6px',
              fontWeight: 'bold',
              fontSize: '13px',
            }}
          >
            ⚠️ SHORT CIRCUIT DETECTED
          </span>
        )}

        <span style={{ marginLeft: 'auto', fontSize: '13px', color: '#94a3b8' }}>
          Drag wire ends to move or drop in empty space to disconnect.
        </span>
      </div>

      <div style={{ flex: 1 }}>
        <ReactFlow
          nodes={displayNodes}
          edges={displayEdges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onReconnectStart={onReconnectStart}
          onReconnect={onReconnect}
          onReconnectEnd={onReconnectEnd}
          connectionMode={ConnectionMode.Loose}
          fitView
        >
          <Background color="#334155" gap={20} />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );

}
