import React, { useState } from 'react';
import { WebContainerEngine } from './lib/midi-colab/web-container-engine';

interface WebContainerStarterProps {
  script?: string;
  onStarted?: () => void;
  onError?: (error: string) => void;
}

export const WebContainerStarter: React.FC<WebContainerStarterProps> = ({ script, onStarted, onError }) => {
  const [isStarting, setIsStarting] = useState(false);
  const [isStarted, setIsStarted] = useState(false);

  const handleStart = async () => {
    if (isStarting || isStarted) return;

    setIsStarting(true);
    try {
      const engine = WebContainerEngine.getInstance();
      await engine.start();
      if (script) {
        await engine.loadScript({ code: script });
      }
      setIsStarted(true);
      onStarted?.();
    } catch (error: any) {
      onError?.(error.message || 'Failed to start WebContainer');
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div>
      <button onClick={handleStart} disabled={isStarting || isStarted}>
        {isStarting ? 'Starting...' : isStarted ? 'Started' : 'Start WebContainer'}
      </button>
      {isStarted && <p>WebContainer is running</p>}
    </div>
  );
};