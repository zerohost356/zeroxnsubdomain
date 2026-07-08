import { useState, useCallback } from "react";
import ErrorBoundaryImpl from "./ErrorBoundaryImpl";

interface Props {
  children: React.ReactNode;
}

export default function ErrorBoundary({ children }: Props) {
  const [key, setKey] = useState(0);
  const handleReset = useCallback(() => setKey((k) => k + 1), []);
  return (
    <ErrorBoundaryImpl key={key} onReset={handleReset}>
      {children}
    </ErrorBoundaryImpl>
  );
}
