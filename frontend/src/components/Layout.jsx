import { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { HeaderActionContext } from "./HeaderAction.jsx";
import Logo from "./Logo.jsx";
import Navigation from "./Navigation.jsx";
import ResetDemoData from "./ResetDemoData.jsx";
import ThemeToggle from "./ThemeToggle.jsx";
import UserMenu from "./UserMenu.jsx";

export default function Layout() {
  // Bumped after a reset; re-keying the page remounts it so it reloads data.
  const [dataVersion, setDataVersion] = useState(0);
  // DOM node where the current page portals its primary action button.
  const [actionSlot, setActionSlot] = useState(null);

  return (
    <HeaderActionContext.Provider value={actionSlot}>
      <div className="app-shell">
        <header className="app-header">
          <Link to="/" className="nav-brand" aria-label="HabitFlow home">
            <Logo height={44} />
          </Link>
          <div className="header-tools">
            <ThemeToggle />
            <UserMenu />
            <div className="header-action-slot" ref={setActionSlot} />
          </div>
        </header>
        <main className="app-main">
          <Outlet key={dataVersion} />
        </main>
        <footer className="app-footer">
          <ResetDemoData onReset={() => setDataVersion((version) => version + 1)} />
        </footer>
        <Navigation />
      </div>
    </HeaderActionContext.Provider>
  );
}
