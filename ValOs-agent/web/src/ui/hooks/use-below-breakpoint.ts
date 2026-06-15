import { useEffect, useState } from "react";

export function useBelowBreakpoint(px: number) {
  const [below, setBelow] = useState(() =>
    typeof window === "undefined" ? false : window.innerWidth < px,
  );

  useEffect(() => {
    const update = () => setBelow(window.innerWidth < px);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [px]);

  return below;
}
