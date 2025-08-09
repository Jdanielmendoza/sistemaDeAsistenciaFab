"use client";
import React, { useState, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import SimpleLanyard from "./SimpleLanyard";

// Dynamically import the 3D Lanyard with SSR disabled
const Lanyard3D = dynamic(() => import("./Lanyard"), {
  ssr: false,
  loading: () => <LanyardFallback />,
});

interface LanyardWrapperProps {
  cardData?: {
    name?: string;
    cardNumber?: string;
    logo?: string;
  };
  className?: string;
  use3D?: boolean;
  rotationSpeed?: number; // 0 = no rotation, 0.5 = slow, 1 = normal, 2 = fast
  rotationAxis?: 'x' | 'y' | 'z'; // which axis to rotate around
}

function LanyardFallback() {
  return (
    <div className="flex items-center justify-center h-full w-full">
      <div className="animate-pulse space-y-4">
        <div className="w-4 h-32 bg-primary/20 rounded-full mx-auto"></div>
        <div className="w-80 h-48 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl"></div>
      </div>
    </div>
  );
}

export default function LanyardWrapper({ 
  cardData = {}, 
  className = "",
  use3D = true,
  rotationSpeed = 0.5,
  rotationAxis = 'y'
}: LanyardWrapperProps) {
  const [hasError, setHasError] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Error boundary for 3D component
  const handle3DError = () => {
    setHasError(true);
  };

  // If not client-side, use3D is disabled, or error occurred, use SimpleLanyard
  if (!isClient || !use3D || hasError) {
    return (
      <SimpleLanyard 
        cardData={cardData}
        className={className}
      />
    );
  }

  return (
    <div className={className}>
      <Suspense fallback={<LanyardFallback />}>
        <ErrorBoundary onError={handle3DError}>
          <Lanyard3D 
            cardData={cardData}
            transparent={true}
            fov={25}
            position={[0, 0, 20]}
            rotationSpeed={rotationSpeed}
            rotationAxis={rotationAxis}
          />
        </ErrorBoundary>
      </Suspense>
    </div>
  );
}

// Simple error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: () => void },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; onError: () => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.warn("3D Lanyard failed, falling back to CSS version:", error);
    this.props.onError();
  }

  render() {
    if (this.state.hasError) {
      return null; // Parent will handle fallback
    }

    return this.props.children;
  }
} 