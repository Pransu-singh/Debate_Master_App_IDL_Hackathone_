import React from 'react';

interface WaveformProps {
  active: boolean;
  className?: string;
}

// Minimal animated waveform (3 bars)
export const Waveform: React.FC<WaveformProps> = ({ active, className }) => {
  return (
    <svg
      className={className}
      width="32"
      height="16"
      viewBox="0 0 32 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect
        x="2"
        y="4"
        width="6"
        height="8"
        rx="2"
        fill="#6366F1"
        className={active ? 'wave-bar wave-bar-1' : ''}
      />
      <rect
        x="13"
        y="2"
        width="6"
        height="12"
        rx="2"
        fill="#6366F1"
        className={active ? 'wave-bar wave-bar-2' : ''}
      />
      <rect
        x="24"
        y="6"
        width="6"
        height="4"
        rx="2"
        fill="#6366F1"
        className={active ? 'wave-bar wave-bar-3' : ''}
      />
      <style>{`
        .wave-bar {
          transition: all 0.2s;
        }
        .wave-bar-1 {
          animation: wave1 1s infinite linear;
        }
        .wave-bar-2 {
          animation: wave2 1s infinite linear;
        }
        .wave-bar-3 {
          animation: wave3 1s infinite linear;
        }
        @keyframes wave1 {
          0%, 100% { height: 8px; y: 4px; }
          50% { height: 14px; y: 1px; }
        }
        @keyframes wave2 {
          0%, 100% { height: 12px; y: 2px; }
          50% { height: 6px; y: 5px; }
        }
        @keyframes wave3 {
          0%, 100% { height: 4px; y: 6px; }
          50% { height: 10px; y: 3px; }
        }
      `}</style>
    </svg>
  );
};

export default Waveform; 
