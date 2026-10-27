import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useLocation,
  useNavigate,
  useParams,
  useOutletContext,
} from "react-router-dom";
import {
  ArrowLeft,
  Briefcase,
  CalendarDays,
  UserRound,
} from "lucide-react";

import { useGetEmployeeByIdQuery } from "../../slice/employeesService/employeeApi";
import { apiRequest } from "../../utils/api";

const LEAVE_QUOTA = 24;
const dateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const dateLabel = (value) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};
const timeLabel = (value) => value
  ? new Date(value).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
  : "—";
const hoursWorked = (punchInAt, punchOutAt) => {
  if (!punchInAt || !punchOutAt) return null;
  return Math.max(0, (new Date(punchOutAt) - new Date(punchInAt)) / 3600000);
};

export default function EmployeeProfile({
  employee: employeeProp,
  defaultTheme = "dark",
  onBack,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const { admin } = useOutletContext() || {};
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [performanceError, setPerformanceError] = useState("");
  const [isPerformanceLoading, setIsPerformanceLoading] = useState(false);

  const dark = defaultTheme === "dark";

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

  useEffect(() => {
    if (!admin || !employee || !validId) {
      setAttendanceRecords([]);
      setLeaveRequests([]);
      setPerformanceError("");
      setIsPerformanceLoading(false);
      return undefined;
    }

    let active = true;
    const today = new Date();
    const fromDate = new Date(today);
    fromDate.setDate(fromDate.getDate() - 179);
    setIsPerformanceLoading(true);
    setPerformanceError("");

    Promise.all([
      apiRequest(`/attendance?from=${dateString(fromDate)}&to=${dateString(today)}`),
      apiRequest("/leave"),
    ])
      .then(([attendanceResult, leaveResult]) => {
        if (!Array.isArray(attendanceResult.attendance) || !Array.isArray(leaveResult.requests)) {
          throw new Error("The HRMS API returned invalid attendance or leave data.");
        }
        if (!active) return;
        setAttendanceRecords(
          attendanceResult.attendance
            .filter((record) => Number(record.employeeId) === dbId)
            .sort((a, b) => b.date.localeCompare(a.date)),
        );
        setLeaveRequests(
          leaveResult.requests
            .filter((request) => Number(request.employeeId) === dbId)
            .sort((a, b) => b.fromDate.localeCompare(a.fromDate)),
        );
      })
      .catch((loadError) => {
        if (active) {
          setPerformanceError(loadError.message || "Unable to load attendance and leave performance.");
        }
      })
      .finally(() => {
        if (active) setIsPerformanceLoading(false);
      });

    return () => {
      active = false;
    };
  }, [admin, dbId, employee, validId]);

  const attendanceSummary = useMemo(() => {
    const present = attendanceRecords.filter((record) => record.status === "Present").length;
    const late = attendanceRecords.filter((record) => record.status === "Late").length;
    const durations = attendanceRecords
      .map((record) => hoursWorked(record.punchInAt, record.punchOutAt))
      .filter((hours) => hours !== null);
    const monthly = Array.from({ length: 6 }, (_, index) => {
      const monthDate = new Date();
      monthDate.setDate(1);
      monthDate.setMonth(monthDate.getMonth() - (5 - index));
      const key = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`;
      return {
        key,
        label: monthDate.toLocaleDateString("en-IN", { month: "short" }),
        count: attendanceRecords.filter((record) => record.date.startsWith(key)).length,
      };
    });
    const peak = Math.max(1, ...monthly.map((month) => month.count));

    return {
      present,
      late,
      completedShifts: durations.length,
      averageHours: durations.length
        ? (durations.reduce((total, hours) => total + hours, 0) / durations.length).toFixed(1)
        : "—",
      monthly: monthly.map((month) => ({
        ...month,
        height: Math.max(4, Math.round((month.count / peak) * 100)),
      })),
    };
  }, [attendanceRecords]);

  const leaveSummary = useMemo(() => ({
    pending: leaveRequests.filter((request) => request.status === "Pending").length,
    approved: leaveRequests.filter((request) => request.status === "Approved").length,
    rejected: leaveRequests.filter((request) => request.status === "Rejected").length,
  }), [leaveRequests]);

  const back =
    onBack || (() => navigate("/employees"));

  const t = dark
    ? {
        page:
          "text-slate-100",
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
          "text-slate-900",
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
    <div className={`min-h-screen bg-transparent ${t.page}`}>
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

                {!admin ? (
                  <p className={`mt-3 text-sm ${t.muted}`}>
                    Attendance performance is available to administrators only.
                  </p>
                ) : performanceError ? (
                  <p className="mt-3 text-sm text-rose-400" role="alert">{performanceError}</p>
                ) : isPerformanceLoading ? (
                  <p className={`mt-3 text-sm ${t.muted}`}>Loading attendance performance…</p>
                ) : (
                  <>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {[
                        ["Present", attendanceSummary.present],
                        ["Late", attendanceSummary.late],
                        ["Completed shifts", attendanceSummary.completedShifts],
                        ["Average hours", attendanceSummary.averageHours],
                      ].map(([label, value]) => (
                        <div key={label} className={`rounded-xl border p-3 ${t.inset}`}>
                          <p className={`text-xs ${t.muted}`}>{label}</p>
                          <p className="mt-1 text-lg font-bold">{value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-5">
                      <p className={`mb-3 text-xs font-semibold ${t.muted}`}>Attendance by month · last 6 months</p>
                      <div className="flex h-24 items-end justify-between gap-2" aria-label="Attendance records by month">
                        {attendanceSummary.monthly.map((month) => (
                          <div key={month.key} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                            <span className={`text-[10px] ${t.muted}`}>{month.count}</span>
                            <div className="w-full rounded-t bg-emerald-500/80" style={{ height: `${month.height}%` }} />
                            <span className={`text-[10px] ${t.muted}`}>{month.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {attendanceRecords.length > 0 && (
                      <div className="mt-5 space-y-2">
                        <p className={`text-xs font-semibold ${t.muted}`}>Recent attendance</p>
                        {attendanceRecords.slice(0, 5).map((record) => (
                          <div key={record.id} className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs ${t.inset}`}>
                            <span>{dateLabel(record.date)}</span>
                            <span className={t.accent}>{record.status}</span>
                            <span className={t.muted}>{timeLabel(record.punchInAt)} – {timeLabel(record.punchOutAt)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {attendanceRecords.length === 0 && (
                      <p className={`mt-4 text-sm ${t.muted}`}>No attendance records are available for the last six months.</p>
                    )}
                  </>
                )}
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

                {!admin ? (
                  <p className={`mt-3 text-sm ${t.muted}`}>
                    Leave performance is available to administrators only.
                  </p>
                ) : performanceError ? (
                  <p className="mt-3 text-sm text-rose-400" role="alert">{performanceError}</p>
                ) : isPerformanceLoading ? (
                  <p className={`mt-3 text-sm ${t.muted}`}>Loading leave performance…</p>
                ) : (
                  <>
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {[
                        ["Pending", leaveSummary.pending],
                        ["Approved", leaveSummary.approved],
                        ["Rejected", leaveSummary.rejected],
                      ].map(([label, value]) => (
                        <div key={label} className={`rounded-xl border p-3 ${t.inset}`}>
                          <p className={`text-xs ${t.muted}`}>{label}</p>
                          <p className="mt-1 text-lg font-bold">{value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-5">
                      <p className={`mb-3 text-xs font-semibold ${t.muted}`}>Recent leave requests</p>
                      {leaveRequests.length > 0 ? (
                        <div className="space-y-2">
                          {leaveRequests.slice(0, 5).map((request) => (
                            <div key={request.id} className={`rounded-lg border px-3 py-2 ${t.inset}`}>
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="text-sm font-semibold">{request.leaveType}</span>
                                <span className={`text-xs font-semibold ${request.status === "Approved" ? "text-emerald-400" : request.status === "Rejected" ? "text-rose-400" : t.accent}`}>
                                  {request.status}
                                </span>
                              </div>
                              <p className={`mt-1 text-xs ${t.muted}`}>
                                {dateLabel(request.fromDate)} – {dateLabel(request.toDate)} · {request.days} {request.days === 1 ? "day" : "days"}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className={`text-sm ${t.muted}`}>No leave requests are available.</p>
                      )}
                    </div>
                  </>
                )}
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  );
}