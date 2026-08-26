import React from "react";

export function RingFlowLogo({
  className = "h-[22px] w-auto",
  ...props
}: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 28 18"
      fill="none"
      stroke="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <circle cx="9" cy="9" r="7" strokeWidth="2.6" />
      <circle cx="19" cy="9" r="7" strokeWidth="2.6" />
    </svg>
  );
}
