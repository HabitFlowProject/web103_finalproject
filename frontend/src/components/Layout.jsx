import { useState } from "react";
import { Outlet } from "react-router-dom";
import Navigation from "./Navigation.jsx";
import ResetDemoData from "./ResetDemoData.jsx";

export default function Layout() {
  // Bumped after a reset; re-keying the page remounts it so it reloads data.
  const [dataVersion, setDataVersion] = useState(0);

  return (
    <div className="app-shell">
      <header className="app-header">
        <Navigation />
      </header>
      <main className="app-main">
        <Outlet key={dataVersion} />
      </main>
      <footer className="app-footer">
        <ResetDemoData onReset={() => setDataVersion((version) => version + 1)} />
      </footer>
    </div>
  );
}
