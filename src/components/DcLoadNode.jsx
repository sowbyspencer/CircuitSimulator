import React from 'react';
import { Handle, Position } from '@xyflow/react';

export function DcLoadNode({ data }) {
  const amps = data.amps ?? 0;
  const volts = data.volts ?? 0;
  const isActive = amps > 0;

  return (
    <div
      style={{
        background: '#1e293b',
        color: '#f8fafc',
        border: isActive ? '2px solid #10b981' : '2px solid #475569',
        borderRadius: '8px',
        padding: '12px',
        minWidth: '165px',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid #334155', paddingBottom: '4px' }}>
        DC Load
      </div>
      <div style={{ fontSize: '14px', color: '#94a3b8' }}>
        Rating: <strong style={{ color: '#f8fafc' }}>{data.watts}W</strong>
      </div>
      <div style={{ fontSize: '14px', color: '#94a3b8', marginTop: '4px' }}>
        Input: <strong style={{ color: isActive ? '#fbbf24' : '#f8fafc' }}>{volts.toFixed(1)}V</strong>
      </div>
      <div style={{ fontSize: '14px', color: '#94a3b8', marginTop: '4px' }}>
        Draw: <strong style={{ color: isActive ? '#10b981' : '#f8fafc' }}>{amps.toFixed(1)}A</strong>
      </div>

      {/* Positive Terminal */}
      <div style={{ position: 'relative', marginTop: '12px', textAlign: 'left', fontSize: '12px', color: '#f87171' }}>
        <Handle
          type="source"
          position={Position.Left}
          id="pos"
          style={{ background: '#ef4444', width: '10px', height: '10px', left: '-17px' }}
        />
        <span>+ POS</span>
      </div>

      {/* Negative Terminal */}
      <div style={{ position: 'relative', marginTop: '8px', textAlign: 'left', fontSize: '12px', color: '#60a5fa' }}>
        <Handle
          type="source"
          position={Position.Left}
          id="neg"
          style={{ background: '#3b82f6', width: '10px', height: '10px', left: '-17px' }}
        />
        <span>- NEG</span>
      </div>
    </div>
  );
}
