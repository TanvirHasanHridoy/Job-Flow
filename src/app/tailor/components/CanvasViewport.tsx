'use client';

import React, { useRef, useState, useEffect } from 'react';

interface CanvasViewportProps {
  children: React.ReactNode;
  scale: number;
  isAutoFit: boolean;
  onAutoFitScaleChange?: (scale: number) => void;
  className?: string;
}

export default function CanvasViewport({
  children,
  scale,
  isAutoFit,
  onAutoFitScaleChange,
  className = ''
}: CanvasViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  // Monitor container width for precise auto-fit scaling
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        if (width > 0) {
          setContainerWidth(width);
        }
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Standard A4 width in px (210mm @ ~96dpi is 794px)
  const A4_WIDTH = 794;
  const computedAutoFitScale = containerWidth > 0 
    ? Math.max(0.35, Math.min(1.0, (containerWidth - 24) / A4_WIDTH))
    : 1.0;

  const currentEffectiveScale = isAutoFit ? computedAutoFitScale : scale;

  useEffect(() => {
    if (isAutoFit && onAutoFitScaleChange && containerWidth > 0) {
      onAutoFitScaleChange(computedAutoFitScale);
    }
  }, [isAutoFit, computedAutoFitScale, containerWidth, onAutoFitScaleChange]);

  return (
    <div
      ref={containerRef}
      className={`w-full flex-1 flex flex-col items-center justify-start overflow-x-auto overflow-y-visible px-1 sm:px-4 py-2 sm:py-6 select-none ${className}`}
      style={{
        WebkitOverflowScrolling: 'touch'
      }}
    >
      <div
        className="flex flex-col items-center justify-center transition-transform duration-200 ease-out origin-top shrink-0"
        style={{
          transform: `scale(${currentEffectiveScale})`,
          width: `${A4_WIDTH}px`,
          marginBottom: `${Math.max(20, (1 - currentEffectiveScale) * -600)}px`
        }}
      >
        <div className="select-text w-full">
          {children}
        </div>
      </div>
    </div>
  );
}
