import React from 'react';
import { AlignmentGuide } from '../types/pdf';

interface SnapGuidesProps {
  guides: AlignmentGuide[];
  zoom: number;
}

export const SnapGuides: React.FC<SnapGuidesProps> = ({ guides, zoom }) => {
  if (guides.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
      {guides.map((guide, idx) => {
        if (guide.type === 'vertical') {
          return (
            <div
              key={`guide-v-${idx}`}
              className="absolute top-0 bottom-0 border-l border-dashed border-cyan-500"
              style={{
                left: guide.position * zoom,
                boxShadow: '0 0 4px rgba(6, 182, 212, 0.6)',
              }}
            >
              {guide.label && (
                <span className="absolute top-2 left-1 bg-cyan-600 text-white text-[9px] font-sans px-1 rounded shadow">
                  {guide.label}
                </span>
              )}
            </div>
          );
        } else {
          return (
            <div
              key={`guide-h-${idx}`}
              className="absolute left-0 right-0 border-t border-dashed border-cyan-500"
              style={{
                top: guide.position * zoom,
                boxShadow: '0 0 4px rgba(6, 182, 212, 0.6)',
              }}
            >
              {guide.label && (
                <span className="absolute left-2 -top-4 bg-cyan-600 text-white text-[9px] font-sans px-1 rounded shadow">
                  {guide.label}
                </span>
              )}
            </div>
          );
        }
      })}
    </div>
  );
};
