import markDark from "../assets/brand/mark_dark.png";
import markLight from "../assets/brand/mark_light.png";

// The "H" mark plus the HabitFlow wordmark. Both mark crops are rendered and
// CSS shows the one that matches the theme. The wordmark is live text, so it
// stays sharp at any size (the wordmark PNG crops are low resolution).
// variant: "full" (mark + wordmark) or "mark" (mark only).
export default function Logo({ variant = "full", height = 40 }) {
  return (
    <span
      className={`logo logo-${variant}`}
      style={{ "--logo-height": `${height}px` }}
      role="img"
      aria-label="HabitFlow"
    >
      <img className="logo-mark logo-dark" src={markDark} alt="" />
      <img className="logo-mark logo-light" src={markLight} alt="" />
      {variant === "full" && (
        <span className="logo-word" aria-hidden="true">
          Habit<span className="logo-word-accent">Flow</span>
        </span>
      )}
    </span>
  );
}
