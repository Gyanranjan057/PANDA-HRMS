import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";

const EMPLOYEES = [
  {
    id: "EMP-1001",
    name: "Ananya Das",
    role: "Frontend Developer",
    department: "Engineering",
  },

  {
    id: "EMP-1002",
    name: "Rahul Pradhan",
    role: "Backend Developer",
    department: "Engineering",
  },

  {
    id: "EMP-1003",
    name: "Priya Mohanty",
    role: "HR Executive",
    department: "Human Resources",
  },

  {
    id: "EMP-1004",
    name: "Sourav Sahu",
    role: "UI/UX Designer",
    department: "Design",
  },

  {
    id: "EMP-1005",
    name: "Sneha Nayak",
    role: "QA Engineer",
    department: "Quality Assurance",
  },

  {
    id: "EMP-1006",
    name: "Amit Behera",
    role: "Accounts Executive",
    department: "Finance",
  },

  {
    id: "EMP-1007",
    name: "Pooja Rout",
    role: "Marketing Executive",
    department: "Marketing",
  },

  {
    id: "EMP-1008",
    name: "Karan Patnaik",
    role: "IT Support",
    department: "IT Support",
  },
];

const VIEW_OPTIONS = [
  { value: "weekly", label: "Weekly" },

  { value: "monthly", label: "Monthly" },

  { value: "yearly", label: "Yearly" },
];

const toDateInput = (date) => {
  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const parseLocalDate = (value) => {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day);
};

const startOfWeek = (date) => {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const day = result.getDay();

  result.setDate(result.getDate() - (day === 0 ? 6 : day - 1));

  return result;
};

const addDays = (date, days) => {
  const result = new Date(date);

  result.setDate(result.getDate() + days);

  return result;
};

const formatDate = (date, options = { day: "2-digit", month: "short" }) =>
  new Intl.DateTimeFormat("en-IN", options).format(date);

const initials = (name) =>
  name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

// DEMO ONLY: deterministic sample attendance. Replace this with API data in production.

const getDemoStatus = (employeeIndex, date) => {
  const day = date.getDay();

  if (day === 0 || day === 6) return "WO";

  const seed =
    (date.getDate() * 7 + (date.getMonth() + 1) * 11 + employeeIndex * 13) % 23;

  if (seed === 0 || seed === 9) return "Absent";

  if (seed === 4 || seed === 15 || seed === 21) return "Late";

  if (seed === 6) return "Leave";

  return "Present";
};

const emptyCounts = () => ({ Present: 0, Absent: 0, Late: 0, Leave: 0, WO: 0 });

const getCounts = (statuses) => {
  const counts = emptyCounts();

  statuses.forEach((status) => {
    counts[status] = (counts[status] || 0) + 1;
  });

  return counts;
};

const attendanceRate = (counts) => {
  const workingDays =
    counts.Present + counts.Absent + counts.Late + counts.Leave;

  if (!workingDays) return 0;

  return Math.round(((counts.Present + counts.Late) / workingDays) * 100);
};

const statusClass = (status) => {
  const styles = {
    Present: "bg-emerald-50 text-emerald-700 ring-emerald-200",

    Absent: "bg-rose-50 text-rose-700 ring-rose-200",

    Late: "bg-amber-50 text-amber-700 ring-amber-200",

    Leave: "bg-sky-50 text-sky-700 ring-sky-200",

    WO: "bg-slate-100 text-slate-500 ring-slate-200",
  };

  return styles[status] || "bg-slate-100 text-slate-500 ring-slate-200";
};

function StatusPill({ status }) {
  return (
    <span
      className={`inline-flex min-w-[66px] justify-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusClass(status)}`}
    >
      {status === "WO" ? "Off day" : status}
    </span>
  );
}

function MetricCard({ title, value, detail, icon, accent }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-500">{detail}</p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl ${accent}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function AllAttendance() {
  const outletContext = useOutletContext() || {};
  const isDarkMode = typeof outletContext.isDarkMode === "boolean"
    ? outletContext.isDarkMode
    : localStorage.getItem("panda-theme") !== "light";
  const theme = isDarkMode ? "dark" : "light";

  const [view, setView] = useState("weekly");

  const [selectedDate, setSelectedDate] = useState(() =>
    toDateInput(new Date()),
  );

  const [search, setSearch] = useState("");

  const [department, setDepartment] = useState("All departments");

  const anchorDate = useMemo(
    () => parseLocalDate(selectedDate),
    [selectedDate],
  );

  const weekDates = useMemo(() => {
    const monday = startOfWeek(anchorDate);

    return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
  }, [anchorDate]);

  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLowerCase();

    return EMPLOYEES.filter((employee) => {
      const matchesQuery =
        !query ||
        employee.name.toLowerCase().includes(query) ||
        employee.id.toLowerCase().includes(query) ||
        employee.role.toLowerCase().includes(query);

      const matchesDepartment =
        department === "All departments" || employee.department === department;

      return matchesQuery && matchesDepartment;
    });
  }, [search, department]);

  const weekRows = useMemo(
    () =>
      filteredEmployees.map((employee) => {
        const index = EMPLOYEES.findIndex((item) => item.id === employee.id);

        const statuses = weekDates.map((date) => getDemoStatus(index, date));

        const counts = getCounts(statuses);

        return { ...employee, statuses, counts, rate: attendanceRate(counts) };
      }),
    [filteredEmployees, weekDates],
  );

  const monthDates = useMemo(() => {
    const first = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);

    const last = new Date(
      anchorDate.getFullYear(),
      anchorDate.getMonth() + 1,
      0,
    );

    return Array.from({ length: last.getDate() }, (_, index) =>
      addDays(first, index),
    ).filter((date) => date.getDay() !== 0 && date.getDay() !== 6);
  }, [anchorDate]);

  const monthRows = useMemo(
    () =>
      filteredEmployees.map((employee) => {
        const index = EMPLOYEES.findIndex((item) => item.id === employee.id);

        const statuses = monthDates.map((date) => getDemoStatus(index, date));

        const counts = getCounts(statuses);

        return { ...employee, counts, rate: attendanceRate(counts) };
      }),
    [filteredEmployees, monthDates],
  );

  const yearRows = useMemo(
    () =>
      Array.from({ length: 12 }, (_, monthIndex) => {
        const first = new Date(anchorDate.getFullYear(), monthIndex, 1);

        const last = new Date(anchorDate.getFullYear(), monthIndex + 1, 0);

        const dates = Array.from({ length: last.getDate() }, (_, index) =>
          addDays(first, index),
        )

          .filter((date) => date.getDay() !== 0 && date.getDay() !== 6);

        const allStatuses = [];

        filteredEmployees.forEach((employee) => {
          const employeeIndex = EMPLOYEES.findIndex(
            (item) => item.id === employee.id,
          );

          dates.forEach((date) =>
            allStatuses.push(getDemoStatus(employeeIndex, date)),
          );
        });

        const counts = getCounts(allStatuses);

        return {
          month: first.toLocaleDateString("en-IN", { month: "long" }),
          counts,
          rate: attendanceRate(counts),
          workingDays: dates.length * filteredEmployees.length,
        };
      }),
    [anchorDate, filteredEmployees],
  );

  const allCounts = useMemo(() => {
    if (view === "weekly") {
      return weekRows.reduce((total, row) => {
        Object.keys(total).forEach((key) => {
          total[key] += row.counts[key] || 0;
        });

        return total;
      }, emptyCounts());
    }

    if (view === "monthly") {
      return monthRows.reduce((total, row) => {
        Object.keys(total).forEach((key) => {
          total[key] += row.counts[key] || 0;
        });

        return total;
      }, emptyCounts());
    }

    return yearRows.reduce((total, row) => {
      Object.keys(total).forEach((key) => {
        total[key] += row.counts[key] || 0;
      });

      return total;
    }, emptyCounts());
  }, [view, weekRows, monthRows, yearRows]);

  const periodLabel = useMemo(() => {
    if (view === "weekly")
      return `${formatDate(weekDates[0])} – ${formatDate(weekDates[6], { day: "2-digit", month: "short", year: "numeric" })}`;

    if (view === "monthly")
      return anchorDate.toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
      });

    return String(anchorDate.getFullYear());
  }, [view, weekDates, anchorDate]);

  const movePeriod = (direction) => {
    const date = new Date(anchorDate);

    if (view === "weekly") date.setDate(date.getDate() + direction * 7);

    if (view === "monthly") date.setMonth(date.getMonth() + direction);

    if (view === "yearly") date.setFullYear(date.getFullYear() + direction);

    setSelectedDate(toDateInput(date));
  };

  const exportCsv = () => {
    const rows = [];

    if (view === "weekly") {
      rows.push([
        "Employee ID",
        "Employee",
        "Department",
        ...weekDates.map((date) =>
          formatDate(date, {
            weekday: "short",
            day: "2-digit",
            month: "short",
          }),
        ),
        "Present",
        "Absent",
        "Late",
        "Leave",
        "Attendance %",
      ]);

      weekRows.forEach((row) =>
        rows.push([
          row.id,
          row.name,
          row.department,
          ...row.statuses,
          row.counts.Present,
          row.counts.Absent,
          row.counts.Late,
          row.counts.Leave,
          `${row.rate}%`,
        ]),
      );
    } else if (view === "monthly") {
      rows.push([
        "Employee ID",
        "Employee",
        "Department",
        "Present",
        "Absent",
        "Late",
        "Leave",
        "Working days",
        "Attendance %",
      ]);

      monthRows.forEach((row) =>
        rows.push([
          row.id,
          row.name,
          row.department,
          row.counts.Present,
          row.counts.Absent,
          row.counts.Late,
          row.counts.Leave,
          monthDates.length,
          `${row.rate}%`,
        ]),
      );
    } else {
      rows.push([
        "Month",
        "Present",
        "Absent",
        "Late",
        "Leave",
        "Attendance %",
      ]);

      yearRows.forEach((row) =>
        rows.push([
          row.month,
          row.counts.Present,
          row.counts.Absent,
          row.counts.Late,
          row.counts.Leave,
          `${row.rate}%`,
        ]),
      );
    }

    const csv = rows
      .map((row) =>
        row
          .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");

    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    );

    const link = document.createElement("a");

    link.href = url;

    link.download = `attendance-${view}-${selectedDate}.csv`;

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);
  };

  const workingRecords =
    allCounts.Present + allCounts.Absent + allCounts.Late + allCounts.Leave;

  const summaryRate = attendanceRate(allCounts);

  const departments = [
    "All departments",
    ...Array.from(new Set(EMPLOYEES.map((employee) => employee.department))),
  ];

  return (
    <div
      className="attendance-app w-full min-w-0 bg-slate-50 text-slate-800"
      data-theme={theme}
    >
      <div className="mx-auto w-full min-w-0 max-w-[1600px] pb-6">
        <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{" "}
              Workforce analytics
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              All Attendance
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Review attendance records across weekly, monthly, and yearly
              periods in one place.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50"
            >
              <span aria-hidden="true">⇩</span> Export CSV
            </button>
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div
            className="inline-flex w-full rounded-xl bg-slate-100 p-1 sm:w-fit"
            role="tablist"
            aria-label="Attendance period"
          >
            {VIEW_OPTIONS.map((option) => (
              <button
                key={option.value}
                role="tab"
                aria-selected={view === option.value}
                onClick={() => setView(option.value)}
                type="button"
                className={`flex-1 rounded-lg px-5 py-2.5 text-sm font-semibold transition sm:flex-none ${view === option.value ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 p-1 sm:justify-start">
              <button
                type="button"
                onClick={() => movePeriod(-1)}
                aria-label="Previous period"
                className="rounded-lg px-3 py-2 text-lg text-slate-500 transition hover:bg-slate-100"
              >
                ‹
              </button>

              <span className="min-w-[155px] text-center text-sm font-semibold text-slate-700">
                {periodLabel}
              </span>

              <button
                type="button"
                onClick={() => movePeriod(1)}
                aria-label="Next period"
                className="rounded-lg px-3 py-2 text-lg text-slate-500 transition hover:bg-slate-100"
              >
                ›
              </button>
            </div>

            <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-500">
              <span className="whitespace-nowrap">Choose date</span>

              <input
                aria-label="Choose a date in the attendance period"
                type="date"
                value={selectedDate}
                onChange={(event) =>
                  event.target.value && setSelectedDate(event.target.value)
                }
                className="min-w-0 bg-transparent font-medium text-slate-700 outline-none"
              />
            </label>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Present"
            value={allCounts.Present.toLocaleString("en-IN")}
            detail={`${summaryRate}% attendance rate`}
            icon="✓"
            accent="bg-emerald-50 text-emerald-700"
          />

          <MetricCard
            title="Absent"
            value={allCounts.Absent.toLocaleString("en-IN")}
            detail="Recorded absences"
            icon="×"
            accent="bg-rose-50 text-rose-700"
          />

          <MetricCard
            title="Late arrivals"
            value={allCounts.Late.toLocaleString("en-IN")}
            detail="Late check-ins"
            icon="◷"
            accent="bg-amber-50 text-amber-700"
          />

          <MetricCard
            title="Leave"
            value={allCounts.Leave.toLocaleString("en-IN")}
            detail={`${workingRecords.toLocaleString("en-IN")} working-day records`}
            icon="▣"
            accent="bg-sky-50 text-sky-700"
          />
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {view === "weekly"
                  ? "Weekly attendance"
                  : view === "monthly"
                    ? "Monthly employee summary"
                    : "Yearly attendance summary"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {view === "weekly"
                  ? "Daily status for each employee, Monday to Sunday."
                  : view === "monthly"
                    ? "Attendance totals for each employee during the selected month."
                    : "Month-by-month attendance totals for the selected year."}
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="relative block">
                <span className="sr-only">Search employees</span>

                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  ⌕
                </span>

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search name, ID, role..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-50 sm:w-60"
                />
              </label>

              <label>
                <span className="sr-only">Filter by department</span>

                <select
                  value={department}
                  onChange={(event) => setDepartment(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 sm:w-52"
                >
                  {departments.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {view === "weekly" && (
            <div className="overflow-x-auto">
              <table className="min-w-[1000px] w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="sticky left-0 z-10 min-w-[220px] bg-slate-50 px-5 py-4 font-semibold">
                      Employee
                    </th>

                    {weekDates.map((date) => (
                      <th
                        key={toDateInput(date)}
                        className="min-w-[105px] px-3 py-4 text-center font-semibold"
                      >
                        <span className="block">
                          {formatDate(date, { weekday: "short" })}
                        </span>
                        <span className="mt-1 block text-[11px] font-medium normal-case">
                          {formatDate(date)}
                        </span>
                      </th>
                    ))}

                    <th className="px-4 py-4 text-center font-semibold">
                      Rate
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {weekRows.map((row) => (
                    <tr
                      key={row.id}
                      className="transition hover:bg-slate-50/80"
                    >
                      <td className="sticky left-0 z-10 bg-white px-5 py-4 group-hover:bg-slate-50">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-xs font-bold text-emerald-700">
                            {initials(row.name)}
                          </span>

                          <span className="min-w-0">
                            <span className="block truncate font-semibold text-slate-800">
                              {row.name}
                            </span>
                            <span className="mt-0.5 block text-xs text-slate-500">
                              {row.id} · {row.department}
                            </span>
                          </span>
                        </div>
                      </td>

                      {row.statuses.map((status, index) => (
                        <td
                          key={`${row.id}-${index}`}
                          className="px-3 py-4 text-center"
                        >
                          <StatusPill status={status} />
                        </td>
                      ))}

                      <td className="px-4 py-4 text-center">
                        <span
                          className={`font-bold ${row.rate >= 90 ? "text-emerald-700" : row.rate >= 75 ? "text-amber-700" : "text-rose-700"}`}
                        >
                          {row.rate}%
                        </span>
                      </td>
                    </tr>
                  ))}

                  {weekRows.length === 0 && (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-5 py-12 text-center text-slate-500"
                      >
                        No employees match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {view === "monthly" && (
            <div className="overflow-x-auto">
              <table className="min-w-[900px] w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Employee</th>
                    <th className="px-4 py-4 text-center font-semibold">
                      Present
                    </th>
                    <th className="px-4 py-4 text-center font-semibold">
                      Absent
                    </th>
                    <th className="px-4 py-4 text-center font-semibold">
                      Late
                    </th>
                    <th className="px-4 py-4 text-center font-semibold">
                      Leave
                    </th>
                    <th className="px-4 py-4 text-center font-semibold">
                      Working days
                    </th>
                    <th className="min-w-[180px] px-5 py-4 font-semibold">
                      Attendance rate
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {monthRows.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/80">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-xs font-bold text-emerald-700">
                            {initials(row.name)}
                          </span>
                          <span>
                            <span className="block font-semibold text-slate-800">
                              {row.name}
                            </span>
                            <span className="mt-0.5 block text-xs text-slate-500">
                              {row.id} · {row.department}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center font-semibold text-emerald-700">
                        {row.counts.Present}
                      </td>
                      <td className="px-4 py-4 text-center font-semibold text-rose-700">
                        {row.counts.Absent}
                      </td>
                      <td className="px-4 py-4 text-center font-semibold text-amber-700">
                        {row.counts.Late}
                      </td>
                      <td className="px-4 py-4 text-center font-semibold text-sky-700">
                        {row.counts.Leave}
                      </td>
                      <td className="px-4 py-4 text-center text-slate-600">
                        {monthDates.length}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full rounded-full ${row.rate >= 90 ? "bg-emerald-500" : row.rate >= 75 ? "bg-amber-500" : "bg-rose-500"}`}
                              style={{ width: `${row.rate}%` }}
                            />
                          </div>
                          <span className="w-10 text-right font-bold text-slate-700">
                            {row.rate}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {monthRows.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-5 py-12 text-center text-slate-500"
                      >
                        No employees match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {view === "yearly" && (
            <div className="overflow-x-auto">
              <table className="min-w-[800px] w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Month</th>
                    <th className="px-4 py-4 text-center font-semibold">
                      Present
                    </th>
                    <th className="px-4 py-4 text-center font-semibold">
                      Absent
                    </th>
                    <th className="px-4 py-4 text-center font-semibold">
                      Late
                    </th>
                    <th className="px-4 py-4 text-center font-semibold">
                      Leave
                    </th>
                    <th className="min-w-[220px] px-5 py-4 font-semibold">
                      Attendance rate
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {yearRows.map((row) => (
                    <tr key={row.month} className="hover:bg-slate-50/80">
                      <td className="px-5 py-4 font-semibold text-slate-800">
                        {row.month}
                      </td>
                      <td className="px-4 py-4 text-center font-semibold text-emerald-700">
                        {row.counts.Present.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-4 text-center font-semibold text-rose-700">
                        {row.counts.Absent.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-4 text-center font-semibold text-amber-700">
                        {row.counts.Late.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-4 text-center font-semibold text-sky-700">
                        {row.counts.Leave.toLocaleString("en-IN")}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full rounded-full ${row.rate >= 90 ? "bg-emerald-500" : row.rate >= 75 ? "bg-amber-500" : "bg-rose-500"}`}
                              style={{ width: `${row.rate}%` }}
                            />
                          </div>
                          <span className="w-10 text-right font-bold text-slate-700">
                            {row.rate}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Showing {view === "yearly" ? 12 : filteredEmployees.length}{" "}
              {view === "yearly"
                ? "months"
                : `of ${EMPLOYEES.length} employees`}
            </span>

            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-400" /> Demo data —
              connect your attendance API for live records.
            </span>
          </div>
        </section>

        <p className="mt-5 text-xs leading-5 text-slate-400">
          Attendance rate counts Present and Late as attended days. Weekends are
          shown as off days in weekly view and excluded from working-day totals.
        </p>
      </div>
      <style>{`
.attendance-app { transition: background-color .2s ease, color .2s ease; }
.attendance-app[data-theme="dark"] { background: #030a09 !important; color: #e2efeb; }

        .attendance-app[data-theme="dark"] .bg-slate-50 { background-color: #06110f !important; }

        .attendance-app[data-theme="dark"] .bg-white { background-color: #081a17 !important; }

        .attendance-app[data-theme="dark"] .bg-slate-100 { background-color: #0b211c !important; }

        .attendance-app[data-theme="dark"] .text-slate-950,

        .attendance-app[data-theme="dark"] .text-slate-900 { color: #f1faf7 !important; }

        .attendance-app[data-theme="dark"] .text-slate-800 { color: #e1efeb !important; }

        .attendance-app[data-theme="dark"] .text-slate-700 { color: #c5dad3 !important; }

        .attendance-app[data-theme="dark"] .text-slate-600 { color: #a6c1b8 !important; }

        .attendance-app[data-theme="dark"] .text-slate-500 { color: #7e9e94 !important; }

        .attendance-app[data-theme="dark"] .text-slate-400 { color: #65867c !important; }

        .attendance-app[data-theme="dark"] .border-slate-200 { border-color: #163a31 !important; }

        .attendance-app[data-theme="dark"] .divide-slate-100 > :not([hidden]) ~ :not([hidden]) { border-color: #112e26 !important; }

        .attendance-app[data-theme="dark"] .bg-emerald-50 { background-color: #0a3025 !important; }

        .attendance-app[data-theme="dark"] .text-emerald-700 { color: #34d399 !important; }

        .attendance-app[data-theme="dark"] .ring-emerald-200 { --tw-ring-color: #17654e !important; }

        .attendance-app[data-theme="dark"] .bg-rose-50 { background-color: #35191c !important; }

        .attendance-app[data-theme="dark"] .text-rose-700 { color: #fda4af !important; }

        .attendance-app[data-theme="dark"] .ring-rose-200 { --tw-ring-color: #74313b !important; }

        .attendance-app[data-theme="dark"] .bg-amber-50 { background-color: #342814 !important; }

        .attendance-app[data-theme="dark"] .text-amber-700 { color: #fcd34d !important; }

        .attendance-app[data-theme="dark"] .ring-amber-200 { --tw-ring-color: #74551d !important; }

        .attendance-app[data-theme="dark"] .bg-sky-50 { background-color: #102b39 !important; }

        .attendance-app[data-theme="dark"] .text-sky-700 { color: #7dd3fc !important; }

        .attendance-app[data-theme="dark"] .ring-sky-200 { --tw-ring-color: #205a73 !important; }

        .attendance-app[data-theme="dark"] .bg-slate-100 { color: #a2b7b0; }

        .attendance-app[data-theme="dark"] tbody tr:hover { background-color: #0a201b !important; }

        .attendance-app[data-theme="dark"] .shadow-sm { box-shadow: 0 8px 25px rgba(0,0,0,.12) !important; }

        .attendance-app[data-theme="dark"] input,

        .attendance-app[data-theme="dark"] select { color-scheme: dark; }

        .attendance-app[data-theme="light"] { background: #eef4f2 !important; color: #18332c; }
      `}</style>
    </div>
  );
}
