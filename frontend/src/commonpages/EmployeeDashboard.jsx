import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../utils/api";
import {
  getCurrentSession,
  logoutFromLocalStorage,
} from "../utils/authStorage";

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatPunchTime(value) {
  if (!value) return "--:--";
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const session = getCurrentSession();
  const user = session?.user;

  const handleLogout = () => {
    logoutFromLocalStorage();
    navigate("/login", { replace: true });
  };
  const [now, setNow] = useState(() => new Date());
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [isAttendanceLoading, setIsAttendanceLoading] = useState(true);
  const [attendanceLoaded, setAttendanceLoaded] = useState(false);
  const [isPunching, setIsPunching] = useState(false);
  const [attendanceError, setAttendanceError] = useState("");
  const [reloadAttendance, setReloadAttendance] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;

    apiRequest("/attendance/me")
      .then(({ attendance = [] }) => {
        if (active) {
          setAttendanceRecords(attendance);
          setAttendanceLoaded(true);
        }
      })
      .catch((error) => {
        if (active) setAttendanceError(error.message);
      })
      .finally(() => {
        if (active) setIsAttendanceLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reloadAttendance]);

  const today = formatLocalDate(now);
  const todayRecord = attendanceRecords.find((record) => record.date === today);
  const activeShift = attendanceRecords.find(
    (record) => record.punchInAt && !record.punchOutAt
  );
  const completedToday = Boolean(todayRecord?.punchOutAt);
  const shiftStatus = activeShift
    ? "On shift"
    : completedToday
      ? "Shift complete"
      : "Not punched in";

  const handlePunch = async (action) => {
    setIsPunching(true);
    setAttendanceError("");
    try {
      const { attendance } = await apiRequest(`/attendance/${action}`, {
        method: "POST",
        body: JSON.stringify({ date: formatLocalDate(new Date()) }),
      });
      setAttendanceRecords((previous) => [
        attendance,
        ...previous.filter((record) => record.id !== attendance.id),
      ]);
    } catch (error) {
      setAttendanceError(error.message);
    } finally {
      setIsPunching(false);
    }
  };

  const handleAttendanceRetry = () => {
    setAttendanceError("");
    setIsAttendanceLoading(true);
    setAttendanceLoaded(false);
    setReloadAttendance((count) => count + 1);
  };

  const modules = [
    {
      icon: "📅",
      title: "My Attendance",
      description: "Check your attendance and working hours.",
      path: "/attendance",
    },
    {
      icon: "📝",
      title: "My Leaves",
      description: "Apply for leave and track your requests.",
      path: "/leave",
    },
    {
      icon: "✅",
      title: "My Tasks",
      description: "View your assigned work and progress.",
      path: "/tasks",
    },
    {
      icon: "⚙️",
      title: "My Settings",
      description: "View your personal workspace settings.",
      path: "/settings",
    },
  ];

  return (
    <div className="min-h-screen bg-[#050c0c] p-5 text-white sm:p-8 lg:p-10">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-emerald-900/60 pb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-400">
            Panda Workspace
          </p>

          <h1 className="mt-3 text-2xl font-extrabold sm:text-3xl">
            Employee Dashboard
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Your personal workspace.
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="rounded-xl border border-red-500/40 px-5 py-3 text-sm font-bold text-red-300 hover:bg-red-500/10"
        >
          Logout
        </button>
      </header>

      <section className="mt-8 rounded-2xl border border-emerald-900 bg-[#081a18] p-6 sm:p-8">
        <p className="text-sm font-semibold text-emerald-400">
          EMPLOYEE WORKSPACE
        </p>

        <h2 className="mt-3 text-2xl font-bold">
          Welcome, {user?.name || "Employee"}!
        </h2>

        <p className="mt-2 text-sm text-slate-400">
          Manage your attendance, leave requests, and assigned tasks.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-emerald-900/70 bg-[#06110f] p-4">
            <p className="text-xs text-slate-400">EMPLOYEE ID</p>
            <p className="mt-2 font-bold text-emerald-300">
              {user?.employeeId || "Not available"}
            </p>
          </div>

          <div className="rounded-xl border border-emerald-900/70 bg-[#06110f] p-4">
            <p className="text-xs text-slate-400">DEPARTMENT</p>
            <p className="mt-2 font-bold text-emerald-300">
              {user?.department || "Not assigned"}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-emerald-900 bg-[#081a18] p-5 sm:p-7" aria-labelledby="attendance-clock-title">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-400">
              Today&apos;s attendance
            </p>
            <h2 id="attendance-clock-title" className="mt-2 text-xl font-extrabold">
              Time clock
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Record your shift start and finish.
            </p>
          </div>
          <span className={`rounded-full border px-3 py-1.5 text-xs font-bold ${activeShift ? "border-emerald-700 bg-emerald-500/10 text-emerald-300" : completedToday ? "border-slate-700 bg-slate-800 text-slate-300" : "border-amber-700/70 bg-amber-500/10 text-amber-300"}`} aria-live="polite">
            {isAttendanceLoading ? "Loading status" : shiftStatus}
          </span>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-emerald-900/70 bg-[#06110f] p-4">
            <p className="text-xs font-semibold text-slate-400">CURRENT TIME</p>
            <p className="mt-2 font-mono text-2xl font-bold text-white">
              {formatPunchTime(now)}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-900/70 bg-[#06110f] p-4">
            <p className="text-xs font-semibold text-slate-400">PUNCH IN</p>
            <p className="mt-2 font-mono text-2xl font-bold text-emerald-300">
              {formatPunchTime(activeShift?.punchInAt || todayRecord?.punchInAt)}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-900/70 bg-[#06110f] p-4">
            <p className="text-xs font-semibold text-slate-400">PUNCH OUT</p>
            <p className="mt-2 font-mono text-2xl font-bold text-emerald-300">
              {formatPunchTime(todayRecord?.punchOutAt)}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          {activeShift ? (
            <button
              type="button"
              onClick={() => handlePunch("punch-out")}
              disabled={isAttendanceLoading || isPunching || !attendanceLoaded}
              className="min-h-11 rounded-lg border border-amber-600 bg-amber-500 px-5 py-2.5 text-sm font-bold text-[#171006] transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPunching ? "Recording..." : "Punch out"}
            </button>
          ) : completedToday ? (
            <p className="text-sm font-semibold text-emerald-300">
              Your attendance for today is complete.
            </p>
          ) : (
            <button
              type="button"
              onClick={() => handlePunch("punch-in")}
              disabled={isAttendanceLoading || isPunching || !attendanceLoaded}
              className="min-h-11 rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-bold text-[#04110d] transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPunching ? "Recording..." : "Punch in"}
            </button>
          )}
          {attendanceError && (
            <p className="text-sm text-rose-300" role="alert">
              {attendanceError}
            </p>
          )}
          {!attendanceLoaded && !isAttendanceLoading && (
            <button
              type="button"
              onClick={handleAttendanceRetry}
              className="text-sm font-semibold text-emerald-300 underline underline-offset-4"
            >
              Retry
            </button>
          )}
        </div>
      </section>

      <h2 className="mb-4 mt-9 text-xl font-bold">
        My Workspace
      </h2>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {modules.map((module) => (
          <button
            key={module.title}
            type="button"
            onClick={() => navigate(module.path)}
            className="rounded-2xl border border-emerald-900 bg-[#081a18] p-6 text-left transition hover:-translate-y-1 hover:border-emerald-500"
          >
            <span className="text-3xl">{module.icon}</span>

            <h3 className="mt-4 font-bold">
              {module.title}
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              {module.description}
            </p>

            <span className="mt-5 inline-block text-sm font-bold text-emerald-400">
              Open module →
            </span>
          </button>
        ))}
      </section>
    </div>
  );
}
