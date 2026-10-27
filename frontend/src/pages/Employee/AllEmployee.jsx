import { useEffect, useState } from "react";
import {
  useLocation,
  useNavigate,
  useOutletContext,
} from "react-router-dom";
import {
  Bell,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Folder,
  LayoutGrid,
  MessageCircle,
  Moon,
  Plus,
  Search,
  Settings,
  Sun,
  Users,
  UsersRound,
} from "lucide-react";

import { useGetEmployeesQuery } from "../../slice/employeesService/employeeApi";
import { apiRequest } from "../../utils/api";

const PAGE_SIZE = 10;
const THEME_KEY = "panda-employee-theme";

const WORK_TYPES = [
  "Full Time",
  "Remote",
  "Intern",
  "Notice Period",
];

function validTheme(value) {
  return value === "dark" || value === "light";
}

function readTheme(fallback = "dark") {
  try {
    const saved = window.localStorage.getItem(THEME_KEY);
    return validTheme(saved) ? saved : fallback;
  } catch {
    return fallback;
  }
}

function saveTheme(value) {
  try {
    window.localStorage.setItem(THEME_KEY, value);
  } catch {
    // Storage may be unavailable.
  }
}

const NAV = [
  {
    label: "Main",
    items: [
      {
        name: "Dashboard",
        icon: LayoutGrid,
      },
      {
        name: "Tasks",
        icon: CheckCircle2,
        pill: "To Do",
      },
      {
        name: "Employee",
        icon: Users,
        active: true,
      },
      {
        name: "Chat & Calls",
        icon: MessageCircle,
        pill: "Live",
      },
    ],
  },
  {
    label: "Workspace",
    items: [
      {
        name: "Projects",
        icon: Folder,
      },
      {
        name: "Teams",
        icon: UsersRound,
      },
    ],
  },
  {
    label: "System",
    items: [
      {
        name: "Settings",
        icon: Settings,
      },
    ],
  },
];

// SOLID COLORS ONLY - NO GLASS EFFECT
const THEMES = {
  dark: {
    page: "bg-[#0a1519] text-slate-100",

    bar: "bg-[#0d1a21] border-[#1f3541]",

    card: "bg-[#12222b] border-[#1f3541]",

    inset: "bg-[#0a1419] border-[#1f3541]",

    line: "border-[#1f3541]",

    muted: "text-slate-400",

    control:
      "bg-[#12222b] border-[#1f3541] hover:bg-[#182b36]",

    input:
      "bg-[#12222b] border-[#1f3541] text-slate-100 placeholder:text-slate-500 focus:border-emerald-400",

    hover: "hover:bg-[#182b36]",

    head: "bg-[#0a1419] text-slate-400",

    chip:
      "border-[#2a4452] bg-[#0a1419] text-slate-300",

    accent:
      "border-emerald-500/40 bg-[#14362f] text-emerald-400",

    accentText: "text-emerald-400",

    green: "text-emerald-400",

    blue: "text-sky-400",

    present:
      "border-emerald-700 bg-[#14362f] text-emerald-400",

    absent:
      "border-rose-800 bg-[#381e29] text-rose-400",

    workType: {
      "Full Time":
        "border-slate-600 bg-slate-700 text-slate-200",
      Remote:
        "border-sky-800 bg-[#152e40] text-sky-400",
      Intern:
        "border-violet-800 bg-[#302445] text-violet-400",
      "Notice Period":
        "border-amber-800 bg-[#3d301d] text-amber-400",
    },
  },

  light: {
    page: "bg-slate-50 text-slate-900",

    bar: "bg-white border-slate-200",

    card: "bg-white border-slate-200",

    inset: "bg-slate-50 border-slate-200",

    line: "border-slate-200",

    muted: "text-slate-500",

    control:
      "bg-white border-slate-200 hover:bg-slate-50",

    input:
      "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-orange-400",

    hover: "hover:bg-slate-50",

    head: "bg-slate-50 text-slate-500",

    chip:
      "border-slate-300 bg-slate-100 text-slate-700",

    accent:
      "border-orange-200 bg-orange-50 text-orange-600",

    accentText: "text-orange-600",

    green: "text-emerald-600",

    blue: "text-sky-600",

    present:
      "border-emerald-300 bg-emerald-50 text-emerald-700",

    absent:
      "border-rose-300 bg-rose-50 text-rose-700",

    workType: {
      "Full Time":
        "border-slate-300 bg-slate-100 text-slate-700",
      Remote:
        "border-sky-300 bg-sky-50 text-sky-700",
      Intern:
        "border-violet-300 bg-violet-50 text-violet-700",
      "Notice Period":
        "border-amber-300 bg-amber-50 text-amber-700",
    },
  },
};

// AVATAR
function Avatar({ name = "", src, t }) {
  const [failed, setFailed] = useState(false);

  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  if (!src || failed) {
    return (
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${t.chip}`}
      >
        {initials || "?"}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      onError={() => setFailed(true)}
      className="h-11 w-11 shrink-0 rounded-full object-cover"
    />
  );
}

// STATUS BADGE
function StatusBadge({ status, t }) {
  const value = status || "Not recorded";

  const badge =
    value === "Present"
      ? t.present
      : value === "Absent"
        ? t.absent
        : t.chip;

  const dot =
    value === "Present"
      ? "bg-emerald-500"
      : value === "Absent"
        ? "bg-rose-500"
        : "bg-slate-400";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold ${badge}`}
    >
      <span
        className={`h-2 w-2 rounded-full ${dot}`}
      />
      {value}
    </span>
  );
}

// WORK TYPE BADGE
function WorkTypeBadge({ type, t }) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
        t.workType[type] || t.chip
      }`}
    >
      {type || "—"}
    </span>
  );
}

// SIDEBAR
function Sidebar({ total, t }) {
  return (
    <aside
      className={`hidden w-72 shrink-0 overflow-y-auto border-r lg:block ${t.bar}`}
    >
      <div
        className={`flex h-20 items-center gap-3 border-b px-5 ${t.line}`}
      >
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl border text-xl ${t.accent}`}
        >
          🐼
        </div>

        <div>
          <p className="font-bold">
            Panda Workspace
          </p>

          <p
            className={`font-mono text-[10px] uppercase tracking-widest ${t.muted}`}
          >
            Infotech Platform
          </p>
        </div>
      </div>

      <div className="space-y-6 p-5">
        {NAV.map((section) => (
          <nav key={section.label}>
            <p
              className={`mb-2 px-3 text-xs font-semibold uppercase tracking-wider ${t.muted}`}
            >
              {section.label}
            </p>

            <ul className="space-y-1">
              {section.items.map(
                ({
                  name,
                  icon: Icon,
                  pill,
                  active,
                }) => (
                  <li key={name}>
                    <div
                      className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium ${
                        active
                          ? t.accent
                          : `border-transparent ${t.muted}`
                      }`}
                    >
                      <Icon size={18} />

                      {name}

                      {active && (
                        <span className="ml-auto text-xs">
                          {total}
                        </span>
                      )}

                      {!active && pill && (
                        <span
                          className={`ml-auto rounded-full border px-2 py-0.5 text-xs ${t.accent}`}
                        >
                          {pill}
                        </span>
                      )}
                    </div>
                  </li>
                )
              )}
            </ul>
          </nav>
        ))}
      </div>
    </aside>
  );
}

// TOPBAR
function Topbar({
  query,
  onQuery,
  dark,
  onToggleTheme,
  t,
}) {
  return (
    <header
      className={`flex h-20 shrink-0 items-center gap-3 border-b px-4 lg:px-8 ${t.bar}`}
    >
      <label className="relative flex-1">
        <Search
          size={18}
          className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 ${t.muted}`}
        />

        <input
          type="search"
          value={query}
          onChange={(event) =>
            onQuery(event.target.value)
          }
          placeholder="Search staff, designation..."
          className={`w-full rounded-xl border py-3 pl-11 pr-4 text-sm outline-none ${t.input}`}
        />
      </label>

      <button
        type="button"
        onClick={onToggleTheme}
        className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${t.control}`}
      >
        {dark ? (
          <Moon size={16} />
        ) : (
          <Sun size={16} />
        )}

        <span className="hidden sm:inline">
          Theme
        </span>
      </button>

      <Bell
        size={19}
        className={t.muted}
      />
    </header>
  );
}

// STAT CARD
function StatCard({
  label,
  value,
  helper,
  t,
}) {
  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm ${t.card}`}
    >
      <p className={`text-sm ${t.muted}`}>
        {label}
      </p>

      <p className="mt-3 font-mono text-3xl font-bold">
        {value}
      </p>

      <p className={`mt-2 text-sm ${t.muted}`}>
        {helper}
      </p>
    </div>
  );
}

// FILTER CARD
function FilterCard({
  options,
  value,
  onChange,
  count,
  helper,
  t,
}) {
  const [open, setOpen] = useState(false);

  const current =
    options.find(
      (option) => option.value === value
    ) || options[0];

  return (
    <div
      className={`relative rounded-2xl border p-5 shadow-sm ${t.card}`}
    >
      <button
        type="button"
        onClick={() =>
          setOpen((previous) => !previous)
        }
        className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-semibold ${t.accent}`}
      >
        {current?.label || "All"}
        <ChevronDown size={14} />
      </button>

      <p className="mt-3 font-mono text-3xl font-bold">
        {count}
      </p>

      <p className={`mt-2 text-sm ${t.muted}`}>
        {helper}
      </p>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close filter"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-10 cursor-default"
          />

          <ul
            className={`absolute left-4 top-14 z-20 max-h-72 w-56 overflow-y-auto rounded-xl border p-1 shadow-lg ${t.card}`}
          >
            {options.map((option) => (
              <li key={option.value}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium ${
                    t.hover
                  } ${
                    option.value === value
                      ? t.accentText
                      : ""
                  }`}
                >
                  {option.label}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

// EMPLOYEE TABLE
function EmployeeTable({
  employees,
  isLoading,
  isError,
  error,
  onView,
  t,
}) {
  const errorMessage =
    error?.status === 401
      ? "Login required. Please sign in again."
      : error?.status === 403
        ? "You do not have permission to view employees."
        : error?.data?.message ||
          "Unable to load employees.";

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1000px] text-left text-sm">
        <thead>
          <tr
            className={`text-xs font-semibold uppercase tracking-wider ${t.head}`}
          >
            <th className="px-6 py-4">
              Employee
            </th>

            <th className="px-4 py-4">
              Designation
            </th>

            <th className="px-4 py-4">
              Work Type
            </th>

            <th className="px-4 py-4">
              Punch In / Out
            </th>

            <th className="px-4 py-4">
              Attendance Status
            </th>

            <th className="px-6 py-4 text-right">
              Profile View
            </th>
          </tr>
        </thead>

        <tbody>
          {!isLoading &&
            !isError &&
            employees.map((employee) => (
              <tr
                key={employee.dbId}
                className={`border-t transition-colors ${t.line} ${t.hover}`}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={employee.name}
                      src={employee.avatar}
                      t={t}
                    />

                    <div>
                      <p className="font-semibold">
                        {employee.name}
                      </p>

                      <div className="mt-1 flex flex-wrap gap-2">
                        <span
                          className={`rounded border px-1.5 py-0.5 font-mono text-[11px] ${t.chip}`}
                        >
                          {employee.employeeId}
                        </span>

                        <span
                          className={`text-xs ${t.muted}`}
                        >
                          {employee.department}
                        </span>
                      </div>
                    </div>
                  </div>
                </td>

                <td className="px-4 py-4">
                  <p className="font-semibold">
                    {employee.designation || "—"}
                  </p>

                  <p
                    className={`mt-1 flex items-center gap-1.5 text-xs ${t.blue}`}
                  >
                    <Briefcase size={12} />
                    Core Designation
                  </p>
                </td>

                <td className="px-4 py-4">
                  <WorkTypeBadge
                    type={employee.workType}
                    t={t}
                  />
                </td>

                <td className="px-4 py-4">
                  {employee.punchIn ? (
                    <div className="space-y-1 text-xs">
                      <p className={t.green}>
                        In: {employee.punchIn}
                      </p>

                      <p className={t.blue}>
                        Out:{" "}
                        {employee.punchOut || "—"}
                      </p>
                    </div>
                  ) : (
                    <span className={t.muted}>
                      —
                    </span>
                  )}
                </td>

                <td className="px-4 py-4">
                  <StatusBadge
                    status={
                      employee.attendanceStatus
                    }
                    t={t}
                  />
                </td>

                <td className="px-6 py-4 text-right">
                  <button
                    type="button"
                    onClick={() =>
                      onView(employee)
                    }
                    className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-semibold ${t.control}`}
                  >
                    <Eye
                      size={15}
                      className={t.blue}
                    />
                    View
                  </button>
                </td>
              </tr>
            ))}

          {(isLoading ||
            isError ||
            employees.length === 0) && (
            <tr>
              <td
                colSpan={6}
                className={`px-6 py-12 text-center ${t.muted}`}
              >
                {isLoading
                  ? "Loading employees..."
                  : isError
                    ? errorMessage
                    : "No employees match your search."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// PAGINATION
function EmployeePagination({
  page,
  totalPages,
  onPageChange,
  isFetching,
  t,
}) {
  const buttonClass = `
    inline-flex
    items-center
    gap-2
    rounded-xl
    border
    px-4
    py-2
    text-sm
    font-semibold
    disabled:pointer-events-none
    disabled:opacity-40
    ${t.control}
  `;

  return (
    <div
      className={`flex items-center justify-end gap-3 border-t px-6 py-4 ${t.line}`}
    >
      <button
        type="button"
        disabled={
          page <= 1 || isFetching
        }
        onClick={() =>
          onPageChange(page - 1)
        }
        className={buttonClass}
      >
        <ChevronLeft size={16} />
        Prev
      </button>

      <span className={`text-sm ${t.muted}`}>
        Page {page} of {totalPages}
      </span>

      <button
        type="button"
        disabled={
          page >= totalPages ||
          isFetching
        }
        onClick={() =>
          onPageChange(page + 1)
        }
        className={buttonClass}
      >
        Next
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

// MAIN EMPLOYEE DIRECTORY
export default function EmployeeDirectory({
  defaultTheme = "dark",
  embedded = false,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const outletContext = useOutletContext() || {};

  // Theme shared with CreateEmployee.
  const [theme, setTheme] = useState(() => {
    const passedTheme =
      location.state?.theme;

    if (validTheme(passedTheme)) {
      return passedTheme;
    }

    return readTheme(defaultTheme);
  });

  const [department, setDepartment] =
    useState("All");

  const [workType, setWorkType] =
    useState("All");

  const [localQuery, setLocalQuery] =
    useState("");
  const query = embedded && typeof outletContext.query === "string"
    ? outletContext.query
    : localQuery;
  const setQuery = embedded && typeof outletContext.setQuery === "function"
    ? outletContext.setQuery
    : setLocalQuery;

  const [page, setPage] =
    useState(1);
  const [todayAttendance, setTodayAttendance] = useState({});
  const [attendanceError, setAttendanceError] = useState("");

  const dark = theme === "dark";

  const t = THEMES[
    dark ? "dark" : "light"
  ];

  // Persist theme when navigating.
  useEffect(() => {
    saveTheme(theme);
  }, [theme]);

  // Restore theme passed from another page.
  useEffect(() => {
    const passedTheme =
      location.state?.theme;

    if (validTheme(passedTheme)) {
      setTheme(passedTheme);
    }
  }, [location.state?.theme]);

  useEffect(() => {
    if (embedded && typeof outletContext.isDarkMode === "boolean") {
      setTheme(outletContext.isDarkMode ? "dark" : "light");
    }
  }, [embedded, outletContext.isDarkMode]);

  const toggleTheme = () => {
    const nextTheme = dark
      ? "light"
      : "dark";

    setTheme(nextTheme);
    saveTheme(nextTheme);
  };

  const openCreateEmployee = () => {
    saveTheme(theme);

    navigate("/employees/create-employee", {
      state: {
        theme,
      },
    });
  };

  const {
    data: response,
    isLoading,
    isFetching,
    isError,
    error,
  } = useGetEmployeesQuery(
    {
      page,
      limit: PAGE_SIZE,
      search: query.trim(),
      department,
      workType,
    },
    {
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
    }
  );

  useEffect(() => {
    let active = true;
    const loadTodayAttendance = async () => {
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      try {
        const result = await apiRequest(`/attendance?from=${today}&to=${today}`);
        if (!Array.isArray(result.attendance)) {
          throw new Error("The attendance API returned invalid data.");
        }
        if (active) {
          const recordsByEmployee = Object.fromEntries(
            result.attendance.map((record) => [Number(record.employeeId), record]),
          );
          setTodayAttendance(recordsByEmployee);
          setAttendanceError("");
        }
      } catch (requestError) {
        if (active) {
          setAttendanceError(requestError.message || "Unable to load today's attendance.");
        }
      }
    };

    loadTodayAttendance();
    const intervalId = window.setInterval(loadTodayAttendance, 30000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const employees = (
    !isError &&
    Array.isArray(response?.data)
      ? response.data
      : []
  ).map((employee) => ({
    ...employee,
    dbId: employee.id,
    avatar: employee.avatar || "",
    punchIn: todayAttendance[Number(employee.id)]?.punchInAt
      ? new Date(todayAttendance[Number(employee.id)].punchInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : null,
    punchOut: todayAttendance[Number(employee.id)]?.punchOutAt
      ? new Date(todayAttendance[Number(employee.id)].punchOutAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : null,
    attendanceStatus: todayAttendance[Number(employee.id)]?.status || "Not recorded",
  }));

  const totalEmployees = isError
    ? 0
    : response?.pagination?.total ?? 0;

  const totalPages = isError
    ? 1
    : Math.max(
        1,
        response?.pagination?.totalPages ?? 1
      );

  const departmentOptions = [
    {
      value: "All",
      label: "All Department",
    },
    ...[
      ...new Set(
        employees
          .map(
            (employee) =>
              employee.department
          )
          .filter(Boolean)
      ),
    ].map((value) => ({
      value,
      label: value,
    })),
  ];

  if (
    department !== "All" &&
    !departmentOptions.some(
      (option) =>
        option.value === department
    )
  ) {
    departmentOptions.push({
      value: department,
      label: department,
    });
  }

  const typeOptions = [
    {
      value: "All",
      label: "All Work Types",
    },
    ...WORK_TYPES.map((value) => ({
      value,
      label: value,
    })),
  ];

  useEffect(() => {
    setPage(1);
  }, [department, workType, query]);

  const viewProfile = (employee) => {
    saveTheme(theme);

    navigate("/employees/employee-profile", {
      state: {
        theme,
        employeeDbId:
          employee.dbId,
        employee,
      },
    });
  };

  return (
    <div
      className={`${embedded ? "min-h-full" : "flex h-screen overflow-hidden"} ${t.page}`}
    >
      {/* SIDEBAR */}
      {!embedded && <Sidebar total={totalEmployees} t={t} />}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* TOPBAR */}
        {!embedded && (
          <Topbar
            query={query}
            onQuery={setQuery}
            dark={dark}
            onToggleTheme={toggleTheme}
            t={t}
          />
        )}

        {/* MAIN CONTENT */}
        <main className={`${embedded ? "min-w-0 space-y-6" : "flex-1 space-y-6 overflow-y-auto p-4 lg:p-8"}`}>
          {attendanceError && (
            <p role="alert" className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700">
              Unable to load today&apos;s attendance: {attendanceError}
            </p>
          )}
          {/* STATS & FILTERS */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={openCreateEmployee}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-xs font-semibold text-white hover:bg-blue-700"
            >
              <Plus size={16} />
              Create Employee
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard
              label="Matching Employees"
              value={totalEmployees}
              helper="Matches current filters"
              t={t}
            />

            <FilterCard
              options={departmentOptions}
              value={department}
              onChange={setDepartment}
              count={totalEmployees}
              helper={
                department === "All"
                  ? "Select a department"
                  : "Employees in this department"
              }
              t={t}
            />

            <FilterCard
              options={typeOptions}
              value={workType}
              onChange={setWorkType}
              count={totalEmployees}
              helper={
                workType === "All"
                  ? "All working types"
                  : `${workType} employees`
              }
              t={t}
            />
          </div>

          {/* SOLID EMPLOYEE TABLE */}
          <div
            className={`overflow-hidden rounded-2xl border shadow-sm ${t.card}`}
          >
            <EmployeeTable
              employees={employees}
              isLoading={isLoading}
              isError={isError}
              error={error}
              onView={viewProfile}
              t={t}
            />

            <EmployeePagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              isFetching={isFetching}
              t={t}
            />
          </div>
        </main>
      </div>
    </div>
  );
}