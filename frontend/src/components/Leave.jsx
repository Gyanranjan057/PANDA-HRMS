import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { getCurrentSession, logoutFromLocalStorage } from "../utils/authStorage";
const LEAVE_STORAGE_KEY = "panda-leave-requests";
const THEME_STORAGE_KEY = "panda-theme";
const LEAVE_TYPES = [
  "Annual Leave",
  "Sick Leave",
  "Casual Leave",
  "Personal Leave",
  "Unpaid Leave",
  "Maternity / Paternity Leave",
];
const STATUS_OPTIONS = ["All statuses", "Pending", "Approved", "Rejected", "Withdrawn"];
function getCurrentUser() {
  const session = getCurrentSession();
  if (session?.user && typeof session.user === "object") {
    const user = session.user;
    return {
      ...user,
      id: user.employeeId || user.id || user._id || "EMP-LOCAL",
      name: user.name || user.fullName || user.username || "Employee",
      email: user.email || "employee@panda.local",
      role: user.role || "Employee",
    };
  }

  let storedUser = null;
  let storedInfo = {};
  const rawUser = localStorage.getItem("user") || sessionStorage.getItem("user");
  const rawInfo = localStorage.getItem("userInfo") || sessionStorage.getItem("userInfo");
  if (rawUser) {
    try {
      storedUser = JSON.parse(rawUser);
    } catch {
      storedUser = rawUser;
    }
  }
  if (rawInfo) {
    try {
      storedInfo = JSON.parse(rawInfo) || {};
    } catch {
      storedInfo = {};
    }
  }
  const userObject = storedUser && typeof storedUser === "object" ? storedUser : {};
  const role = localStorage.getItem("role") || sessionStorage.getItem("role") || storedInfo.role || userObject.role || userObject.user?.role || "employee";
  const email = storedInfo.email || userObject.email || (typeof storedUser === "string" ? storedUser : "") || localStorage.getItem("email") || sessionStorage.getItem("email") || "employee@panda.local";
  const emailName = email.includes("@") ? email.split("@")[0] : email;
  const fallbackName = emailName.replace(/[._-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  return {
    id: storedInfo.id || storedInfo._id || userObject._id || userObject.id || userObject.employeeId || "EMP-LOCAL",
    name: storedInfo.name || storedInfo.fullName || userObject.name || userObject.fullName || userObject.username || fallbackName || "Employee",
    email,
    role: String(role).trim(),
  };
}
function readRequests() {
  try {
    const saved = localStorage.getItem(LEAVE_STORAGE_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
function makeId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `leave-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
function dateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function formatDate(value) {
  if (!value) return "—";
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
function calendarDays(from, to) {
  if (!from || !to) return 0;
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  const diff = Math.round((end.getTime() - start.getTime()) / 86400000);
  return diff >= 0 ? diff + 1 : 0;
}
function isAdminRole(role) {
  return ["admin", "administrator", "hr", "hr admin", "hr super admin", "superadmin"].includes(
    String(role || "").toLowerCase()
  );
}
function initials(name = "Employee") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] || "")
    .join("")
    .toUpperCase();
}
function StatusPill({ status }) {
  return <span className={`lm-status lm-status-${String(status).toLowerCase()}`}>{status}</span>;
}
function MetricCard({ icon, title, value, note, accent }) {
  return (
    <div className="lm-metric-card">
      <div className={`lm-metric-icon ${accent}`}>{icon}</div>
      <div className="lm-metric-copy">
        <span>{title}</span>
        <strong>{value}</strong>
        <small>{note}</small>
      </div>
    </div>
  );
}
export default function Leave() {
  const navigate = useNavigate();
  const outletContext = useOutletContext() || {};
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [requests, setRequests] = useState(() => readRequests());
  const [storedTheme, setStoredTheme] = useState(() => {
    try {
      return localStorage.getItem(THEME_STORAGE_KEY) || "dark";
    } catch {
      return "dark";
    }
  });
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [viewMode, setViewMode] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState(() => {
    const today = dateString(new Date());
    return {
      leaveType: "Annual Leave",
      fromDate: today,
      toDate: today,
      reason: "",
      handoverTo: "",
    };
  });
  const isAdmin = isAdminRole(currentUser.role);
  const theme = typeof outletContext.isDarkMode === "boolean"
    ? (outletContext.isDarkMode ? "dark" : "light")
    : storedTheme;
  const activeViewMode = viewMode || (isAdmin ? "all" : "mine");
  const displayRole = currentUser.role || "Employee";
  const handleLogout = () => {
    logoutFromLocalStorage();
    navigate("/login", { replace: true });
  };
  const goToProfilePage = (path) => {
    setIsProfileOpen(false);
    navigate(path);
  };
  // Local-only mode: requests are persisted in this browser's local storage.
  useEffect(() => {
    try {
      localStorage.setItem(LEAVE_STORAGE_KEY, JSON.stringify(requests));
    } catch {
      // Keep the page usable in memory if browser storage is unavailable.
    }
  }, [requests]);
  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Theme still works for the current session if storage is unavailable.
    }
  }, [theme]);
  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === LEAVE_STORAGE_KEY) setRequests(readRequests());
      if (["user", "userInfo", "role", "email"].includes(event.key)) {
        setCurrentUser(getCurrentUser());
        setViewMode(null);
      }
      if (event.key === THEME_STORAGE_KEY && event.newValue) {
        setStoredTheme(event.newValue);
      }
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setMobileNavOpen(false);
        setShowRequestForm(false);
      }
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);
  const myRequests = useMemo(
    () =>
      requests.filter(
        (request) =>
          request.employeeEmail?.toLowerCase() === currentUser.email.toLowerCase() ||
          request.employeeId === currentUser.id
      ),
    [requests, currentUser]
  );
  const scopedRequests = useMemo(() => {
    if (!isAdmin || activeViewMode === "mine") return myRequests;
    return requests;
  }, [isAdmin, activeViewMode, myRequests, requests]);
  const visibleRequests = useMemo(() => {
    const query = search.trim().toLowerCase();
    return scopedRequests
      .filter((request) =>
        statusFilter === "All statuses" ? true : request.status === statusFilter
      )
      .filter((request) => {
        if (!query) return true;
        return [
          request.employeeName,
          request.employeeEmail,
          request.employeeId,
          request.leaveType,
          request.reason,
        ].some((value) => String(value || "").toLowerCase().includes(query));
      })
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [scopedRequests, search, statusFilter]);
  const summary = useMemo(() => {
    return scopedRequests.reduce(
      (result, request) => {
        result.total += 1;
        if (request.status === "Pending") result.pending += 1;
        if (request.status === "Approved") result.approved += 1;
        if (request.status === "Rejected") result.rejected += 1;
        return result;
      },
      { total: 0, pending: 0, approved: 0, rejected: 0 }
    );
  }, [scopedRequests]);
  const updateForm = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };
  const submitLeaveRequest = (event) => {
    event.preventDefault();
    setFormError("");
    if (!form.fromDate || !form.toDate || !form.reason.trim()) {
      setFormError("Please complete the leave dates and reason.");
      return;
    }
    if (form.toDate < form.fromDate) {
      setFormError("The end date cannot be earlier than the start date.");
      return;
    }
    if (form.reason.trim().length < 8) {
      setFormError("Please provide a little more detail about your leave reason.");
      return;
    }
    const request = {
      id: makeId(),
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      employeeEmail: currentUser.email,
      leaveType: form.leaveType,
      fromDate: form.fromDate,
      toDate: form.toDate,
      reason: form.reason.trim(),
      handoverTo: form.handoverTo.trim(),
      days: calendarDays(form.fromDate, form.toDate),
      status: "Pending",
      createdAt: new Date().toISOString(),
      reviewedAt: null,
      reviewedBy: null,
      adminNote: "",
    };
    setRequests((previous) => [request, ...previous]);
    setForm({
      leaveType: "Annual Leave",
      fromDate: dateString(new Date()),
      toDate: dateString(new Date()),
      reason: "",
      handoverTo: "",
    });
    setShowRequestForm(false);
    setViewMode(isAdmin ? "all" : "mine");
    setStatusFilter("All statuses");
    setSearch("");
  };
  const reviewRequest = (requestId, nextStatus) => {
    if (!isAdmin || !["Approved", "Rejected"].includes(nextStatus)) return;
    setRequests((previous) => previous.map((request) =>
      request.id === requestId && request.status === "Pending"
        ? {
            ...request,
            status: nextStatus,
            reviewedAt: new Date().toISOString(),
            reviewedBy: currentUser.name,
          }
        : request
    ));
  };
  const withdrawRequest = (requestId) => {
    setRequests((previous) => previous.map((request) =>
      request.id === requestId && request.status === "Pending" &&
      (request.employeeEmail?.toLowerCase() === currentUser.email.toLowerCase() || request.employeeId === currentUser.id)
        ? { ...request, status: "Withdrawn" }
        : request
    ));
  };
  const exportCsv = () => {
    const rows = [
      [
        "Employee ID",
        "Employee Name",
        "Email",
        "Leave Type",
        "From",
        "To",
        "Days",
        "Reason",
        "Status",
        "Reviewed By",
      ],
      ...visibleRequests.map((request) => [
        request.employeeId,
        request.employeeName,
        request.employeeEmail,
        request.leaveType,
        request.fromDate,
        request.toDate,
        request.days,
        request.reason,
        request.status,
        request.reviewedBy || "",
      ]),
    ];
    const csv = rows
      .map((row) =>
        row
          .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\r\n");
    const blobUrl = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const anchor = document.createElement("a");
    anchor.href = blobUrl;
    anchor.download = `leave-requests-${dateString(new Date())}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(blobUrl);
  };
  const navGroups = [
    {
      title: "MAIN",
      items: [
        { label: "Dashboard", icon: "▦", path: "/home" },
        { label: "Tasks", icon: "☑", path: "/tasks", badge: "To Do" },
        { label: "Employees", icon: "♙", path: "/employees" },
        { label: "Chat & Calls", icon: "▱", path: "/chat" },
      ],
    },
    {
      title: "WORKSPACE",
      items: [
        { label: "Projects", icon: "▱", path: "/projects" },
        { label: "Teams", icon: "♧", path: "/teams" },
      ],
    },
    {
      title: "SYSTEM",
      items: [{ label: "Settings", icon: "⚙", path: "/settings" }],
    },
    {
      title: "ADMINISTRATION",
      items: [
        { label: "Control Center", icon: "⛨", path: "/control-center" },
        { label: "All Attendance", icon: "▤", path: "/attendance" },
        { label: "Leave Management", icon: "▧", path: "/leave", active: true, badge: summary.pending ? `${summary.pending} pending` : "Leave" },
      ],
    },
  ];
  return (
    <div className="lm-app" data-theme={theme}>
      <header className="lm-header">
        <div className="lm-statusbar">
          <div className="lm-window-dots" aria-hidden="true">
            <i /> <i /> <i />
          </div>
          <span className="lm-admin-level">{displayRole.toUpperCase()}</span>
        </div>
        <div className="lm-topnav">
          <button
            type="button"
            className="lm-icon-button lm-mobile-menu"
            aria-label="Open navigation menu"
            onClick={() => setMobileNavOpen(true)}
          >
            ☰
          </button>
          <Link to="/home" className="lm-brand" aria-label="Panda Workspace home">
            <span className="lm-brand-logo">🐼</span>
            <span className="lm-brand-text">
              <strong>Panda Workspace</strong>
              <small>INFOTECH PLATFORM</small>
            </span>
          </Link>
          <div className="lm-global-search">
            <span>⌕</span>
            <input aria-label="Search workspace" placeholder="Search staff, designation, payroll..." />
          </div>
          <div className="lm-top-actions">
            <button
              type="button"
              className="lm-theme-toggle"
              onClick={() => setStoredTheme((value) => (value === "dark" ? "light" : "dark"))}
              aria-label="Toggle light and dark theme"
            >
              {theme === "dark" ? "☀️" : "🌙"} <span className="lm-hide-mobile">{theme === "dark" ? "Light Theme" : "Dark Theme"}</span>
            </button>
            <button className="lm-icon-button lm-notification-button" type="button" aria-label="Notifications">♧<span /></button>
            <div className="lm-profile-menu-wrap">
              <button
                type="button"
                className="lm-profile-pill"
                onClick={() => setIsProfileOpen((open) => !open)}
                aria-expanded={isProfileOpen}
                aria-haspopup="true"
                aria-label={`Open profile menu for ${currentUser.name}`}
              >
                <span className="lm-profile-avatar">{initials(currentUser.name).slice(0, 2)}</span>
                <span className="lm-profile-copy">
                  <strong>{currentUser.name}</strong>
                  <small>{displayRole}</small>
                </span>
                <span className="lm-profile-chevron">⌄</span>
              </button>
              {isProfileOpen && (
                <>
                  <button type="button" className="lm-profile-dismiss" aria-label="Close profile menu" onClick={() => setIsProfileOpen(false)} />
                  <div className="lm-profile-dropdown">
                    <div className="lm-profile-dropdown-info">
                      <strong>{currentUser.name}</strong>
                      <span>{currentUser.email || "Work email not available"}</span>
                      <small>{displayRole}</small>
                    </div>
                    <button type="button" onClick={() => goToProfilePage("/settings")}>My Profile / Settings</button>
                    {isAdmin && <button type="button" onClick={() => goToProfilePage("/control-center")}>Control Center</button>}
                    <button type="button" className="lm-profile-signout" onClick={handleLogout}>Sign Out</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
      {mobileNavOpen && (
        <button
          type="button"
          className="lm-mobile-backdrop"
          aria-label="Close navigation menu"
          onClick={() => setMobileNavOpen(false)}
        />
      )}
      <aside className={`lm-sidebar ${mobileNavOpen ? "lm-sidebar-open" : ""}`}>
        {navGroups.map((group) => (
          <section className="lm-nav-group" key={group.title}>
            <p className="lm-nav-heading">{group.title}</p>
            {group.items.map((item) => (
              <Link
                key={item.label}
                to={item.path}
                title={item.label}
                aria-current={item.active ? "page" : undefined}
                onClick={() => setMobileNavOpen(false)}
                className={`lm-nav-link ${item.active ? "lm-nav-active" : ""}`}
              >
                <span className="lm-nav-icon">{item.icon}</span>
                <span className="lm-nav-label">{item.label}</span>
                {item.badge && <span className="lm-nav-badge">{item.badge}</span>}
              </Link>
            ))}
          </section>
        ))}
      </aside>
      <main className="lm-main">
        <div className="lm-page-heading">
          <div>
            <div className="lm-eyebrow"><span /> PEOPLE OPERATIONS</div>
            <h1>Leave Management</h1>
            <p>{isAdmin ? "Review team leave requests and manage approval decisions." : "Request time off and keep track of your leave decisions."}</p>
          </div>
          <div className="lm-heading-actions">
            <button type="button" className="lm-secondary-button" onClick={exportCsv}>⇩ Export CSV</button>
            <button type="button" className="lm-primary-button" onClick={() => { setFormError(""); setShowRequestForm(true); }}>＋ Request Leave</button>
          </div>
        </div>
{isAdmin && (
          <div className="lm-review-banner">
            <span className="lm-review-icon">✓</span>
            <div>
              <strong>Administrator review</strong>
              <p>You can approve or reject pending requests. Only accounts with an admin/HR role should see these controls.</p>
            </div>
            <span className="lm-pending-chip">{summary.pending} pending</span>
          </div>
        )}
        <section className="lm-metrics-grid" aria-label="Leave request summary">
          <MetricCard title="Total Requests" value={summary.total} note="In the selected view" icon="▤" accent="lm-accent-green" />
          <MetricCard title="Pending Review" value={summary.pending} note="Awaiting a decision" icon="◷" accent="lm-accent-amber" />
          <MetricCard title="Approved" value={summary.approved} note="Approved requests" icon="✓" accent="lm-accent-blue" />
          <MetricCard title="Rejected" value={summary.rejected} note="Requests not approved" icon="×" accent="lm-accent-red" />
        </section>
        <section className="lm-panel">
          <div className="lm-panel-heading">
            <div>
              <h2>{isAdmin && activeViewMode === "all" ? "All employee requests" : "My leave requests"}</h2>
              <p>{isAdmin && activeViewMode === "all" ? "Review each request and record a decision." : "Your submitted leave requests and their current status."}</p>
            </div>
            <div className="lm-panel-actions">
              {isAdmin && (
                <div className="lm-view-switch" role="group" aria-label="Request scope">
                  <button type="button" className={activeViewMode === "all" ? "selected" : ""} onClick={() => setViewMode("all")}>All requests</button>
                  <button type="button" className={activeViewMode === "mine" ? "selected" : ""} onClick={() => setViewMode("mine")}>My requests</button>
                </div>
              )}
              <label className="lm-search-field">
                <span aria-hidden="true">⌕</span>
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={isAdmin && activeViewMode === "all" ? "Search employee..." : "Search requests..."} aria-label="Search leave requests" />
              </label>
              <select className="lm-status-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter by request status">
                {STATUS_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
          </div>
          {visibleRequests.length === 0 ? (
            <div className="lm-empty-state">
              <span className="lm-empty-icon">▧</span>
              <h3>No leave requests found</h3>
              <p>{search || statusFilter !== "All statuses" ? "Try changing your search or status filter." : "When you submit a leave request, it will appear here."}</p>
              {!search && statusFilter === "All statuses" && <button type="button" className="lm-primary-button" onClick={() => setShowRequestForm(true)}>＋ Create first request</button>}
            </div>
          ) : (
            <div className="lm-table-wrap">
              <table className="lm-table">
                <thead>
                  <tr>
                    {isAdmin && activeViewMode === "all" && <th>Employee</th>}
                    <th>Leave type</th>
                    <th>Dates</th>
                    <th>Days</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th className="lm-actions-column">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRequests.map((request) => {
                    const belongsToCurrentUser = request.employeeEmail?.toLowerCase() === currentUser.email.toLowerCase() || request.employeeId === currentUser.id;
                    const canReview = isAdmin && request.status === "Pending";
                    const canWithdraw = belongsToCurrentUser && request.status === "Pending";
                    return (
                      <tr key={request.id}>
                        {isAdmin && activeViewMode === "all" && (
                          <td>
                            <div className="lm-employee-cell">
                              <span className="lm-employee-avatar">{initials(request.employeeName)}</span>
                              <span><strong>{request.employeeName || "Employee"}</strong><small>{request.employeeId || request.employeeEmail}</small></span>
                            </div>
                          </td>
                        )}
                        <td><span className="lm-leave-type">{request.leaveType}</span></td>
                        <td><strong className="lm-date-range">{formatDate(request.fromDate)}</strong><small className="lm-subline">to {formatDate(request.toDate)}</small></td>
                        <td><span className="lm-day-count">{request.days || calendarDays(request.fromDate, request.toDate)} <small>day(s)</small></span></td>
                        <td className="lm-reason-cell"><span title={request.reason}>{request.reason}</span>{request.handoverTo && <small className="lm-subline">Handover: {request.handoverTo}</small>}{request.adminNote && <small className="lm-review-note">Note: {request.adminNote}</small>}</td>
                        <td><StatusPill status={request.status} /></td>
                        <td><span className="lm-submitted-date">{request.createdAt ? new Date(request.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</span>{request.reviewedBy && <small className="lm-subline">By {request.reviewedBy}</small>}</td>
                        <td>
                          {canReview ? (
                            <div className="lm-review-actions">
                              <button type="button" className="lm-approve-button" onClick={() => reviewRequest(request.id, "Approved")} title="Approve request">Approve</button>
                              <button type="button" className="lm-reject-button" onClick={() => reviewRequest(request.id, "Rejected")} title="Reject request">Reject</button>
                            </div>
                          ) : canWithdraw ? (
                            <button type="button" className="lm-withdraw-button" onClick={() => withdrawRequest(request.id)}>Withdraw</button>
                          ) : (
                            <span className="lm-no-action">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="lm-table-footer"><span>Showing {visibleRequests.length} of {scopedRequests.length} request(s)</span><span className="lm-demo-label"><i /> Local browser storage</span></div>
        </section>
        <p className="lm-disclaimer">This version stores requests only in this browser. It does not sync requests between different browsers or devices.</p>
      </main>
      {showRequestForm && (
        <div className="lm-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowRequestForm(false); }}>
          <section className="lm-modal" role="dialog" aria-modal="true" aria-labelledby="lm-modal-title">
            <div className="lm-modal-header">
              <div><span className="lm-modal-kicker">TIME OFF REQUEST</span><h2 id="lm-modal-title">Request a leave</h2><p>Submit your dates and a short reason for your manager.</p></div>
              <button type="button" className="lm-modal-close" aria-label="Close form" onClick={() => setShowRequestForm(false)}>×</button>
            </div>
            <form onSubmit={submitLeaveRequest} className="lm-request-form">
              <div className="lm-form-grid">
                <label className="lm-form-field lm-form-full"><span>Leave type <b>*</b></span><select name="leaveType" value={form.leaveType} onChange={updateForm}>{LEAVE_TYPES.map((type) => <option key={type}>{type}</option>)}</select></label>
                <label className="lm-form-field"><span>Start date <b>*</b></span><input type="date" name="fromDate" value={form.fromDate} onChange={updateForm} required /></label>
                <label className="lm-form-field"><span>End date <b>*</b></span><input type="date" name="toDate" min={form.fromDate} value={form.toDate} onChange={updateForm} required /></label>
                <div className="lm-days-preview lm-form-full"><span>Requested duration</span><strong>{calendarDays(form.fromDate, form.toDate)} calendar day(s)</strong></div>
                <label className="lm-form-field lm-form-full"><span>Reason for leave <b>*</b></span><textarea name="reason" value={form.reason} onChange={updateForm} placeholder="Briefly explain the reason for your leave..." rows={4} maxLength={600} required /></label>
                <label className="lm-form-field lm-form-full"><span>Work handover to <small>(optional)</small></span><input name="handoverTo" value={form.handoverTo} onChange={updateForm} placeholder="Colleague name" maxLength={100} /></label>
              </div>
              {formError && <p className="lm-form-error" role="alert">{formError}</p>}
              <div className="lm-form-footer"><p>Your request will be marked <strong>Pending</strong> until an admin reviews it.</p><div><button type="button" className="lm-secondary-button" onClick={() => setShowRequestForm(false)}>Cancel</button><button type="submit" className="lm-primary-button">Submit request <span>→</span></button></div></div>
            </form>
          </section>
        </div>
      )}
      <style>{`
        .lm-app { --lm-bg:#030a09; --lm-panel:#081a17; --lm-panel-2:#0b211c; --lm-line:#163a31; --lm-text:#e4f1ec; --lm-muted:#829f95; --lm-green:#10d7a0; --lm-accent-bg:#09271f; --lm-input:#04100e; min-height:100vh; background:var(--lm-bg); color:var(--lm-text); font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
        .lm-app[data-theme="light"] { --lm-bg:#f0f5f3; --lm-panel:#fff; --lm-panel-2:#f7faf8; --lm-line:#dce8e3; --lm-text:#19372e; --lm-muted:#688178; --lm-green:#047857; --lm-accent-bg:#e8f8f1; --lm-input:#f8fbf9; }
        .lm-app * { box-sizing:border-box; }
        .lm-app button,.lm-app input,.lm-app select,.lm-app textarea { font:inherit; }
        .lm-header { height:96px; position:fixed; z-index:60; left:0; right:0; top:0; background:var(--lm-panel); border-bottom:1px solid var(--lm-line); }
        .lm-statusbar { height:33px; display:flex; align-items:center; justify-content:center; position:relative; padding:0 18px; border-bottom:1px solid var(--lm-line); background:var(--lm-bg); color:var(--lm-muted); font-size:10px; }
        .lm-window-dots { position:absolute; left:20px; display:flex; gap:6px; }
        .lm-window-dots i { width:7px; height:7px; display:block; border-radius:50%; background:#fb7185; }
        .lm-window-dots i:nth-child(2) { background:#fbbf24; } .lm-window-dots i:nth-child(3) { background:#10b981; }
        .lm-server-pill { border:1px solid var(--lm-line); background:var(--lm-accent-bg); color:var(--lm-green); border-radius:999px; padding:4px 11px; font-family:ui-monospace,SFMono-Regular,Menlo,monospace; }
        .lm-admin-level { position:absolute; right:20px; color:var(--lm-green); font-weight:800; letter-spacing:.08em; font-size:9px; }
        .lm-topnav { height:62px; padding:0 20px; display:flex; align-items:center; gap:14px; background:var(--lm-panel); }
        .lm-brand { display:flex; align-items:center; gap:10px; text-decoration:none; color:var(--lm-text); flex-shrink:0; }
        .lm-brand-logo { height:39px; width:39px; display:grid; place-items:center; background:var(--lm-accent-bg); border:1px solid var(--lm-line); border-radius:12px; font-size:20px; }
        .lm-brand-text strong { display:block; font-size:14px; line-height:1.4; font-weight:850; }
        .lm-brand-text small { display:block; margin-top:1px; color:var(--lm-green); letter-spacing:.16em; font-size:8px; font-weight:800; }
        .lm-global-search { display:flex; align-items:center; gap:11px; width:min(440px,40vw); margin:auto; border:1px solid var(--lm-line); background:var(--lm-input); border-radius:999px; padding:9px 14px; color:var(--lm-muted); }
        .lm-global-search input { width:100%; min-width:0; border:0; outline:0; background:transparent; color:var(--lm-text); font-size:12px; }
        .lm-global-search input::placeholder { color:var(--lm-muted); }
        .lm-top-actions { margin-left:auto; display:flex; align-items:center; gap:8px; }
        .lm-theme-toggle,.lm-icon-button { display:inline-flex; align-items:center; justify-content:center; gap:7px; border:1px solid var(--lm-line); color:var(--lm-text); background:var(--lm-accent-bg); border-radius:999px; padding:9px 12px; font-size:11px; font-weight:700; cursor:pointer; white-space:nowrap; }
        .lm-icon-button { width:38px; height:38px; padding:0; font-size:16px; position:relative; }
        .lm-notification-button span { position:absolute; height:6px; width:6px; border-radius:50%; background:var(--lm-green); right:7px; top:7px; }
        .lm-profile-pill { display:flex; align-items:center; gap:8px; padding:4px 10px 4px 4px; border:1px solid var(--lm-line); background:var(--lm-accent-bg); border-radius:999px; max-width:205px; }
        .lm-profile-avatar { display:grid; place-items:center; width:30px; height:30px; background:#059669; border-radius:50%; color:white; font-size:12px; font-weight:800; }
        .lm-profile-copy { min-width:0; } .lm-profile-copy strong { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:11px; } .lm-profile-copy small { display:block; margin-top:2px; color:var(--lm-muted); font-size:9px; }
        .lm-profile-chevron { color:var(--lm-muted); font-size:12px; }
        .lm-profile-menu-wrap { position:relative; z-index:70; }
        .lm-profile-pill { position:relative; z-index:50; cursor:pointer; color:var(--lm-text); font:inherit; }
        .lm-profile-dismiss { position:fixed; inset:0; z-index:40; border:0; background:transparent; }
        .lm-profile-dropdown { position:absolute; z-index:80; top:calc(100% + 8px); right:0; width:250px; padding:8px; border:1px solid var(--lm-line); border-radius:14px; background:var(--lm-panel); color:var(--lm-text); box-shadow:0 18px 45px rgba(0,0,0,.25); }
        .lm-profile-dropdown-info { padding:9px 10px 12px; border-bottom:1px solid var(--lm-line); margin-bottom:5px; }
        .lm-profile-dropdown-info strong { display:block; overflow-wrap:anywhere; font-size:12px; }
        .lm-profile-dropdown-info span { display:block; margin-top:4px; overflow-wrap:anywhere; color:var(--lm-muted); font-size:10px; }
        .lm-profile-dropdown-info small { display:block; margin-top:5px; color:var(--lm-green); font-size:10px; }
        .lm-profile-dropdown button { display:block; width:100%; padding:9px 10px; border:0; border-radius:8px; background:transparent; color:var(--lm-text); text-align:left; font-size:11px; cursor:pointer; }
        .lm-profile-dropdown button:hover { background:var(--lm-accent-bg); }
        .lm-profile-dropdown .lm-profile-signout { color:#fb7185; }
        .lm-mobile-menu { display:none; }
        .lm-sidebar { position:fixed; z-index:50; top:96px; bottom:0; left:0; width:224px; padding:22px 11px; background:var(--lm-panel); border-right:1px solid var(--lm-line); overflow:auto; }
        .lm-nav-group { margin-bottom:24px; }
        .lm-nav-heading { margin:0 0 10px 8px; color:var(--lm-muted); opacity:.75; font-size:9px; font-weight:850; letter-spacing:.18em; }
        .lm-nav-link { display:flex; align-items:center; gap:12px; min-height:41px; margin-bottom:3px; padding:9px 11px; border:1px solid transparent; border-radius:11px; color:var(--lm-muted); text-decoration:none; font-size:12px; font-weight:600; transition:background .15s,color .15s; }
        .lm-nav-link:hover { background:var(--lm-panel-2); color:var(--lm-text); }
        .lm-nav-link.lm-nav-active { background:var(--lm-accent-bg); border-color:#096046; color:var(--lm-green); }
        .lm-nav-icon { display:inline-grid; place-items:center; flex-shrink:0; width:19px; font-size:17px; }
        .lm-nav-label { flex:1; white-space:nowrap; } .lm-nav-badge { border:1px solid #155640; background:var(--lm-accent-bg); border-radius:999px; padding:4px 7px; color:var(--lm-green); font-size:8px; white-space:nowrap; }
        .lm-main { margin-left:224px; padding:125px 28px 35px; max-width:1700px; }
        .lm-page-heading { display:flex; align-items:flex-end; justify-content:space-between; gap:20px; margin-bottom:25px; }
        .lm-eyebrow { display:flex; align-items:center; gap:8px; margin-bottom:9px; color:var(--lm-green); font-size:9px; font-weight:850; letter-spacing:.17em; }
        .lm-eyebrow span { width:6px; height:6px; background:var(--lm-green); border-radius:50%; }
        .lm-page-heading h1 { margin:0; color:var(--lm-text); font-size:clamp(26px,3vw,34px); letter-spacing:-.04em; line-height:1.15; font-weight:850; }
        .lm-page-heading p { margin:9px 0 0; color:var(--lm-muted); font-size:13px; }
        .lm-heading-actions { display:flex; flex-wrap:wrap; gap:9px; }
        .lm-primary-button,.lm-secondary-button { min-height:39px; display:inline-flex; align-items:center; justify-content:center; gap:8px; padding:10px 14px; border-radius:10px; font-size:11px; font-weight:800; white-space:nowrap; cursor:pointer; transition:transform .15s,background .15s,border-color .15s; }
        .lm-primary-button { background:#059669; color:#fff; border:1px solid #059669; box-shadow:0 6px 16px rgba(5,150,105,.14); }
        .lm-primary-button:hover { background:#047857; transform:translateY(-1px); }
        .lm-secondary-button { color:var(--lm-text); background:var(--lm-panel); border:1px solid var(--lm-line); }
        .lm-secondary-button:hover { border-color:#10b981; }
        .lm-review-banner { display:flex; align-items:center; gap:12px; padding:14px 17px; margin-bottom:18px; background:var(--lm-panel); border:1px solid var(--lm-line); border-radius:14px; }
        .lm-local-alert { margin:0 0 16px; padding:12px 14px; border-radius:10px; font-size:11px; line-height:1.6; background:#342814; border:1px solid #74551d; color:#fcd34d; }
        .lm-app[data-theme="light"] .lm-local-alert { background:#fff7df; border-color:#f4d78a; color:#92400e; }
        .lm-review-icon { width:35px; height:35px; display:grid; place-items:center; flex-shrink:0; color:var(--lm-green); background:var(--lm-accent-bg); border-radius:10px; font-weight:900; }
        .lm-review-banner strong { color:var(--lm-text); display:block; font-size:12px; }
        .lm-review-banner p { color:var(--lm-muted); margin:4px 0 0; font-size:11px; }
        .lm-pending-chip { margin-left:auto; flex-shrink:0; padding:6px 9px; border-radius:8px; background:#342814; color:#fbbf24; font-size:10px; font-weight:800; }
        .lm-metrics-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:15px; margin-bottom:22px; }
        .lm-metric-card { display:flex; align-items:flex-start; gap:13px; min-width:0; padding:18px; border:1px solid var(--lm-line); background:var(--lm-panel); border-radius:15px; }
        .lm-metric-icon { display:grid; place-items:center; width:41px; height:41px; flex-shrink:0; border-radius:12px; font-size:19px; font-weight:800; }
        .lm-accent-green { background:#0a3025; color:#34d399; } .lm-accent-amber { background:#342814; color:#fbbf24; } .lm-accent-blue { background:#102b39; color:#7dd3fc; } .lm-accent-red { background:#35191c; color:#fda4af; }
        .lm-app[data-theme="light"] .lm-accent-green { background:#e6f8ef; color:#047857; } .lm-app[data-theme="light"] .lm-accent-amber { background:#fff4d9; color:#a16207; } .lm-app[data-theme="light"] .lm-accent-blue { background:#e5f5ff; color:#0369a1; } .lm-app[data-theme="light"] .lm-accent-red { background:#fff0f0; color:#be123c; }
        .lm-metric-copy { min-width:0; } .lm-metric-copy span { display:block; color:var(--lm-muted); font-size:11px; font-weight:600; } .lm-metric-copy strong { display:block; color:var(--lm-text); margin:5px 0 2px; font-size:25px; letter-spacing:-.03em; line-height:1.1; } .lm-metric-copy small { display:block; color:var(--lm-muted); font-size:9px; }
        .lm-panel { background:var(--lm-panel); border:1px solid var(--lm-line); border-radius:16px; overflow:hidden; }
        .lm-panel-heading { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:15px; padding:20px; border-bottom:1px solid var(--lm-line); }
        .lm-panel-heading h2 { margin:0; color:var(--lm-text); font-size:16px; font-weight:800; }
        .lm-panel-heading p { margin:5px 0 0; color:var(--lm-muted); font-size:11px; }
        .lm-panel-actions { display:flex; flex-wrap:wrap; align-items:center; gap:8px; }
        .lm-refresh-button { min-height:36px; padding:8px 10px; } .lm-refresh-button:disabled { opacity:.55; cursor:wait; }
        .lm-view-switch { display:flex; gap:3px; padding:3px; border-radius:9px; background:var(--lm-panel-2); border:1px solid var(--lm-line); }
        .lm-view-switch button { border:0; background:transparent; color:var(--lm-muted); border-radius:7px; padding:7px 10px; font-size:10px; font-weight:700; cursor:pointer; white-space:nowrap; }
        .lm-view-switch button.selected { background:#0d3429; color:#34d399; }
        .lm-app[data-theme="light"] .lm-view-switch button.selected { background:#e2f7ed; color:#047857; }
        .lm-search-field { display:flex; align-items:center; gap:7px; min-height:36px; padding:0 10px; border:1px solid var(--lm-line); border-radius:9px; background:var(--lm-input); color:var(--lm-muted); }
        .lm-search-field input { width:155px; min-width:0; color:var(--lm-text); outline:none; border:0; background:transparent; font-size:10px; }
        .lm-search-field input::placeholder { color:var(--lm-muted); }
        .lm-status-filter { min-height:36px; max-width:140px; padding:0 10px; color:var(--lm-text); background:var(--lm-input); border:1px solid var(--lm-line); border-radius:9px; outline:none; font-size:10px; }
        .lm-table-wrap { width:100%; overflow:auto; }
        .lm-table { width:100%; min-width:950px; border-collapse:collapse; text-align:left; }
        .lm-table th { padding:13px 14px; color:var(--lm-muted); background:var(--lm-panel-2); border-bottom:1px solid var(--lm-line); font-size:9px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; white-space:nowrap; }
        .lm-table td { padding:15px 14px; vertical-align:middle; border-bottom:1px solid var(--lm-line); color:var(--lm-text); font-size:11px; }
        .lm-table tbody tr:last-child td { border-bottom:0; } .lm-table tbody tr:hover { background:var(--lm-panel-2); }
        .lm-employee-cell { display:flex; align-items:center; gap:9px; min-width:155px; }
        .lm-employee-avatar { width:32px; height:32px; display:grid; place-items:center; flex-shrink:0; border:1px solid var(--lm-line); border-radius:10px; color:var(--lm-green); background:var(--lm-accent-bg); font-size:10px; font-weight:850; }
        .lm-employee-cell strong { display:block; color:var(--lm-text); font-size:11px; white-space:nowrap; } .lm-employee-cell small { display:block; margin-top:4px; color:var(--lm-muted); font-size:9px; }
        .lm-leave-type { display:inline-flex; padding:6px 8px; border-radius:7px; background:var(--lm-panel-2); color:var(--lm-text); font-size:10px; font-weight:700; white-space:nowrap; }
        .lm-date-range { display:block; color:var(--lm-text); font-size:10px; white-space:nowrap; } .lm-subline { display:block; margin-top:4px; color:var(--lm-muted); font-size:9px; }
        .lm-day-count { white-space:nowrap; font-weight:800; color:var(--lm-text); } .lm-day-count small { color:var(--lm-muted); font-weight:500; font-size:9px; }
        .lm-reason-cell { max-width:220px; min-width:130px; color:var(--lm-muted)!important; line-height:1.5; } .lm-reason-cell>span { display:-webkit-box; overflow:hidden; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow-wrap:anywhere; }
        .lm-review-note { display:block; margin-top:5px; color:#fbbf24; font-size:9px; }
        .lm-status { display:inline-flex; align-items:center; justify-content:center; min-width:70px; padding:6px 9px; border:1px solid transparent; border-radius:999px; font-size:9px; font-weight:800; white-space:nowrap; }
        .lm-status-pending { color:#fbbf24; background:#342814; border-color:#74551d; } .lm-status-approved { color:#34d399; background:#0a3025; border-color:#17654e; } .lm-status-rejected { color:#fda4af; background:#35191c; border-color:#74313b; } .lm-status-withdrawn { color:#9ca3af; background:#20282b; border-color:#3e4a4f; }
        .lm-app[data-theme="light"] .lm-status-pending { color:#92400e; background:#fff4d9; border-color:#f4d78a; } .lm-app[data-theme="light"] .lm-status-approved { color:#047857; background:#e6f8ef; border-color:#b5ebd3; } .lm-app[data-theme="light"] .lm-status-rejected { color:#be123c; background:#fff0f0; border-color:#fecdd3; } .lm-app[data-theme="light"] .lm-status-withdrawn { color:#64748b; background:#f1f5f9; border-color:#dbe3ec; }
        .lm-actions-column { min-width:145px; } .lm-review-actions { display:flex; gap:5px; }
        .lm-approve-button,.lm-reject-button,.lm-withdraw-button { border:1px solid transparent; border-radius:7px; padding:7px 8px; cursor:pointer; font-size:9px; font-weight:800; white-space:nowrap; }
        .lm-approve-button { background:#0a3025; color:#34d399; border-color:#17654e; } .lm-reject-button { background:#35191c; color:#fda4af; border-color:#74313b; } .lm-withdraw-button { background:var(--lm-panel-2); color:var(--lm-muted); border-color:var(--lm-line); }
        .lm-app[data-theme="light"] .lm-approve-button { background:#e6f8ef; color:#047857; border-color:#b5ebd3; } .lm-app[data-theme="light"] .lm-reject-button { background:#fff0f0; color:#be123c; border-color:#fecdd3; }
        .lm-no-action { color:var(--lm-muted); padding-left:14px; }
        .lm-table-footer { display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; padding:13px 18px; border-top:1px solid var(--lm-line); background:var(--lm-panel-2); color:var(--lm-muted); font-size:10px; }
        .lm-demo-label { display:flex; align-items:center; gap:7px; } .lm-demo-label i { width:6px; height:6px; background:#fbbf24; border-radius:50%; }
        .lm-empty-state { padding:55px 20px; text-align:center; }
        .lm-empty-icon { display:grid; place-items:center; width:55px; height:55px; margin:0 auto 15px; border:1px solid var(--lm-line); border-radius:16px; background:var(--lm-accent-bg); color:var(--lm-green); font-size:25px; }
        .lm-empty-state h3 { margin:0; color:var(--lm-text); font-size:15px; } .lm-empty-state p { margin:7px 0 18px; color:var(--lm-muted); font-size:11px; }
        .lm-disclaimer { margin:14px 3px 0; color:var(--lm-muted); font-size:10px; line-height:1.6; }
        .lm-mobile-backdrop { display:none; }
        .lm-modal-backdrop { position:fixed; inset:0; z-index:100; display:flex; align-items:center; justify-content:center; padding:18px; background:rgba(0,0,0,.68); backdrop-filter:blur(5px); overflow-y:auto; }
        .lm-modal { width:min(620px,100%); max-height:calc(100vh - 36px); overflow:auto; color:var(--lm-text); background:var(--lm-panel); border:1px solid var(--lm-line); border-radius:18px; box-shadow:0 24px 90px rgba(0,0,0,.38); }
        .lm-modal-header { display:flex; justify-content:space-between; gap:20px; padding:23px 24px 18px; border-bottom:1px solid var(--lm-line); }
        .lm-modal-kicker { color:var(--lm-green); font-size:9px; font-weight:850; letter-spacing:.16em; }
        .lm-modal-header h2 { margin:7px 0 0; color:var(--lm-text); font-size:23px; letter-spacing:-.03em; }
        .lm-modal-header p { margin:6px 0 0; color:var(--lm-muted); font-size:11px; }
        .lm-modal-close { flex-shrink:0; width:33px; height:33px; color:var(--lm-muted); background:var(--lm-panel-2); border:1px solid var(--lm-line); border-radius:9px; font-size:23px; cursor:pointer; }
        .lm-request-form { padding:21px 24px 22px; }
        .lm-form-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:15px; }
        .lm-form-full { grid-column:1/-1; }
        .lm-form-field { display:flex; flex-direction:column; gap:7px; min-width:0; }
        .lm-form-field>span { color:var(--lm-text); font-size:11px; font-weight:750; }
        .lm-form-field b { color:#f87171; }
        .lm-form-field small { color:var(--lm-muted); font-weight:500; }
        .lm-form-field input,.lm-form-field select,.lm-form-field textarea { width:100%; min-width:0; padding:11px 12px; outline:none; border:1px solid var(--lm-line); border-radius:9px; background:var(--lm-input); color:var(--lm-text); font-size:12px; }
        .lm-form-field input:focus,.lm-form-field select:focus,.lm-form-field textarea:focus { border-color:#10b981; box-shadow:0 0 0 3px rgba(16,185,129,.12); }
        .lm-form-field textarea { resize:vertical; min-height:95px; }
        .lm-days-preview { display:flex; justify-content:space-between; align-items:center; gap:10px; padding:12px 13px; border:1px solid var(--lm-line); border-radius:9px; background:var(--lm-panel-2); color:var(--lm-muted); font-size:10px; }
        .lm-days-preview strong { color:var(--lm-green); font-size:11px; }
        .lm-form-error { color:#fb7185; font-size:11px; margin:13px 0 0; }
        .lm-form-footer { display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap; margin-top:22px; padding-top:17px; border-top:1px solid var(--lm-line); }
        .lm-form-footer>p { flex:1; margin:0; color:var(--lm-muted); font-size:10px; line-height:1.6; } .lm-form-footer>p strong { color:#fbbf24; }
        .lm-form-footer>div { display:flex; gap:8px; }
        @media(max-width:1279px) { .lm-sidebar { width:72px; padding:20px 8px; } .lm-nav-heading,.lm-nav-label,.lm-nav-badge { display:none; } .lm-nav-link { justify-content:center; padding:10px 0; } .lm-nav-icon { width:24px; font-size:19px; } .lm-main { margin-left:72px; } .lm-profile-copy,.lm-profile-chevron { display:none; } .lm-profile-pill { padding:4px; } .lm-metrics-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } }
        @media(max-width:767px) { .lm-header { height:92px; } .lm-statusbar { height:30px; justify-content:flex-start; padding-left:14px; } .lm-window-dots { display:none; } .lm-admin-level { display:none; } .lm-topnav { height:62px; padding:0 12px; gap:8px; } .lm-mobile-menu { display:inline-flex; flex-shrink:0; } .lm-brand { gap:7px; } .lm-brand-logo { width:34px; height:34px; font-size:17px; } .lm-brand-text strong { font-size:12px; } .lm-brand-text small { font-size:7px; } .lm-global-search { display:none; } .lm-top-actions { gap:5px; } .lm-theme-toggle { padding:8px 10px; } .lm-hide-mobile { display:none; } .lm-notification-button { display:none; } .lm-sidebar { top:92px; width:250px; padding:18px 11px; transform:translateX(-105%); transition:transform .22s ease; box-shadow:none; } .lm-sidebar.lm-sidebar-open { transform:translateX(0); box-shadow:15px 0 40px rgba(0,0,0,.24); } .lm-nav-heading,.lm-nav-label,.lm-nav-badge { display:initial; } .lm-nav-heading { display:block; } .lm-nav-link { justify-content:flex-start; padding:9px 11px; } .lm-nav-icon { width:19px; font-size:17px; } .lm-mobile-backdrop { display:block; position:fixed; z-index:45; inset:92px 0 0; width:100%; height:calc(100vh - 92px); border:0; background:rgba(0,0,0,.55); } .lm-main { margin-left:0; padding:115px 13px 25px; } .lm-page-heading { align-items:flex-start; flex-direction:column; gap:15px; margin-bottom:20px; } .lm-page-heading h1 { font-size:28px; } .lm-heading-actions { width:100%; } .lm-heading-actions button { flex:1; } .lm-review-banner { align-items:flex-start; flex-wrap:wrap; } .lm-pending-chip { margin-left:auto; } .lm-metrics-grid { gap:9px; margin-bottom:15px; } .lm-metric-card { padding:13px 11px; gap:9px; border-radius:12px; } .lm-metric-icon { width:33px; height:33px; font-size:16px; border-radius:9px; } .lm-metric-copy span { font-size:9px; } .lm-metric-copy strong { font-size:21px; } .lm-metric-copy small { font-size:8px; } .lm-panel-heading { align-items:stretch; padding:15px 12px; } .lm-panel-actions { display:grid; grid-template-columns:1fr 1fr; } .lm-view-switch { grid-column:1/-1; } .lm-view-switch button { flex:1; } .lm-search-field { grid-column:1/-1; } .lm-search-field input { width:100%; } .lm-status-filter { max-width:none; width:100%; } .lm-table { min-width:820px; } .lm-table th,.lm-table td { padding:12px 10px; } .lm-table-footer { padding:12px; } .lm-form-grid { grid-template-columns:1fr; } .lm-form-full { grid-column:auto; } .lm-modal-header,.lm-request-form { padding-left:17px; padding-right:17px; } .lm-form-footer { align-items:stretch; } .lm-form-footer>div { width:100%; } .lm-form-footer>div button { flex:1; } }
        @media(max-width:380px) { .lm-brand-text { display:none; } .lm-profile-copy,.lm-profile-chevron { display:none; } .lm-profile-pill { display:flex; padding:4px; } .lm-metrics-grid { grid-template-columns:1fr 1fr; } }
        .lm-app { min-height:0; background:transparent; }
        .lm-header,.lm-sidebar,.lm-mobile-backdrop { display:none !important; }
        .lm-main { margin:0 !important; padding:0 !important; max-width:none; }
      `}</style>
    </div>
  );
}
