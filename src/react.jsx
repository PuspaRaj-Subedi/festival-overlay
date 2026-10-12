import React, { useEffect, useRef } from 'react';
import { createEngineController } from './core/engine.js';

/**
 * React Component Wrapper for FestivalOverlay
 * @param {import('./types').Options & { className?: string; style?: React.CSSProperties }} props
 */
export function FestivalOverlay(props) {
  const { className, style, ...options } = props;
  const controllerRef = useRef(null);

  useEffect(() => {
    const controller = createEngineController(options);
    controllerRef.current = controller;
    controller.start();

    return () => {
      if (controllerRef.current) {
        controllerRef.current.stop();
        controllerRef.current = null;
      }
    };
  }, [
    options.festival,
    options.intensity,
    options.duration,
    options.opacity,
    options.zIndex,
    options.banner,
    options.date,
    options.calendarUrl
  ]);

  return null;
}

export default FestivalOverlay;
