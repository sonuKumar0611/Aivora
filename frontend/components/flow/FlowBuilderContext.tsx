'use client';

import { createContext, useContext, useCallback } from 'react';

export type OnNodeDataChange = (nodeId: string, field: string, value: string) => void;

const FlowBuilderContext = createContext<{ onNodeDataChange: OnNodeDataChange } | null>(null);

export function useFlowBuilderContext() {
  const ctx = useContext(FlowBuilderContext);
  return ctx;
}

export function FlowBuilderProvider({
  onNodeDataChange,
  children,
}: {
  onNodeDataChange: OnNodeDataChange;
  children: React.ReactNode;
}) {
  return (
    <FlowBuilderContext.Provider value={{ onNodeDataChange }}>
      {children}
    </FlowBuilderContext.Provider>
  );
}
