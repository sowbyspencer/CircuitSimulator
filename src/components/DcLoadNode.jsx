import React from 'react';
import { Handle, Position } from '@xyflow/react';

export function DcLoadNode({ data }) {
  const amps = data.amps ?? 0;
  const volts = data.volts ?? 0;
  const temp = data.temp ?? 25;
  const isOvervoltage = Boolean(data.overvoltage);
  const isBurned = Boolean(data.burned);
  const isActive = amps > 0 && !isBurned;

  const update = (field) => (event) => data.onUpdate?.({ [field]: Number(event.target.value) || 0 });
  const handleRepair = () => data.onUpdate?.({ burned: false, overvoltage: false, temp: 25 });

  let borderColor = '#475569';
  if (isBurned) borderColor = '#7f1d1d';
  else if (isOvervoltage) borderColor = '#ef4444';
  else if (isActive) borderColor = '#10b981';

  return (
    <div
      style={{
        background: isBurned ? '#1c1917' : '#1e293b',
        color: '#f8fafc',
        border: `2px solid ${borderColor}`,
        boxShadow: isOvervoltage ? '0 0 14px rgba(239, 68, 68, 0.55)' : 'none',
        borderRadius: '8px',
        padding: '12px',
        position: 'relative',
        minWidth: '185px',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <button
        className="nodrag"
        onClick={data.onDelete}
        title="Delete load"
        style={{ position: 'absolute', top: '5px', right: '7px', border: 0, background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: '18px' }}
      >
        ×
      </button>

      <div style={{ fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid #334155', paddingBottom: '4px' }}>
        DC Load
      </div>

      {isBurned && (
        <div
          style={{
            background: '#450a0a',
            color: '#fca5a5',
            border: '1px solid #ef4444',
            borderRadius: '5px',
            padding: '6px 8px',
            marginBottom: '8px',
            fontSize: '12px',
            fontWeight: 'bold',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <span>🔥 BURNED OUT (OPEN)</span>
          <button
            className="nodrag"
            onClick={handleRepair}
            style={{
              background: '#ef4444',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '11px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            🔧 Repair / Reset
          </button>
        </div>
      )}

      {!isBurned && isOvervoltage && (
        <div
          style={{
            background: '#7c2d12',
            color: '#fed7aa',
            border: '1px solid #f97316',
            borderRadius: '5px',
            padding: '4px 8px',
            marginBottom: '8px',
            fontSize: '12px',
            fontWeight: 'bold',
          }}
        >
          ⚠️ OVERVOLTAGE ({Math.round(temp)}°C)
        </div>
      )}

      <div style={{ fontSize: '14px', color: '#94a3b8' }}>
        Watts:{' '}
        <input
          className="nodrag"
          type="number"
          min="0"
          step="1"
          disabled={isBurned}
          value={data.watts}
          onChange={update('watts')}
          style={{ width: '58px', color: '#f8fafc', background: '#334155', border: '1px solid #64748b', borderRadius: '3px' }}
        />W
      </div>
      <div style={{ fontSize: '14px', color: '#94a3b8', marginTop: '4px' }}>
        Rated:{' '}
        <input
          className="nodrag"
          type="number"
          min="0"
          step="0.1"
          disabled={isBurned}
          value={data.nominalVolts ?? 12}
          onChange={update('nominalVolts')}
          style={{ width: '58px', color: '#f8fafc', background: '#334155', border: '1px solid #64748b', borderRadius: '3px' }}
        />V
      </div>
      <div style={{ fontSize: '14px', color: '#94a3b8', marginTop: '4px' }}>
        Input: <strong style={{ color: isOvervoltage ? '#ef4444' : isActive ? '#fbbf24' : '#f8fafc' }}>{volts.toFixed(1)}V</strong>
      </div>
      <div style={{ fontSize: '14px', color: '#94a3b8', marginTop: '4px' }}>
        Draw: <strong style={{ color: isActive ? '#10b981' : '#f8fafc' }}>{amps.toFixed(1)}A</strong>
      </div>
      <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
        Temp: <strong style={{ color: temp > 80 ? '#f97316' : '#cbd5e1' }}>{Math.round(temp)}°C</strong>
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
