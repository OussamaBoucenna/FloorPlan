import React, { useState, useEffect } from 'react';

export const WallLengthPopup = ({ visible, x, y, initialValue, onApply, onCancel }) => {
  const [value, setValue] = useState(initialValue || '');
  
  useEffect(() => {
    if (visible) {
      setValue(initialValue || '');
    }
  }, [visible, initialValue]);
  
  if (!visible) return null;
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      onApply(parseFloat(value));
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };
  
  return (
    <div 
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)',
        background: 'white',
        padding: '10px',
        borderRadius: '4px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '5px'
      }}
    >
      <div>Wall Length (meters):</div>
      <input 
        type="number" 
        value={value} 
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        step="0.01"
        style={{ width: '80px' }}
        autoFocus
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
        <button onClick={() => onCancel()}>Cancel</button>
        <button onClick={() => onApply(parseFloat(value))}>Apply</button>
      </div>
    </div>
  );
};

