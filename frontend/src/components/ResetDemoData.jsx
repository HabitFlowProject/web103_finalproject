import { useState } from "react";
import { resetDemoData } from "../api/reset.js";

// Restores the seeded demo data. `onReset` runs after a successful reset so
// the current page can reload.
export default function ResetDemoData({ onReset }) {
  const [isResetting, setIsResetting] = useState(false);
  const [status, setStatus] = useState(null);

  async function handleReset() {
    if (
      !window.confirm(
        "Reset all tasks, habits, and check-ins to the original demo data? This cannot be undone.",
      )
    ) {
      return;
    }

    setIsResetting(true);
    setStatus(null);

    try {
      await resetDemoData();
      setStatus({ isError: false, message: "Demo data restored." });
      onReset();
    } catch (error) {
      console.error(error);
      setStatus({
        isError: true,
        message:
          error.status === 0
            ? "Unable to reach the server. Please try again."
            : "Unable to reset the demo data. Please try again.",
      });
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <>
      {status && (
        <p className={status.isError ? "reset-status is-error" : "reset-status"} role="status">
          {status.message}
        </p>
      )}
      <button type="button" className="button button-quiet" onClick={handleReset} disabled={isResetting}>
        {isResetting ? "Resetting..." : "Reset demo data"}
      </button>
    </>
  );
}
