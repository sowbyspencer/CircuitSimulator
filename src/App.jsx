import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { stepLoadThermal } from './engine/loadThermal.js';
import { connectWire, moveWire, disconnectWire } from './engine/wireActions.js';
import { createPaletteNode, deleteNodeAndEdges, updateNodeData as updateNodeDataAction } from './appActions.js';
import { DcSourceNode } from './components/DcSourceNode.jsx';
import { DcLoadNode } from './components/DcLoadNode.jsx';

const nodeTypes = {
  dcSource: DcSourceNode,
  dcLoad: DcLoadNode,
};

const initialNodes = [
  { id: 'src-1', type: 'dcSource', position: { x: 100, y: 150 }, data: { volts: 12 } },
  { id: 'load-1', type: 'dcLoad', position: { x: 420, y: 150 }, data: { nominalVolts: 12, watts: 120, temp: 25, burned: false } },
];

const initialEdges = [];

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const edgeReconnectSuccessful = useRef(true);
  const reactFlowInstance = useRef(null);
  const reactFlowWrapper = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const simulation = useMemo(() => solveDcCircuit(nodes, edges), [nodes, edges]);

  // Keep latest simulation available to the 10Hz thermal tick without resetting the interval
  const latestSimRef = useRef(simulation);
  latestSimRef.current = simulation;

  useEffect(() => {
    const interval = setInterval(() => {
      const sim = latestSimRef.current;
      setNodes((currentNodes) => {
        let changed = false;
        const nextNodes = currentNodes.map((node) => {
          if (node.type !== 'dcLoad') return node;
          const inputVolts = sim.loadVolts[node.id] ?? 0;
          const stepped = stepLoadThermal(node, inputVolts, 0.1);
          if (
            stepped.data.temp !== node.data.temp ||
            stepped.data.burned !== node.data.burned ||
            stepped.data.overvoltage !== node.data.overvoltage
          ) {
            changed = true;
            return stepped;
          }
          return node;
        });
        return changed ? nextNodes : currentNodes;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [setNodes]);

  const updateNodeData = useCallback((nodeId, patch) => {
    setNodes((currentNodes) => updateNodeDataAction(currentNodes, nodeId, patch));
  }, [setNodes]);

  const deleteNode = useCallback((nodeId) => {
    setNodes((currentNodes) => currentNodes.filter((node) => node.id !== nodeId));
    setEdges((currentEdges) => deleteNodeAndEdges([], currentEdges, nodeId).edges);
  }, [setEdges, setNodes]);

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
              onUpdate: (patch) => updateNodeData(node.id, patch),
              onDelete: () => deleteNode(node.id),
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
              onUpdate: (patch) => updateNodeData(node.id, patch),
              onDelete: () => deleteNode(node.id),
            },
          };
        }
        return node;
      }),
    [deleteNode, nodes, simulation, updateNodeData]
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

  const addNodeAt = useCallback((type, position) => {
    const id = `${type === 'dcSource' ? 'src' : 'load'}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setNodes((currentNodes) => currentNodes.concat(createPaletteNode(type, id, position)));
  }, [setNodes]);

  const onPaletteDragStart = (event, type) => {
    event.dataTransfer.setData('application/reactflow', type);
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDragOver(true);
  }, []);

  const onDragLeave = useCallback(() => setDragOver(false), []);

  const onDrop = useCallback((event) => {
    event.preventDefault();
    setDragOver(false);
    const type = event.dataTransfer.getData('application/reactflow');
    if (!type || !reactFlowInstance.current) return;
    const bounds = reactFlowWrapper.current?.getBoundingClientRect();
    if (!bounds || event.clientX < bounds.left) return;
    addNodeAt(type, reactFlowInstance.current.screenToFlowPosition({ x: event.clientX, y: event.clientY }));
  }, [addNodeAt]);

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

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <aside
          style={{
            width: '190px',
            flexShrink: 0,
            padding: '16px',
            background: '#0f172a',
            borderRight: '1px solid #334155',
            color: '#cbd5e1',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <strong style={{ display: 'block', marginBottom: '6px', color: '#f8fafc' }}>Components</strong>
          <span style={{ display: 'block', fontSize: '12px', marginBottom: '14px', color: '#94a3b8' }}>
            Drag a component onto the canvas.
          </span>
          {[
            ['dcSource', 'DC Source', '12V source'],
            ['dcLoad', 'DC Load', '12V / 120W load'],
          ].map(([type, label, detail]) => (
            <div
              key={type}
              draggable
              onDragStart={(event) => onPaletteDragStart(event, type)}
              style={{
                padding: '12px',
                marginBottom: '10px',
                border: '1px solid #475569',
                borderRadius: '7px',
                background: '#1e293b',
                cursor: 'grab',
              }}
            >
              <strong style={{ display: 'block', color: '#f8fafc' }}>{label}</strong>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>{detail}</span>
            </div>
          ))}
          <span style={{ display: 'block', marginTop: '18px', fontSize: '12px', color: '#94a3b8' }}>
            Edit values directly on cards. Use the × button to delete a card and its wires.
          </span>
        </aside>
        <div
          ref={reactFlowWrapper}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          style={{ flex: 1, position: 'relative', border: dragOver ? '2px dashed #60a5fa' : 'none' }}
        >
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
            onInit={(instance) => { reactFlowInstance.current = instance; }}
            connectionMode={ConnectionMode.Loose}
            fitView
          >
          <Background color="#334155" gap={20} />
          <Controls />
        </ReactFlow>
        </div>
      </div>
    </div>
  );

}
