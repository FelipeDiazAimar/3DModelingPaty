import type { ReactNode } from "react";

export type IconName =
  | "cube" | "factory" | "pause" | "layers" | "gauge" | "scale" | "forklift" | "chart" | "flask"
  | "pallet" | "target" | "truck" | "cog" | "box" | "clock" | "meat" | "bolt" | "stack";

const P: Record<IconName, ReactNode> = {
  cube: <><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" /><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5" /></>,
  factory: <><path d="M3 20V10l6 3V10l6 3V6h3v14z" /><path d="M7 20v-3M12 20v-3M17 20v-3" /></>,
  pause: <><rect x="6" y="5" width="4" height="14" rx="1.5" /><rect x="14" y="5" width="4" height="14" rx="1.5" /></>,
  layers: <><path d="M12 4l9 5-9 5-9-5z" /><path d="M3 14l9 5 9-5" /></>,
  gauge: <><path d="M4 16a8 8 0 1116 0" /><path d="M12 16l4-5" /><circle cx="12" cy="16" r="1" /></>,
  scale: <><path d="M12 4v16M6 20h12" /><path d="M5 8h14" /><path d="M5 8l-2.5 6a3 3 0 005 0zM19 8l-2.5 6a3 3 0 005 0z" /></>,
  forklift: <><path d="M4 17V9h7v8" /><path d="M11 12h3l2 3v2" /><path d="M17 4v13M17 17h4" /><circle cx="7" cy="18" r="2" /><circle cx="14" cy="18" r="2" /></>,
  chart: <><path d="M4 20V4" /><path d="M4 20h16" /><path d="M8 15l3-4 3 2 4-6" /></>,
  flask: <><path d="M9 3h6M10 3v6l-5 9a2 2 0 002 3h10a2 2 0 002-3l-5-9V3" /><path d="M8 15h8" /></>,
  pallet: <><rect x="4" y="5" width="16" height="9" rx="1.5" /><path d="M4 9.5h16M12 5v9" /><path d="M3 17h18v3H3z" /></>,
  target: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="0.8" /></>,
  truck: <><path d="M3 6h11v10H3zM14 9h4l3 3v4h-7" /><circle cx="7" cy="17.5" r="2" /><circle cx="17" cy="17.5" r="2" /></>,
  cog: <><circle cx="12" cy="12" r="3" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" /></>,
  box: <><path d="M12 3l8 4v10l-8 4-8-4V7z" /><path d="M4 7l8 4 8-4M12 11v10" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3.5 2" /></>,
  meat: <><path d="M5 14c0-5 4-9 9-9a5 5 0 015 5c0 5-4 9-9 9a5 5 0 01-5-5z" /><circle cx="14" cy="10" r="1.6" /></>,
  bolt: <><path d="M13 3L5 13h6l-1 8 8-10h-6z" /></>,
  stack: <><rect x="5" y="4" width="14" height="4" rx="1.2" /><rect x="5" y="10" width="14" height="4" rx="1.2" /><rect x="5" y="16" width="14" height="4" rx="1.2" /></>,
};

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {P[name]}
    </svg>
  );
}
