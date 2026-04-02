"use client";

interface FloatingCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}

export function FloatingCard({ children, className = "", glowColor }: FloatingCardProps) {
  return (
    <div
      className={`glass-card p-5 transition-all hover:border-opacity-60 ${className}`}
      style={glowColor ? { borderColor: `${glowColor}30` } : undefined}
    >
      {children}
    </div>
  );
}
