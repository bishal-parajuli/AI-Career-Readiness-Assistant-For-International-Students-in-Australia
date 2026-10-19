import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export default function Card({ children, className = "" }: CardProps) {
  return (
    <div className={`bg-white border border-[#e2e8f0] rounded-xl ${className}`}>
      {children}
    </div>
  );
}
