
import { useState } from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  X,
  Save,
  UserPlus,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
  CalendarDays,
} from "lucide-react";

import { useCreateEmployeeMutation } from "../../slice/employeesService/employeeApi";

const THEME_KEY = "panda-employee-theme";

const WORK_TYPES = [
  "Full Time",
  "Remote",
  "Intern",
  "Notice Period",
];

const INITIAL_FORM = {
  employeeId: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  department: "",
  designation: "",
  workType: "Full Time",
  role: "",
  leaveBalance: "",
  password: "Panda@123",
  confirmPassword: "Panda@123",
};

function validTheme(value) {
  return value === "dark" || value === "light";
}

function readTheme() {
  try {
    const saved = window.localStorage.getItem(THEME_KEY);

    return validTheme(saved) ? saved : "dark";
  } catch {
    return "dark";
  }
}

export default function CreateEmployee({
  theme: dashboardTheme,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [createEmployee, { isLoading }] =
    useCreateEmployeeMutation();

  // Keep same theme as Employee Directory
  const passedTheme = location.state?.theme;

  const theme = validTheme(passedTheme)
    ? passedTheme
    : validTheme(dashboardTheme)
      ? dashboardTheme
      : readTheme();

  const dark = theme === "dark";

  const t = dark
    ? {
        page: "bg-transparent text-slate-100",

        glass:
          "border-white/20 bg-white/[0.08] shadow-black/40",

        soft:
          "border-white/10 bg-white/[0.05]",

        input:
          "border-white/20 bg-white/10 text-white placeholder:text-slate-400 focus:border-emerald-400 focus:ring-emerald-400/20",

        muted: "text-slate-300",

        button:
          "bg-emerald-400 text-slate-950 hover:bg-emerald-300",

        ghost:
          "border-white/20 bg-white/10 hover:bg-white/20",

        glowA: "bg-emerald-400/30",
        glowB: "bg-sky-400/25",

        icon: "text-emerald-300",

        error:
          "border-rose-400/40 bg-rose-500/10 text-rose-300",
      }
    : {
        page: "bg-transparent text-slate-900",

        glass:
          "border-white/70 bg-white/45 shadow-slate-400/20",

        soft:
          "border-white/60 bg-white/30",

        input:
          "border-white/80 bg-white/60 text-slate-900 placeholder:text-slate-500 focus:border-orange-400 focus:ring-orange-400/20",

        muted: "text-slate-600",

        button:
          "bg-orange-600 text-white hover:bg-orange-700",

        ghost:
          "border-white/80 bg-white/40 hover:bg-white/70",

        glowA: "bg-orange-400/35",
        glowB: "bg-sky-400/30",

        icon: "text-orange-600",

        error:
          "border-rose-300 bg-rose-50/70 text-rose-700",
      };

  const closeForm = () => {
    navigate("/employees", {
      replace: true,
      state: {
        theme,
      },
    });
  };

  const update = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    const name = [
      form.firstName.trim(),
      form.lastName.trim(),
    ]
      .filter(Boolean)
      .join(" ");

    if (
      !form.employeeId.trim() ||
      name.length < 2 ||
      !form.email.trim() ||
      !form.department.trim() ||
      !form.designation.trim() ||
      !form.role ||
      form.leaveBalance.trim() === ""
    ) {
      setError(
        "Please complete all required fields."
      );
      return;
    }

    const leaveBalance = Number(form.leaveBalance);

    if (
      !/^\d+$/.test(form.leaveBalance.trim()) ||
      !Number.isSafeInteger(leaveBalance) ||
      leaveBalance < 0
    ) {
      setError(
        "Leave balance must be a non-negative whole number."
      );
      return;
    }

    if (
      form.password.length < 8 ||
      form.password.length > 128
    ) {
      setError(
        "Password must be between 8 and 128 characters."
      );
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const payload = {
      employeeId: form.employeeId.trim(),
      name,
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim() || null,
      department: form.department.trim(),
      designation: form.designation.trim(),
      workType: form.workType,
      status: "Active",

      // ADMIN-selected values
      role: form.role,
      leaveBalance,

      password: form.password,
    };

    try {
      await createEmployee(payload).unwrap();

      navigate("/employees", {
        replace: true,
        state: {
          theme,
        },
      });
    } catch (err) {
      const issues = err?.data?.errors;

      const validationMessage = Array.isArray(issues)
        ? issues
            .map((item) => item.message)
            .join(", ")
        : "";

      const message =
        err?.status === 401
          ? "Session expired. Please log in again."
          : err?.status === 403
            ? "You do not have permission to create employees."
            : validationMessage ||
              err?.data?.message ||
              "Unable to create employee.";

      setError(message);
    }
  };

  const inputClass = `
    mt-2
    w-full
    rounded-xl
    border
    px-4
    py-3
    text-sm
    outline-none
    backdrop-blur-md
    transition
    focus:ring-2
    ${t.input}
  `;

  const field = (
    label,
    name,
    type = "text",
    required = true
  ) => (
    <label
      key={name}
      className="block text-sm font-medium"
    >
      {label}
      {required && " *"}

      <input
        name={name}
        type={type}
        value={form[name]}
        onChange={update}
        required={required}
        className={inputClass}
      />
    </label>
  );

  return (
    <div
      className={`relative isolate min-h-screen overflow-hidden ${t.page}`}
    >
      {/* GLASS BACKGROUND GLOWS */}

      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -left-28 top-20 -z-10 h-[450px] w-[450px] rounded-full blur-[110px] ${t.glowA}`}
      />

      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -right-20 top-60 -z-10 h-[480px] w-[480px] rounded-full blur-[120px] ${t.glowB}`}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-1/3 -z-10 h-72 w-72 rounded-full bg-violet-400/15 blur-[100px]"
      />

      {/* MAIN CONTAINER */}

      <div className="relative mx-auto max-w-4xl p-4 sm:p-8">
        {/* GLASS FORM */}

        <form
          onSubmit={submit}
          className={`overflow-hidden rounded-3xl border shadow-2xl backdrop-blur-2xl ${t.glass}`}
        >
          {/* FORM HEADER */}

          <div
            className={`flex items-center justify-between gap-4 border-b p-6 sm:p-7 ${t.soft}`}
          >
            <div className="flex min-w-0 items-center gap-4">
              <div
                className={`shrink-0 rounded-2xl border p-3 backdrop-blur-lg ${t.ghost}`}
              >
                <UserPlus
                  size={24}
                  className={t.icon}
                />
              </div>

              <div className="min-w-0">
                <h1 className="text-2xl font-bold">
                  Create Employee
                </h1>

                <p className={`mt-1 text-sm ${t.muted}`}>
                  Add a new employee to Panda Workspace.
                </p>
              </div>
            </div>

            {/* CLOSE BUTTON */}

            <button
              type="button"
              onClick={closeForm}
              aria-label="Close create employee form"
              title="Close"
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border backdrop-blur-xl transition ${t.ghost}`}
            >
              <X size={20} />
            </button>
          </div>

          {/* EMPLOYEE DETAILS */}

          <div className="grid gap-5 p-6 sm:grid-cols-2 sm:p-7">
            {field("Employee ID", "employeeId")}

            {field(
              "Email Address",
              "email",
              "email"
            )}

            {field("First Name", "firstName")}

            {field("Last Name", "lastName")}

            {field("Department", "department")}

            {field("Designation", "designation")}

            {field(
              "Phone",
              "phone",
              "tel",
              false
            )}

            <label className="block text-sm font-medium">
              Work Type *

              <select
                name="workType"
                value={form.workType}
                onChange={update}
                className={`${inputClass} [&>option]:text-slate-900`}
              >
                {WORK_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* ACCESS & LEAVE SETTINGS */}

          <div className={`border-t p-6 sm:p-7 ${t.soft}`}>
            <div className="mb-5 flex items-center gap-3">
              <ShieldCheck
                size={22}
                className={t.icon}
              />

              <h2 className="text-lg font-bold">
                Access & Leave Settings
              </h2>
            </div>

            <p className={`mb-5 text-xs ${t.muted}`}>
              The ADMIN must choose a role and enter a
              leave balance.
            </p>

            <div className="grid gap-5 sm:grid-cols-2">
              {/* ROLE SELECTION */}

              <label className="block text-sm font-medium">
                Employee Role *

                <select
                  name="role"
                  value={form.role}
                  onChange={update}
                  required
                  className={`${inputClass} [&>option]:text-slate-900`}
                >
                  <option value="" disabled>
                    Select role
                  </option>

                  <option value="EMPLOYEE">
                    Employee
                  </option>

                  <option value="HR">
                    HR
                  </option>

                  <option value="ADMIN">
                    Admin
                  </option>
                </select>
              </label>

              {/* LEAVE BALANCE */}

              <label className="block text-sm font-medium">
                <span className="inline-flex items-center gap-2">
                  <CalendarDays
                    size={16}
                    className={t.icon}
                  />

                  Leave Balance (days) *
                </span>

                <input
                  name="leaveBalance"
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  placeholder="Enter leave days"
                  value={form.leaveBalance}
                  onChange={update}
                  required
                  className={inputClass}
                />
              </label>
            </div>
          </div>

          {/* LOGIN CREDENTIALS */}

          <div className={`border-t p-6 sm:p-7 ${t.soft}`}>
            <div className="mb-5 flex items-center gap-3">
              <LockKeyhole
                size={22}
                className={t.icon}
              />

              <h2 className="text-lg font-bold">
                Login Credentials
              </h2>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {/* PASSWORD */}

              <label className="block text-sm font-medium">
                Password *

                <div className="relative mt-2">
                  <input
                    name="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={form.password}
                    onChange={update}
                    placeholder="Enter password"
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={128}
                    required
                    className={`w-full rounded-xl border px-4 py-3 pr-12 text-sm outline-none backdrop-blur-md focus:ring-2 ${t.input}`}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (previous) => !previous
                      )
                    }
                    aria-label="Toggle password visibility"
                    className={`absolute right-4 top-1/2 -translate-y-1/2 ${t.muted}`}
                  >
                    {showPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>
              </label>

              {/* CONFIRM PASSWORD */}

              <label className="block text-sm font-medium">
                Confirm Password *

                <div className="relative mt-2">
                  <input
                    name="confirmPassword"
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    value={form.confirmPassword}
                    onChange={update}
                    placeholder="Confirm password"
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={128}
                    required
                    className={`w-full rounded-xl border px-4 py-3 pr-12 text-sm outline-none backdrop-blur-md focus:ring-2 ${t.input}`}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        (previous) => !previous
                      )
                    }
                    aria-label="Toggle confirm password visibility"
                    className={`absolute right-4 top-1/2 -translate-y-1/2 ${t.muted}`}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>
              </label>
            </div>

            <p className={`mt-4 text-xs ${t.muted}`}>
              Password must be between 8 and 128 characters.
            </p>
          </div>

          {/* API ERROR */}

          {error && (
            <div
              role="alert"
              className={`mx-6 mb-5 rounded-xl border p-4 text-sm backdrop-blur-xl ${t.error}`}
            >
              {error}
            </div>
          )}

          {/* ACTION BUTTONS */}

          <div
            className={`flex flex-wrap justify-end gap-3 border-t p-6 sm:p-7 ${t.soft}`}
          >
            <button
              type="button"
              onClick={closeForm}
              className={`rounded-xl border px-5 py-2.5 text-sm font-semibold backdrop-blur-lg ${t.ghost}`}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${t.button}`}
            >
              <Save size={17} />

              {isLoading
                ? "Creating..."
                : "Create Employee"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}