import React from 'react';
import { Handle, Position } from '@xyflow/react';

export function DcSourceNode({ data }) {
  const amps = data.amps ?? 0;
  const inputAmps = data.inputAmps ?? 0;
  const watts = data.volts * (amps - inputAmps);
  const isSupplying = amps > 0;
  const isCharging = inputAmps > 0;
  const updateVolts = (event) => data.onUpdate?.({ volts: Number(event.target.value) || 0 });

  return (
    <div
      style={{
        background: '#1e293b',
        color: '#f8fafc',
        border: isSupplying ? '2px solid #3b82f6' : '2px solid #475569',
        borderRadius: '8px',
        padding: '12px',
        position: 'relative',
        minWidth: '165px',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <button
        className="nodrag"
        onClick={data.onDelete}
        title="Delete source"
        style={{ position: 'absolute', top: '5px', right: '7px', border: 0, background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: '18px' }}
      >
        ×
      </button>
      <div style={{ fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid #334155', paddingBottom: '4px' }}>
        DC Source
      </div>
      <div style={{ fontSize: '14px', color: '#94a3b8' }}>
        Rating:{' '}
        <input className="nodrag" type="number" min="0" step="0.1" value={data.volts} onChange={updateVolts} style={{ width: '58px', color: '#f8fafc', background: '#334155', border: '1px solid #64748b', borderRadius: '3px' }} />V
      </div>
      <div style={{ fontSize: '14px', color: '#94a3b8', marginTop: '4px' }}>
        {isCharging ? 'Input' : 'Output'}:{' '}
        <strong style={{ color: isSupplying ? '#60a5fa' : isCharging ? '#fbbf24' : '#f8fafc' }}>
          {(isCharging ? inputAmps : amps).toFixed(1)}A
        </strong>
      </div>
      <div style={{ fontSize: '14px', color: '#94a3b8', marginTop: '4px' }}>
        Power: <strong style={{ color: isSupplying || isCharging ? '#fbbf24' : '#f8fafc' }}>{watts.toFixed(0)}W</strong>
      </div>

      {/* Positive Terminal */}
      <div style={{ position: 'relative', marginTop: '12px', textAlign: 'right', fontSize: '12px', color: '#f87171' }}>
        <span>+ POS</span>
        <Handle
          type="source"
          position={Position.Right}
          id="pos"
          style={{ background: '#ef4444', width: '10px', height: '10px', right: '-17px' }}
        />
      </div>

      {/* Negative Terminal */}
      <div style={{ position: 'relative', marginTop: '8px', textAlign: 'right', fontSize: '12px', color: '#60a5fa' }}>
        <span>- NEG</span>
        <Handle
          type="source"
          position={Position.Right}
          id="neg"
          style={{ background: '#3b82f6', width: '10px', height: '10px', right: '-17px' }}
        />
      </div>
    </div>
  );
}
