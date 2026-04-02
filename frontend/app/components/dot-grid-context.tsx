"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface FlowTarget {
  x: number;
  y: number;
}

interface ProbeStream {
  x: number;
  y: number;
  color: { r: number; g: number; b: number };
  active: boolean;
}

interface DotGridContextValue {
  flowTarget: FlowTarget | null;
  intensity: number;
  probeStreams: ProbeStream[];
  completionBurst: boolean;
  setFlowTarget: (target: FlowTarget | null) => void;
  setIntensity: (n: number) => void;
  setProbeStreams: (streams: ProbeStream[]) => void;
  triggerCompletionBurst: () => void;
}

const DotGridContext = createContext<DotGridContextValue>({
  flowTarget: null,
  intensity: 0,
  probeStreams: [],
  completionBurst: false,
  setFlowTarget: () => {},
  setIntensity: () => {},
  setProbeStreams: () => {},
  triggerCompletionBurst: () => {},
});

export type { ProbeStream };

export function DotGridProvider({ children }: { children: ReactNode }) {
  const [flowTarget, setFlowTargetState] = useState<FlowTarget | null>(null);
  const [intensity, setIntensityState] = useState(0);
  const [probeStreams, setProbeStreamsState] = useState<ProbeStream[]>([]);
  const [completionBurst, setCompletionBurst] = useState(false);

  const setFlowTarget = useCallback((target: FlowTarget | null) => {
    setFlowTargetState(target);
  }, []);

  const setIntensity = useCallback((n: number) => {
    setIntensityState(n);
  }, []);

  const setProbeStreams = useCallback((streams: ProbeStream[]) => {
    setProbeStreamsState(streams);
  }, []);

  const triggerCompletionBurst = useCallback(() => {
    setCompletionBurst(true);
    setTimeout(() => setCompletionBurst(false), 1500);
  }, []);

  return (
    <DotGridContext.Provider value={{
      flowTarget, intensity, probeStreams, completionBurst,
      setFlowTarget, setIntensity, setProbeStreams, triggerCompletionBurst,
    }}>
      {children}
    </DotGridContext.Provider>
  );
}

export function useDotGrid() {
  return useContext(DotGridContext);
}
