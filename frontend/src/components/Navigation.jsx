import { useLayoutEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { DashboardIcon, HabitsIcon, InsightsIcon, TasksIcon } from "./Icons.jsx";

const links = [
  { to: "/", label: "Dashboard", end: true, Icon: DashboardIcon },
  { to: "/tasks", label: "Tasks", Icon: TasksIcon },
  { to: "/habits", label: "Habits", Icon: HabitsIcon },
  { to: "/insights", label: "Insights", Icon: InsightsIcon },
];

// The fixed bottom dock. A single highlight pill slides to the active link.
// (Sign out lives in the header's UserMenu.)
export default function Navigation() {
  const listRef = useRef(null);
  const location = useLocation();
  const [indicator, setIndicator] = useState(null);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) {
      return undefined;
    }

    function measure() {
      const active = list.querySelector(".nav-link.active");
      setIndicator(
        active ? { left: active.offsetLeft, top: active.offsetTop, width: active.offsetWidth, height: active.offsetHeight } : null,
      );
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, [location.pathname]);

  return (
    <nav className="dock glass" aria-label="Main">
      <ul className={indicator ? "nav-links has-indicator" : "nav-links"} ref={listRef}>
        {indicator && (
          <li
            className="dock-indicator"
            aria-hidden="true"
            style={{
              width: indicator.width,
              height: indicator.height,
              transform: `translate(${indicator.left}px, ${indicator.top}px)`,
            }}
          />
        )}
        {links.map(({ to, label, end, Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              aria-label={label}
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            >
              <Icon size={18} />
              <span className="nav-link-label">{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
