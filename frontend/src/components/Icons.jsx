// Small inline SVG icons. They use currentColor so they follow the text colour,
// and are decorative (aria-hidden) unless a label is passed by the caller.

function Svg({ size = 18, children, strokeWidth = 2, className, ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...rest}
    >
      {children}
    </svg>
  );
}

export function DashboardIcon(props) {
  return (
    <Svg {...props}>
      <rect x="3" y="3" width="7.5" height="7.5" rx="2" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="2" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" />
    </Svg>
  );
}

export function TasksIcon(props) {
  return (
    <Svg {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <path d="m8 12.5 2.6 2.6L16 9.5" />
    </Svg>
  );
}

export function HabitsIcon(props) {
  return (
    <Svg {...props}>
      <path d="M20 12a8 8 0 1 1-2.34-5.66" />
      <path d="M20 4v4.5h-4.5" />
    </Svg>
  );
}

export function InsightsIcon(props) {
  return (
    <Svg {...props}>
      <path d="M5 20V12" />
      <path d="M12 20V5" />
      <path d="M19 20v-9" />
    </Svg>
  );
}

export function ListIcon(props) {
  return (
    <Svg {...props}>
      <path d="M5 7h14M5 12h14M5 17h14" />
    </Svg>
  );
}

export function CheckIcon(props) {
  return (
    <Svg {...props}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </Svg>
  );
}

export function AlertIcon(props) {
  return (
    <Svg {...props}>
      <path d="M12 5v9" />
      <path d="M12 19h.01" strokeWidth="3" />
    </Svg>
  );
}

export function StarIcon(props) {
  return (
    <Svg {...props} strokeWidth="1.5">
      <path
        fill="currentColor"
        d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"
      />
    </Svg>
  );
}

export function PlusIcon(props) {
  return (
    <Svg {...props}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  );
}

export function SearchIcon(props) {
  return (
    <Svg {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.2-4.2" />
    </Svg>
  );
}

export function ArrowRightIcon(props) {
  return (
    <Svg {...props}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Svg>
  );
}

export function SunIcon(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
    </Svg>
  );
}

export function MoonIcon(props) {
  return (
    <Svg {...props}>
      <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
    </Svg>
  );
}

export function ChevronDownIcon(props) {
  return (
    <Svg {...props}>
      <path d="m6 9 6 6 6-6" />
    </Svg>
  );
}

export function GitHubIcon({ size = 20, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path
        fill="currentColor"
        d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.04 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.62 1.58.23 2.75.11 3.04.74.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5z"
      />
    </svg>
  );
}

// A teardrop flame. The outer shape takes currentColor; the inner core uses
// --flame-core so each surface can choose a contrasting centre.
export function FlameIcon({ size = 20, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className={className ? `flame-icon ${className}` : "flame-icon"}
    >
      <path
        fill="currentColor"
        d="M12 1.8c.9 3.4 3.3 5.4 5 7.6 1.3 1.7 2.1 3.5 2.1 5.6 0 4.1-3.2 7.2-7.1 7.2s-7.1-3.1-7.1-7.2c0-2.3 1-4.2 2.4-5.9.2 1.5.9 2.6 1.9 3.3-.2-4.4 1.1-7.6 2.8-10.6z"
      />
      <ellipse cx="12" cy="17" rx="2.4" ry="2.9" fill="var(--flame-core, rgba(0,0,0,.28))" />
    </svg>
  );
}
