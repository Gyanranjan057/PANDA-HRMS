import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getCurrentSession,
  logoutFromLocalStorage,
} from "../utils/authStorage";

function readStoredUser() {
  const session = getCurrentSession();
  if (session?.user) return session.user;

  try {
    const savedUser =
      localStorage.getItem("user") || sessionStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  } catch (error) {
    console.warn("Unable to read saved user profile:", error);
    return null;
  }
}

function Icon({ name, className = "h-5 w-5" }) {
  const icons = {
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
      </>
    ),
    tasks: (
      <>
        <path d="m9 11 3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    chat: (
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    ),
    projects: (
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33H15a1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15v-.09a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </>
    ),
    shield: (
      <>
        <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </>
    ),
    close: <path d="m18 6-12 12M6 6l12 12" />,
  };

  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {icons[name] || icons.dashboard}
    </svg>
  );
}

export default function Navbar({
  isDarkMode: initialDarkMode = true,
  onThemeToggle,
  onLogout,
  onMenuClick,
  searchQuery: controlledSearchQuery,
  onSearchChange,
  notifications = [],
  onClearNotifications,
}) {
  const navigate = useNavigate();
  const currentUser = readStoredUser();
  const displayName = currentUser?.name || "Guest User";
  const displayRole = currentUser?.role || "Employee";
  const displayEmail = currentUser?.email || "";
  const isAdmin = [
    "admin",
    "administrator",
    "hr",
    "hr admin",
    "hr super admin",
    "superadmin",
  ].includes(String(displayRole).trim().toLowerCase());
  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "GU";

  const [isDarkMode, setIsDarkMode] = useState(initialDarkMode);
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadNotifications, setUnreadNotifications] = useState(3);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  useEffect(() => {
    setIsDarkMode(initialDarkMode);
  }, [initialDarkMode]);

  useEffect(() => {
    const closeProfile = (event) => {
      if (event.key === "Escape") setIsProfileOpen(false);
    };
    window.addEventListener("keydown", closeProfile);
    return () => window.removeEventListener("keydown", closeProfile);
  }, []);

  const toggleTheme = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    onThemeToggle?.(next);
  };

  const goToPage = (path) => {
    navigate(path);
    setIsProfileOpen(false);
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      logoutFromLocalStorage();
      navigate("/login", { replace: true });
    }
  };

  const colors = isDarkMode
    ? {
        root: "bg-[#071514] text-white border-[#123832]",
        strip: "bg-[#05100f] border-[#0e2924]",
        control: "bg-[#092420] border-[#13453d] text-slate-300",
        input: "bg-[#051210] border-[#123d36] text-white placeholder:text-slate-500",
        dropdown: "bg-[#081a18] border-[#123832]",
      }
    : {
        root: "bg-white text-slate-900 border-slate-200",
        strip: "bg-slate-50 border-slate-200",
        control: "bg-slate-50 border-slate-300 text-slate-700",
        input: "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400",
        dropdown: "bg-white border-slate-200",
      };

  return (
    <header className={`relative z-30 w-full min-w-0 border-b ${colors.root}`}>
      {/* Security strip: tablet and laptop */}
      <div className={`hidden items-center justify-between gap-3 border-b px-5 py-2 sm:flex lg:px-6 ${colors.strip}`}>
        {/* <div className="flex shrink-0 items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          <span className="h-2 w-2 rounded-full bg-amber-400" />
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
        </div> */}

        {/* <div className={`flex min-w-0 items-center gap-2 rounded-full border px-3 py-1 font-mono text-[10px] ${colors.control}`}>
          <span className="text-emerald-500">🔒</span>
          <span className="truncate">panda-workspace.internal</span>
        </div> */}

        <span className="shrink-0 rounded-full border border-emerald-800 bg-emerald-950/30 px-3 py-1 text-[9px] font-bold tracking-wide text-emerald-400">
          {displayRole.toUpperCase()}
        </span>
      </div>

      {/* Mobile navbar */}
      <div className="flex h-14 items-center px-3 sm:hidden">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open sidebar"
          aria-controls="home-sidebar"
          title="Open navigation"
          className={`flex h-10 w-10 items-center justify-center rounded-xl border transition hover:border-emerald-500 ${colors.control}`}
        >
          <Icon name="menu" className="h-6 w-6" />
        </button>
        <span className="ml-3 font-bold">Panda Workspace</span>
      </div>

      {/* Tablet and desktop navbar */}
      <div className="hidden min-w-0 flex-wrap items-center gap-4 px-5 py-3 sm:flex lg:flex-nowrap lg:px-6">
        <button
          type="button"
          onClick={() => goToPage(isAdmin ? "/home" : "/employee/dashboard")}
          className="flex min-w-0 items-center gap-3 text-left"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-800 bg-emerald-950/30 text-xl">
            🐼
          </span>
          <span className="min-w-0">
            <span className="block truncate text-base font-extrabold lg:text-lg">Panda Workspace</span>
            <span className="hidden text-[9px] font-extrabold tracking-widest text-emerald-500 md:block">INFOTECH PLATFORM</span>
          </span>
        </button>

        <div className="order-3 w-full min-w-0 lg:order-none lg:flex-1">
          <div className="relative mx-auto max-w-xl">
            <Icon name="search" className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="search"
              value={controlledSearchQuery ?? searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                onSearchChange?.(event.target.value);
              }}
              placeholder="Search staff, designation, payroll..."
              aria-label="Search workspace"
              className={`w-full rounded-full border py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 ${colors.input}`}
            />
          </div>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2 lg:ml-0">
          {/* <button
            type="button"
            onClick={toggleTheme}
            title="Change theme"
            className={`flex h-9 items-center justify-center gap-2 rounded-full border px-3 text-xs font-bold hover:border-emerald-500 ${colors.control}`}
          >
            <span>{isDarkMode ? "☀️" : "🌙"}</span>
            <span className="hidden md:inline">Theme</span>
          </button> */}

          {/* <button
            type="button"
            onClick={() => {
              setIsNotificationsOpen((open) => !open);
              setUnreadNotifications(0);
            }}
            title="Notifications"
            aria-label="Notifications"
            aria-expanded={isNotificationsOpen}
            className={`relative flex h-9 w-9 items-center justify-center rounded-full border hover:border-emerald-500 ${colors.control}`}
          >
            <Icon name="bell" className="h-5 w-5" />
            {(notifications.length > 0 || unreadNotifications > 0) && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-emerald-500" />
            )}
          </button> */}
          {isNotificationsOpen && (
            <div className={`absolute right-16 top-full z-40 mt-2 w-64 rounded-xl border p-2 shadow-xl ${colors.dropdown}`}>
              <div className="flex items-center justify-between border-b border-slate-500/20 px-2 pb-2">
                <span className="text-sm font-semibold">Notifications</span>
                {notifications.length > 0 && (
                  <button type="button" className="text-xs text-emerald-500" onClick={onClearNotifications}>Clear</button>
                )}
              </div>
              {notifications.length > 0
                ? notifications.map((note, index) => <p key={`${note}-${index}`} className="border-b border-slate-500/20 px-2 py-2 text-xs text-slate-500">{note}</p>)
                : <p className="px-2 py-3 text-xs text-slate-500">No notifications</p>}
            </div>
          )}

          {/* Dynamic user profile */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsProfileOpen((open) => !open)}
              aria-expanded={isProfileOpen}
              aria-haspopup="true"
              className={`flex h-10 items-center gap-2 rounded-full border px-2 py-1 hover:border-emerald-500 ${colors.control}`}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                {initials}
              </span>
              <span className="hidden text-left xl:block">
                <span className="block max-w-40 truncate text-sm">{displayName}</span>
                <span className="block text-[10px] text-slate-400">{displayRole}</span>
              </span>
              <span className="hidden text-xs xl:inline">⌄</span>
            </button>

            {isProfileOpen && (
              <>
                <button
                  type="button"
                  aria-label="Close profile menu"
                  onClick={() => setIsProfileOpen(false)}
                  className="fixed inset-0 z-40 cursor-default"
                />
                <div className={`absolute right-0 top-full z-50 mt-2 w-60 rounded-xl border p-2 shadow-xl ${colors.dropdown}`}>
                  <div className="px-3 py-2">
                    <p className="break-words text-sm font-bold">{displayName}</p>
                    <p className="mt-1 break-words text-[10px] text-slate-500">
                      {displayEmail || "Work email not available"}
                    </p>
                    <p className="mt-1 text-[10px] font-semibold text-emerald-500">{displayRole}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => goToPage("/settings")}
                    className="w-full rounded-lg px-3 py-2 text-left text-xs hover:bg-emerald-500/10"
                  >
                    My Profile / Settings
                  </button>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => goToPage("/control-center")}
                      className="w-full rounded-lg px-3 py-2 text-left text-xs hover:bg-emerald-500/10"
                    >
                      Control Center
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full rounded-lg px-3 py-2 text-left text-xs text-red-500 hover:bg-red-500/10"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
