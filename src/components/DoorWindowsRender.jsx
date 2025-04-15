import React from 'react';

export default function DoorWindowRenderer({ openings, preview }) {
  return (
    <svg className="overlay-svg">
      {/* Permanent openings */}
      {openings.map((opening, i) => (
        <g key={i} transform={`translate(${opening.position.x} ${opening.position.y}) rotate(${opening.angle})`}>
          <rect
            x={-opening.width/2}
            y={-opening.height/2}
            width={opening.width}
            height={opening.height}
            fill="#c4b9ac"
            stroke="#5a4d3e"
          />
        </g>
      ))}

      {/* Preview opening */}
      {preview && (
        <g transform={`translate(${preview.position.x} ${preview.position.y}) rotate(${preview.angle})`}>
          <rect
            x={-preview.width/2}
            y={-preview.height/2}
            width={preview.width}
            height={preview.height}
            fill="#c4b9ac80"
            stroke="#5a4d3e"
            strokeDasharray="4 2"
          />
        </g>
      )}
    </svg>
  );
}