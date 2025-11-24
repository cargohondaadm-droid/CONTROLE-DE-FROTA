
import React from 'react';

export const Logo = ({ className }: { className?: string }) => {
  return (
    <svg 
      viewBox="0 0 300 80" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
      preserveAspectRatio="xMinYMid meet"
      role="img"
      aria-label="Logo Cargo Engenharia"
    >
      <g transform="translate(10, 0)">
         {/* Base Circle (Dark Blue) - Mantém a cor da marca ou usa current se necessário */}
         <circle cx="40" cy="40" r="38" fill="#001E62" />
         {/* Inner White Circle (Donut hole) */}
         <circle cx="40" cy="40" r="15" fill="white" />
         
         {/* Cutout Slice (Top Right) */}
         <path d="M40 40 L80 0 L80 50 Z" fill="white" />
         
         {/* Blue Triangle / Arrow Element */}
         <path d="M44 40 L84 0 L84 40 Z" fill="#001E62" />
      </g>
      
      {/* Typography - Uses currentColor to adapt to dark/light backgrounds */}
      <text x="100" y="52" fontFamily="Arial, Helvetica, sans-serif" fontWeight="900" fontSize="50" fill="currentColor">CARGO</text>
      <text x="102" y="75" fontFamily="Arial, Helvetica, sans-serif" fontWeight="bold" fontSize="13" letterSpacing="0.45em" fill="currentColor">ENGENHARIA</text>
    </svg>
  );
};
