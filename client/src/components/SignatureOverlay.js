import React, { useState } from 'react';
import { useEffect } from 'react';

function SignatureOverlay({ onPlaceSignature }) {
  const [marker, setMarker] = useState({ x: 100, y: 100 });
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const userName = localStorage.getItem('userName') || 'Your Name';

  useEffect(() => {
    function handleMouseMove(e) {
      if (!dragging) return;
      setMarker({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    }
    function handleMouseUp() {
      if (dragging) setDragging(false);
    }
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, offset]);

  const handleMouseDown = (e) => {
    setDragging(true);
    setOffset({ x: e.clientX - marker.x, y: e.clientY - marker.y });
  };

  const handlePlace = () => {
    onPlaceSignature && onPlaceSignature({ x: marker.x, y: marker.y });
  };

  return (
    <div className="absolute inset-0" style={{ zIndex: 20 }}>
      <div
        style={{
          position: 'absolute',
          left: marker.x,
          top: marker.y,
          minWidth: 180,
          minHeight: 50,
          background: 'white',
          border: '3px solid #7C3AED',
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(124,58,237,0.08)',
          display: 'flex',
          alignItems: 'center',
          padding: '0.5rem 1.5rem 0.5rem 1rem',
          fontWeight: 700,
          fontSize: 24,
          color: '#22223b',
          cursor: dragging ? 'grabbing' : 'grab',
          userSelect: 'none',
        }}
        onMouseDown={handleMouseDown}
        onMouseUp={handlePlace}
      >
        {userName}
        <button
          onClick={e => { e.stopPropagation(); onPlaceSignature && onPlaceSignature(null); }}
          style={{
            marginLeft: 12,
            background: 'transparent',
            border: 'none',
            color: '#7C3AED',
            fontWeight: 900,
            fontSize: 22,
            cursor: 'pointer',
            position: 'absolute',
            top: 2,
            right: 8,
          }}
          aria-label="Close"
        >×</button>
      </div>
    </div>
  );
}

export default SignatureOverlay; 