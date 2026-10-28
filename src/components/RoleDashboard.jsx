import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import AdminOverview from "./AdminOverview.jsx";
import ManageUsers from "./ManageUsers.jsx";

const dashboardContent = {
  admin: {
    title: "Admin Dashboard",
    description: "Welcome to the system administration workspace.",
  },
  farmer: {
    title: "Farmer Dashboard",
    description: "Welcome to your agriculture workspace.",
  },
  resident: {
    title: "Resident Dashboard",
    description: "Welcome to your community agriculture workspace.",
  },
};

export default function RoleDashboard({ user, role }) {
  const content = dashboardContent[role];
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [now, setNow] = useState(new Date());
  const [adminPage, setAdminPage] = useState("dashboard");
  const displayName = user.displayName || "No display name";

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!logoutModalOpen || loggingOut) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setLogoutModalOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [logoutModalOpen, loggingOut]);

  const logout = async () => {
    setLogoutError("");
    setLoggingOut(true);
    try {
      await signOut(auth);
    } catch {
      setLogoutError("Unable to log out. Please try again.");
      setLoggingOut(false);
    }
  };

  return (
    <main className="role-dashboard">
      <header className="dashboard-topbar">
        <div className="topbar-start">
          <button
            className="menu-toggle"
            type="button"
            aria-label={drawerOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={drawerOpen}
            aria-controls="dashboard-drawer"
            onClick={() => setDrawerOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>
          <span className="topbar-title">Agriculture Monitoring System</span>
        </div>
        <div className="topbar-account">
          <div className="dashboard-clock" aria-label="Current time and date">
            <strong>{now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</strong>
            <span>{now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</span>
          </div>
          <div className="account-menu">
            <button
              className="account-toggle"
              type="button"
              aria-expanded={accountOpen}
              aria-controls="account-popover"
              onClick={() => {
                setAccountOpen((open) => !open);
                setDrawerOpen(false);
              }}
            >
              <span className="account-avatar">{(user.displayName || user.email || "U").charAt(0).toUpperCase()}</span>
              <span className="account-label">{user.displayName || user.email}</span>
            </button>
            {accountOpen && (
              <section className="account-popover" id="account-popover" aria-label="Account information">
                <p className="popover-heading">Account information</p>
                <dl>
                  <div><dt>Name</dt><dd>{displayName}</dd></div>
                  <div><dt>Email</dt><dd>{user.email || "No email address"}</dd></div>
                  <div><dt>Role</dt><dd className="role-capitalize">{role}</dd></div>
                </dl>
                {logoutError && <p className="logout-error" role="alert">{logoutError}</p>}
                <button
                  className="logout-button"
                  type="button"
                  onClick={() => {
                    setLogoutError("");
                    setAccountOpen(false);
                    setLogoutModalOpen(true);
                  }}
                >
                  Logout
                </button>
              </section>
            )}
          </div>
        </div>
      </header>

      {drawerOpen && (
        <button
          className="drawer-backdrop"
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setDrawerOpen(false)}
        />
      )}
      <nav
        className={`navigation-drawer${drawerOpen ? " is-open" : ""}`}
        id="dashboard-drawer"
        aria-label="Dashboard navigation"
        aria-hidden={!drawerOpen}
        inert={!drawerOpen}
      >
        <div className="drawer-brand">
          <div className="drawer-logo">
            <img src="/images/logo.png" alt="" />
          </div>
          <div>
            <strong>Agriculture<br />Monitoring System</strong>
            <span className="role-capitalize">{role} workspace</span>
          </div>
        </div>
        <p className="drawer-section-label">Workspace</p>
        <button
          className={`drawer-link${adminPage === "dashboard" ? " active" : ""}`}
          type="button"
          onClick={() => {
            setAdminPage("dashboard");
            setDrawerOpen(false);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <span className="drawer-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V10Z" />
            </svg>
          </span>
          <span className="drawer-link-label">Dashboard</span>
          <span className="drawer-active-indicator" aria-hidden="true" />
        </button>
        {role === "admin" && (
          <button
            className={`drawer-link${adminPage === "manage-users" ? " active" : ""}`}
            type="button"
            onClick={() => {
              setAdminPage("manage-users");
              setDrawerOpen(false);
            }}
          >
            <span className="drawer-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="10" cy="7" r="4" />
                <path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </span>
            <span className="drawer-link-label">Manage Users</span>
          </button>
        )}
        <div className="drawer-footer">
          <span className="drawer-footer-dot" />
          <span>Signed in as <strong className="role-capitalize">{role}</strong></span>
        </div>
      </nav>

      {role === "admin" && (
        adminPage === "manage-users" ? <ManageUsers /> : <AdminOverview />
      )}
      {logoutModalOpen && (
        <div
          className="logout-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !loggingOut) setLogoutModalOpen(false);
          }}
        >
          <section
            className="logout-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-modal-title"
            aria-describedby="logout-modal-description"
          >
            <div className="logout-modal-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M10 17l5-5-5-5M15 12H3" />
                <path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
              </svg>
            </div>
            <h2 id="logout-modal-title">Log out of your account?</h2>
            <p id="logout-modal-description">You can sign back in anytime with your account credentials.</p>
            {logoutError && <p className="logout-modal-error" role="alert">{logoutError}</p>}
            <div className="logout-modal-actions">
              <button
                className="secondary"
                type="button"
                disabled={loggingOut}
                onClick={() => {
                  setLogoutError("");
                  setLogoutModalOpen(false);
                }}
              >
                Cancel
              </button>
              <button className="logout-confirm-button" type="button" disabled={loggingOut} onClick={logout}>
                {loggingOut ? "Logging out..." : "Yes, log out"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
