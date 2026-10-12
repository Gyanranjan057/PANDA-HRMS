import React, { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";

function Icon({ name, className = "h-5 w-5" }) {
  const icons = {
    clock: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </>
    ),
    download: (
      <>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <path d="m7 10 5 5 5-5M12 15V3" />
      </>
    ),
    arrow: <path d="M5 12h14m-7-7 7 7-7 7" />,
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
      {icons[name] || icons.clock}
    </svg>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const outletContext = useOutletContext() || {};
  const isDarkMode =
    typeof outletContext.isDarkMode === "boolean"
      ? outletContext.isDarkMode
      : (localStorage.getItem("panda-theme") || "dark") !== "light";

  const [currentTime, setCurrentTime] = useState("");
  const [activeDepartment, setActiveDepartment] = useState("All");

  useEffect(() => {
    const updateClock = () => {
      setCurrentTime(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
    };

    updateClock();
    const timer = window.setInterval(updateClock, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const theme = isDarkMode
    ? {
        card: "border-[#123832] bg-[#081a18]",
        panel: "border-[#0e2b26] bg-[#071615]",
        muted: "text-[#8aa39e]",
        subdued: "text-[#718885]",
        badge: "border-emerald-900 bg-[#0a2622] text-emerald-300",
        department: "border-[#24433d] text-[#9bb3ad] hover:border-emerald-500 hover:text-emerald-300",
        selected: "border-emerald-500 bg-[#0a2622] text-emerald-300",
        progressTrack: "bg-emerald-950",
      }
    : {
        card: "border-slate-200 bg-white",
        panel: "border-slate-200 bg-slate-50",
        muted: "text-slate-600",
        subdued: "text-slate-500",
        badge: "border-emerald-200 bg-emerald-50 text-emerald-800",
        department: "border-slate-300 text-slate-600 hover:border-emerald-500 hover:text-emerald-700",
        selected: "border-emerald-500 bg-emerald-50 text-emerald-800",
        progressTrack: "bg-slate-200",
      };

  const departments = [
    ["All", 156],
    ["Engineering", 52],
    ["UI / UX Design", 24],
    ["DevOps", 18],
    ["QA", 22],
    ["Administration", 16],
    ["Product", 24],
  ];

  const exportDailyLog = () => {
    const rows = [
      ["Metric", "Value"],
      ["Date", new Date().toLocaleDateString("en-IN")],
      ["Punched In", 142],
      ["Late Arrivals", 5],
      ["Approved Leaves", 9],
      ["Total Employees", 156],
    ];

    const csv = rows
      .map((row) =>
        row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")
      )
      .join("\r\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "daily-attendance-log.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full min-w-0 space-y-5">
      <header>
        <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-emerald-500">
          Panda Workspace · Overview
        </p>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          Dashboard
        </h1>
        <p className={`mt-1 text-sm leading-6 ${theme.muted}`}>
          Here's what's happening across your workspace today.
        </p>
      </header>

      <section
        className={`flex min-w-0 flex-col gap-5 rounded-2xl border p-4 sm:p-5 xl:flex-row xl:items-center xl:justify-between xl:p-6 ${theme.card}`}
      >
        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-800 bg-emerald-500/10 text-emerald-500 sm:h-12 sm:w-12">
            <Icon name="clock" className="h-6 w-6" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-extrabold tracking-wide text-emerald-500">
                REAL-TIME SHIFT &amp; ATTENDANCE RADAR
              </span>
              <span className={`rounded border px-2 py-1 text-[9px] font-bold ${theme.badge}`}>
                SHIFT 1 · 09:00–18:00
              </span>
            </div>
            <p className="mt-2 break-words font-mono text-xl font-extrabold sm:text-2xl lg:text-3xl">
              {currentTime}
            </p>
            <p className={`mt-1 text-xs leading-5 ${theme.muted}`}>
              Attendance overview · <strong className="text-emerald-500">142 of 156</strong> employees checked in
            </p>
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-3 gap-2 xl:flex xl:items-center">
          <div className={`rounded-xl border px-2 py-3 text-center sm:px-4 ${theme.panel}`}>
            <p className={`text-[9px] font-extrabold ${theme.subdued}`}>PUNCHED IN</p>
            <p className="mt-1 text-lg font-extrabold text-emerald-500">142</p>
          </div>
          <div className={`rounded-xl border px-2 py-3 text-center sm:px-4 ${theme.panel}`}>
            <p className={`text-[9px] font-extrabold ${theme.subdued}`}>LATE ARRIVALS</p>
            <p className="mt-1 text-lg font-extrabold text-amber-500">5</p>
          </div>
          <div className={`rounded-xl border px-2 py-3 text-center sm:px-4 ${theme.panel}`}>
            <p className={`text-[9px] font-extrabold ${theme.subdued}`}>APPROVED LEAVES</p>
            <p className="mt-1 text-lg font-extrabold text-cyan-500">9</p>
          </div>
          <button
            type="button"
            onClick={exportDailyLog}
            className="col-span-3 flex min-h-10 items-center justify-center gap-2 rounded-xl border border-emerald-700 px-3 py-2 text-xs font-bold text-emerald-500 transition hover:bg-emerald-500/10 sm:text-sm xl:col-span-1"
          >
            <Icon name="download" className="h-4 w-4" />
            Export Daily Log
          </button>
        </div>
      </section>

      <section className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:gap-4">
        <article className={`flex min-w-0 flex-col gap-4 rounded-2xl border p-4 sm:p-5 ${theme.card}`}>
          <div className="flex items-start justify-between gap-2">
            <p className={`text-xs font-bold leading-5 ${theme.muted}`}>Today's Attendance Rate</p>
            <button
              type="button"
              onClick={() => navigate("/attendance")}
              className="shrink-0 text-[11px] font-bold text-emerald-500 hover:underline"
            >
              View All
            </button>
          </div>
          <p className="break-words text-2xl font-extrabold">
            91.0% <span className={`ml-2 text-xs font-medium ${theme.muted}`}>142 Present</span>
          </p>
          <div className={`h-1.5 overflow-hidden rounded-full ${theme.progressTrack}`}>
            <div className="h-full w-[91%] rounded-full bg-emerald-500" />
          </div>
        </article>

        <article className={`flex min-w-0 flex-col gap-4 rounded-2xl border p-4 sm:p-5 ${theme.card}`}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className={`text-xs font-bold leading-5 ${theme.muted}`}>Pending Leave Requests</p>
            <span className="rounded bg-amber-500/10 px-2 py-1 text-[9px] font-bold text-amber-500">
              Action Required
            </span>
          </div>
          <p className="text-2xl font-extrabold">
            4 <span className={`ml-2 text-xs font-medium ${theme.muted}`}>Awaiting Decision</span>
          </p>
          <button
            type="button"
            onClick={() => navigate("/leave")}
            className="self-start text-[11px] font-bold text-emerald-500 hover:underline"
          >
            Review requests <span aria-hidden="true">→</span>
          </button>
        </article>

        <article className={`flex min-w-0 flex-col gap-4 rounded-2xl border p-4 sm:p-5 ${theme.card}`}>
          <p className={`text-xs font-bold leading-5 ${theme.muted}`}>Monthly Payroll Budget</p>
          <p className="break-words text-2xl font-extrabold">$184,500</p>
          <p className={`text-xs ${theme.muted}`}>October 2026</p>
        </article>

        <article className={`flex min-w-0 flex-col gap-4 rounded-2xl border p-4 sm:p-5 ${theme.card}`}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className={`text-xs font-bold leading-5 ${theme.muted}`}>Active Projects</p>
            <span className="text-[10px] font-bold text-emerald-500">12 Ongoing</span>
          </div>
          <p className="text-2xl font-extrabold">8 Teams</p>
          <p className={`text-xs ${theme.muted}`}>4 live standups</p>
        </article>
      </section>

      <section className={`flex min-w-0 flex-col gap-4 rounded-2xl border p-4 sm:p-5 xl:flex-row xl:items-center xl:justify-between ${theme.card}`}>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-bold">Department Headcount</h2>
          <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-500">
            156 Total
          </span>
        </div>

        <div className="flex min-w-0 flex-wrap gap-2">
          {departments.map(([name, count]) => (
            <button
              key={name}
              type="button"
              onClick={() => setActiveDepartment(name)}
              aria-pressed={activeDepartment === name}
              className={`rounded-full border px-3 py-2 text-[10px] font-bold transition sm:text-[11px] ${
                activeDepartment === name
                  ? theme.selected
                  : theme.department
              }`}
            >
              {name} <span className="ml-1 opacity-80">{count}</span>
            </button>
          ))}
        </div>
      </section>

      <p className={`text-xs ${theme.muted}`}>
        Selected department: <strong>{activeDepartment}</strong>
      </p>
    </div>
  );
}
