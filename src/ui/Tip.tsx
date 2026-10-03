import { useId, type ReactNode } from "react";
import "./tip.css";

interface Props {
  tip: ReactNode;
  children: ReactNode;
}

/** Wraps `children` with a hover/focus tooltip explaining what it means. */
export function Tip({ tip, children }: Props) {
  const id = useId();
  return (
    <span className="tip" tabIndex={0} aria-describedby={id}>
      {children}
      <span className="tip-bubble" role="tooltip" id={id}>
        {tip}
      </span>
    </span>
  );
}
