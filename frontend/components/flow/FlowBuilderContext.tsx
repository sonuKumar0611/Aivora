'use client';

import { createContext, useContext } from 'react';

export type OnNodeDataChange = (nodeId: string, field: string, value: string) => void;
export type OnDeleteNode = (nodeId: string) => void;

const FlowBuilderContext = createContext<{
  onNodeDataChange: OnNodeDataChange;
  onDeleteNode: OnDeleteNode;
} | null>(null);

export function useFlowBuilderContext() {
  const ctx = useContext(FlowBuilderContext);
  return ctx;
}

export function FlowBuilderProvider({
  onNodeDataChange,
  onDeleteNode,
  children,
}: {
  onNodeDataChange: OnNodeDataChange;
  onDeleteNode: OnDeleteNode;
  children: React.ReactNode;
}) {
  return (
    <FlowBuilderContext.Provider value={{ onNodeDataChange, onDeleteNode }}>
      {children}
    </FlowBuilderContext.Provider>
  );
}
