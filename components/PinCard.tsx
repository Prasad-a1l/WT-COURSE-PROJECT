import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  /** Optional header band above the body */
  visual?: ReactNode;
};

export function PinCard({ children, className = "", visual }: Props) {
  return (
    <div className={`pin-card overflow-hidden break-inside-avoid ${className}`.trim()}>
      {visual}
      <div className="px-5 py-5 sm:px-6 sm:py-6">{children}</div>
    </div>
  );
}
