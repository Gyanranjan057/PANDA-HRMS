
import { useState } from "react";
import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  Briefcase,
  CalendarDays,
  Moon,
  Sun,
  UserRound,
} from "lucide-react";

import { useGetEmployeeByIdQuery } from "../../slice/employeeService/employeeApi";

const LEAVE_QUOTA = 24;

export default function EmployeeProfile({
  employee: employeeProp,
  defaultTheme = "dark",
  onBack,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();

  const [theme, setTheme] = useState(defaultTheme);

  const dark = theme === "dark";

  const supplied =
    employeeProp || location.state?.employee;

  // Numeric Prisma database ID, not EMP001.
  const rawId =
    supplied?.dbId ??
    location.state?.employeeDbId ??
    params.id ??
    (typeof supplied?.id === "number"
      ? supplied.id
      : null);

  const dbId =
    rawId == null ? NaN : Number(rawId);

  const validId =
    Number.isSafeInteger(dbId) && dbId > 0;

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
  } = useGetEmployeeByIdQuery(dbId, {
    skip: !validId,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  });

  // Only use employee data returned by the backend.
  const employee =
    validId && !isError
      ? data?.data ?? null
      : null;

  const back =
    onBack || (() => navigate("/"));

  const t = dark
    ? {
        page:
          "bg-[#0a1519] text-slate-100",
        bar:
          "bg-[#0d1a21] border-[#1f3541]",
        card:
          "bg-[#12222b] border-[#1f3541]",
        inset:
          "bg-[#0a1419] border-[#1f3541]",
        muted: "text-slate-400",
        accent: "text-emerald-400",
        chip:
          "bg-emerald-500/10 border-emerald-500/40 text-emerald-400",
      }
    : {
        page:
          "bg-slate-50 text-slate-900",
        bar:
          "bg-white border-slate-200",
        card:
          "bg-white border-slate-200",
        inset:
          "bg-slate-50 border-slate-200",
        muted: "text-slate-500",
        accent: "text-orange-600",
        chip:
          "bg-orange-50 border-orange-200 text-orange-600",
      };

  const name =
    employee?.name || "Employee";

  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const info = [
    [
      "Employee ID",
      employee?.employeeId ?? "—",
    ],
    [
      "Department",
      employee?.department,
    ],
    [
      "Designation",
      employee?.designation,
    ],
    [
      "Work Type",
      employee?.workType,
    ],
    [
      "Employment Status",
      employee?.status,
    ],
    [
      "Email",
      employee?.email,
    ],
    [
      "Phone",
      employee?.phone,
    ],
    [
      "Leave Balance",
      employee?.leaveBalance != null
        ? `${employee.leaveBalance} / ${LEAVE_QUOTA} days`
        : "—",
    ],
    [
      "Created",
      employee?.createdAt
        ? new Date(
            employee.createdAt
          ).toLocaleDateString("en-IN")
        : "—",
    ],
  ];

  const errorMessage =
    error?.status === 401
      ? "Your session has expired. Please log in again."
      : error?.status === 403
        ? "You do not have permission to view this employee."
        : error?.status === 404
          ? "Employee not found."
          : error?.data?.message ||
            "Unable to load employee details.";

  return (
    <div className={`min-h-screen ${t.page}`}>
      <header
        className={`flex h-20 items-center justify-between border-b px-4 sm:px-8 ${t.bar}`}
      >
        <button
          type="button"
          onClick={back}
          className="flex items-center gap-2 text-sm font-semibold"
        >
          <ArrowLeft size={18} />
          Employee Directory
        </button>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() =>
              setTheme(
                dark ? "light" : "dark"
              )
            }
            aria-label="Toggle theme"
            className={`rounded-xl border p-3 ${t.card}`}
          >
            {dark ? (
              <Moon size={18} />
            ) : (
              <Sun size={18} />
            )}
          </button>

          <Bell
            size={19}
            className={t.muted}
          />
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 p-4 sm:p-8">
        {(isLoading ||
          (isFetching && !employee)) &&
          !isError && (
            <p className={t.muted}>
              Loading employee...
            </p>
          )}

        {isError && (
          <div
            role="alert"
            className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-rose-400"
          >
            {errorMessage}
          </div>
        )}

        {!validId && (
          <div
            className={`rounded-2xl border p-8 ${t.card}`}
          >
            No employee selected. Open a
            profile from the Employee Directory.
          </div>
        )}

        {validId &&
          !employee &&
          !isLoading &&
          !isFetching &&
          !isError && (
            <div
              className={`rounded-2xl border p-8 ${t.card}`}
            >
              Employee details are unavailable.
            </div>
          )}

        {employee && (
          <>
            <section
              className={`flex flex-wrap items-center gap-5 rounded-2xl border p-6 ${t.card}`}
            >
              <div
                className={`flex h-20 w-20 items-center justify-center rounded-full border text-2xl font-bold ${t.chip}`}
              >
                {initials || (
                  <UserRound size={30} />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-bold">
                  {name}
                </h1>

                <p
                  className={`mt-1 ${t.muted}`}
                >
                  {employee.designation ||
                    "—"}{" "}
                  ·{" "}
                  {employee.department ||
                    "—"}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${t.chip}`}
                  >
                    {employee.workType ||
                      "—"}
                  </span>

                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${t.chip}`}
                  >
                    {employee.status ||
                      "—"}
                  </span>
                </div>
              </div>
            </section>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {info.map(
                ([label, value]) => (
                  <div
                    key={label}
                    className={`rounded-2xl border p-5 ${t.card}`}
                  >
                    <p
                      className={`text-xs font-semibold uppercase tracking-wider ${t.muted}`}
                    >
                      {label}
                    </p>

                    <p className="mt-3 break-words text-base font-semibold">
                      {value ?? "—"}
                    </p>
                  </div>
                )
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <section
                className={`rounded-2xl border p-6 ${t.card}`}
              >
                <h2 className="flex items-center gap-2 font-bold">
                  <Briefcase
                    size={18}
                    className={t.accent}
                  />
                  Attendance
                </h2>

                <p
                  className={`mt-3 text-sm ${t.muted}`}
                >
                  Attendance and punch-in/out
                  data are not connected to
                  this profile yet.
                </p>
              </section>

              <section
                className={`rounded-2xl border p-6 ${t.card}`}
              >
                <h2 className="flex items-center gap-2 font-bold">
                  <CalendarDays
                    size={18}
                    className={t.accent}
                  />
                  Leave & Performance
                </h2>

                <p
                  className={`mt-3 text-sm ${t.muted}`}
                >
                  Leave history and performance
                  charts will appear when
                  their APIs are connected.
                  The leave balance above
                  comes from the Employee record.
                </p>
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
