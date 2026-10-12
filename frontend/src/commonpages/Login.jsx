import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { loginWithBackend } from "../utils/authStorage";

// 1. Accepts onLoginSuccess prop from App.jsx
export default function Login({ onLoginSuccess }) {
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  // Theme State: false for Light, true for Dark
  const [isDarkMode, setIsDarkMode] = useState(
    () => localStorage.getItem("panda-theme") !== "light",
  );
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
    rememberMe: true,
  });
  const toggleTheme = () => {
    setIsDarkMode((previous) => {
      const next = !previous;

      localStorage.setItem("panda-theme", next ? "dark" : "light");

      return next;
    });
  };

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // ========================================================
  // 3D ROTATING CYBER WORLD (SOLID HEX COLORS ONLY)
  // ========================================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const NUM_POINTS = 460;
    const globeRadius = Math.min(width, height) * 0.38;
    const points = [];

    for (let i = 0; i < NUM_POINTS; i++) {
      const phi = Math.acos(-1 + (2 * i) / NUM_POINTS);
      const theta = Math.sqrt(NUM_POINTS * Math.PI) * phi;
      points.push({
        baseX: globeRadius * Math.cos(theta) * Math.sin(phi),
        baseY: globeRadius * Math.sin(theta) * Math.sin(phi),
        baseZ: globeRadius * Math.cos(phi),
      });
    }

    const hubAngles = [
      { lat: 0.35, lon: 1.2 },
      { lat: -0.15, lon: -1.8 },
      { lat: 0.52, lon: 0.1 },
      { lat: 0.22, lon: 1.35 },
      { lat: 0.45, lon: 0.25 },
      { lat: -0.38, lon: 2.6 },
    ];

    const hubs = hubAngles.map((h) => {
      const phi = Math.PI / 2 - h.lat;
      const theta = h.lon;
      return {
        baseX: globeRadius * Math.sin(phi) * Math.cos(theta),
        baseY: globeRadius * Math.cos(phi),
        baseZ: globeRadius * Math.sin(phi) * Math.sin(phi) * Math.sin(theta),
      };
    });

    let rotationAngle = 0;
    let pulseTime = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      rotationAngle += 0.0035;
      pulseTime += 0.04;

      const cosRot = Math.cos(rotationAngle);
      const sinRot = Math.sin(rotationAngle);

      // 1. Globe Ambient Core
      ctx.save();
      ctx.globalAlpha = isDarkMode ? 0.25 : 0.45;
      ctx.fillStyle = isDarkMode ? "#0a2924" : "#e1f5ef";
      ctx.beginPath();
      ctx.arc(centerX, centerY, globeRadius * 1.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 2. Orbital Radar Rings
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(0.35);

      ctx.globalAlpha = isDarkMode ? 0.35 : 0.5;
      ctx.strokeStyle = isDarkMode ? "#10b981" : "#a7f3d0";
      ctx.lineWidth = 1;
      ctx.setLineDash([8, 12]);
      ctx.beginPath();
      ctx.ellipse(
        0,
        0,
        globeRadius * 1.28,
        globeRadius * 0.45,
        0,
        0,
        Math.PI * 2,
      );
      ctx.stroke();

      ctx.globalAlpha = isDarkMode ? 0.2 : 0.35;
      ctx.strokeStyle = isDarkMode ? "#34d399" : "#6ee7b7";
      ctx.setLineDash([4, 18]);
      ctx.beginPath();
      ctx.ellipse(
        0,
        0,
        globeRadius * 1.45,
        globeRadius * 0.52,
        0,
        0,
        Math.PI * 2,
      );
      ctx.stroke();
      ctx.restore();

      // 3. Project Globe Points
      const projected = points.map((p) => {
        const x1 = p.baseX * cosRot - p.baseZ * sinRot;
        const z1 = p.baseZ * cosRot + p.baseX * sinRot;
        const scale = (z1 + globeRadius * 1.8) / (globeRadius * 2.8);
        return {
          px: centerX + x1,
          py: centerY + p.baseY,
          pz: z1,
          scale: Math.max(0.1, scale),
        };
      });

      // Grid Lines
      ctx.save();
      ctx.strokeStyle = isDarkMode ? "#0d3b32" : "#a7f3d0";
      ctx.lineWidth = 0.8;
      ctx.setLineDash([]);
      for (let i = 0; i < projected.length; i += 6) {
        const p1 = projected[i];
        if (p1.pz < -globeRadius * 0.4) continue;
        for (let j = i + 1; j < i + 4; j++) {
          if (j < projected.length) {
            const p2 = projected[j];
            const dist = Math.hypot(p1.px - p2.px, p1.py - p2.py);
            if (dist < 45) {
              ctx.beginPath();
              ctx.moveTo(p1.px, p1.py);
              ctx.lineTo(p2.px, p2.py);
              ctx.stroke();
            }
          }
        }
      }
      ctx.restore();

      // Node Particles
      projected.forEach((p) => {
        if (p.pz < -globeRadius * 0.6) return;

        ctx.save();
        ctx.globalAlpha = Math.max(
          0.18,
          (p.pz + globeRadius) / (globeRadius * 2),
        );
        ctx.fillStyle = isDarkMode ? "#34d399" : "#059669";
        ctx.beginPath();
        ctx.arc(p.px, p.py, Math.max(0.8, p.scale * 1.6), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // 4. Global Hubs & Connection Arcs
      const projectedHubs = hubs.map((h) => {
        const x1 = h.baseX * cosRot - h.baseZ * sinRot;
        const z1 = h.baseZ * cosRot + h.baseX * sinRot;
        return {
          px: centerX + x1,
          py: centerY + h.baseY,
          pz: z1,
        };
      });

      for (let i = 0; i < projectedHubs.length; i++) {
        const h1 = projectedHubs[i];
        const h2 = projectedHubs[(i + 1) % projectedHubs.length];

        if (h1.pz > -globeRadius * 0.3 && h2.pz > -globeRadius * 0.3) {
          ctx.save();
          ctx.globalAlpha = isDarkMode ? 0.55 : 0.6;
          ctx.strokeStyle = "#10b981";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(h1.px, h1.py);

          const midX = (h1.px + h2.px) / 2;
          const midY = (h1.py + h2.py) / 2 - 25;
          ctx.quadraticCurveTo(midX, midY, h2.px, h2.py);
          ctx.stroke();

          // Traveling Data Packet
          const t = (Math.sin(pulseTime + i) + 1) / 2;
          const pulseX =
            (1 - t) * (1 - t) * h1.px + 2 * (1 - t) * t * midX + t * t * h2.px;
          const pulseY =
            (1 - t) * (1 - t) * h1.py + 2 * (1 - t) * t * midY + t * t * h2.py;

          ctx.globalAlpha = 1;
          ctx.fillStyle = isDarkMode ? "#34d399" : "#047857";
          ctx.beginPath();
          ctx.arc(pulseX, pulseY, 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // Hub Beacon Rings
      projectedHubs.forEach((h) => {
        if (h.pz < -globeRadius * 0.4) return;
        const pulse = 4 + Math.sin(pulseTime * 2) * 2;

        ctx.save();
        ctx.globalAlpha = 0.8;
        ctx.strokeStyle = isDarkMode ? "#10b981" : "#059669";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(h.px, h.py, pulse, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = "#10b981";
        ctx.beginPath();
        ctx.arc(h.px, h.py, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isDarkMode]);

  // Handle Input Changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // ========================================================
  // 2. UPDATED HANDLESUBMIT: OPENS HOME PAGE DIRECTLY
  // ========================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);
    try {
      const result = await loginWithBackend(
        formData.identifier,
        formData.password,
        formData.rememberMe,
      );
      if (!result.ok) {
        setErrorMessage(result.message);
        return;
      }

      const role = String(result.user?.role || "")
        .trim()
        .toLowerCase();

      const adminRoles = [
        "admin",
        "administrator",
        "hr",
        "hr admin",
        "hr super admin",
        "superadmin",
      ];

      if (onLoginSuccess) {
        onLoginSuccess(result.user);
      }

      navigate(adminRoles.includes(role) ? "/home" : "/employee/dashboard", {
        replace: true,
      });
    } catch (error) {
      setErrorMessage(
        error.message || "Unable to connect to the authentication service.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`login-root ${isDarkMode ? "theme-dark" : "theme-light"}`}>
      {/* 3D Global World Canvas */}
      <canvas ref={canvasRef} className="world-canvas" />

      {/* Top Right Theme Toggle Switch */}
      <button
        type="button"
        className="theme-switch-btn"
        onClick={toggleTheme}
        title="Toggle Theme"
      >
        {isDarkMode ? "☀️" : "🌙"}
      </button>

      {/* Atmospheric Background Watermark */}
      <div className="world-watermark">
        <span className="watermark-tag">GLOBAL INFOTECH MATRIX</span>
        <h2 className="watermark-title">PANDA WORKSPACE</h2>
      </div>

      {/* Transparent Glassmorphism Card */}
      <div className="glass-login-box">
        {/* Top Radar Status Pill */}
        <div className="radar-status-badge">
          <span className="pulsing-beacon"></span>
        </div>

        {/* Brand Icon & Heading */}
        <div className="card-top-identity">
          <div className="cyber-panda-icon">
            <svg viewBox="0 0 48 48" fill="none" className="panda-svg">
              <circle
                cx="24"
                cy="24"
                r="22"
                stroke="#10b981"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              <circle
                cx="14"
                cy="14"
                r="5.5"
                fill={isDarkMode ? "#10b981" : "#059669"}
              />
              <circle
                cx="34"
                cy="14"
                r="5.5"
                fill={isDarkMode ? "#10b981" : "#059669"}
              />
              <ellipse
                cx="24"
                cy="26"
                rx="14"
                ry="12"
                fill={isDarkMode ? "#081c19" : "#ffffff"}
                stroke="#10b981"
                strokeWidth="1.5"
              />
              <ellipse
                cx="19"
                cy="24"
                rx="3.5"
                ry="4"
                fill={isDarkMode ? "#10b981" : "#059669"}
                transform="rotate(-15 19 24)"
              />
              <ellipse
                cx="29"
                cy="24"
                rx="3.5"
                ry="4"
                fill={isDarkMode ? "#10b981" : "#059669"}
                transform="rotate(15 29 24)"
              />
              <circle
                cx="19.5"
                cy="24"
                r="1.5"
                fill={isDarkMode ? "#030c0a" : "#ffffff"}
              />
              <circle
                cx="28.5"
                cy="24"
                r="1.5"
                fill={isDarkMode ? "#030c0a" : "#ffffff"}
              />
              <ellipse
                cx="24"
                cy="29"
                rx="2"
                ry="1.2"
                fill={isDarkMode ? "#10b981" : "#059669"}
              />
              <path
                d="M22 31C23 32 25 32 26 31"
                stroke={isDarkMode ? "#10b981" : "#059669"}
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <h1 className="company-heading">Panda Workspace</h1>
          <p className="company-subtext">INFOTECH PLATFORM • SECURE ACCESS</p>
        </div>

        {errorMessage && (
          <div className="error-toast">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 3. Form connected with onSubmit={handleSubmit} */}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field-group">
            <label className="field-label" htmlFor="identifier">
              EMPLOYEE ID / WORK EMAIL
            </label>
            <div className="glass-input-wrapper">
              <span className="field-icon">
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                >
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </span>
              <input
                type="text"
                id="identifier"
                name="identifier"
                placeholder="admin@panda"
                value={formData.identifier}
                onChange={handleChange}
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="password">
              SECURITY KEY / PASSWORD
            </label>
            <div className="glass-input-wrapper">
              <span className="field-icon">
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                placeholder="••••••••••••"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="eye-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Simple Keep Signed In Toggle */}
          <div className="single-checkbox-row">
            <label className="custom-checkbox-container">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
              />
              <span className="glass-checkmark"></span>
              <span className="remember-text">Remember active terminal</span>
            </label>
          </div>

          {/* Enter Workspace Action Button */}
          <button
            type="submit"
            className="glass-action-button"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="btn-loading">
                <span className="radar-spinner"></span>
                AUTHENTICATING...
              </span>
            ) : (
              <span className="btn-ready">
                ENTER WORKSPACE
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </span>
            )}
          </button>
        </form>

        {/* Bottom Security Footer */}
        <div className="glass-card-bottom">
          <div className="crypto-badge">
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#10b981"
              strokeWidth="2"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>256-BIT QUANTUM ENCRYPTED</span>
          </div>
          <span className="telemetry-node">NODE • US-EAST-04</span>
        </div>
      </div>

      {/* Scoped CSS with 100% Solid Hex Colors */}
      <style>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
        }

        .login-root {
          position: relative;
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          padding: 20px;
          transition: background-color 0.3s ease;
        }

        /* 3D Canvas Background */
        .world-canvas {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
          pointer-events: none;
        }

        /* Top Right Theme Toggle */
        .theme-switch-btn {
          position: absolute;
          top: 24px;
          right: 24px;
          z-index: 20;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        /* Atmospheric Background Watermark */
        .world-watermark {
          position: absolute;
          top: 7%;
          left: 50%;
          transform: translateX(-50%);
          text-align: center;
          z-index: 2;
          pointer-events: none;
          user-select: none;
        }

        .watermark-tag {
          display: block;
          font-size: 11px;
          letter-spacing: 0.35em;
          font-weight: 700;
          margin-bottom: 6px;
        }

        .watermark-title {
          font-size: clamp(30px, 6vw, 64px);
          font-weight: 900;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          white-space: nowrap;
        }

        /* Transparent Glassmorphism Card */
        .glass-login-box {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 430px;
          opacity: 0.94;
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-radius: 24px;
          padding: 34px 28px;
          transition: border-color 0.3s ease, background-color 0.3s ease;
        }

        /* Top Radar Pill */
        .radar-status-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          padding: 5px 14px;
          border-radius: 20px;
          font-size: 11px;
          margin: 0 auto 20px auto;
          width: fit-content;
        }

        .pulsing-beacon {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background-color: #10b981;
          box-shadow: 0 0 8px #10b981;
          animation: beaconPulse 2s infinite ease-in-out;
        }

        .radar-server {
          font-family: monospace;
          letter-spacing: 0.5px;
        }

        .radar-tag {
          font-weight: 800;
          font-size: 9px;
          padding: 2px 7px;
          border-radius: 4px;
        }

        /* Top Identity */
        .card-top-identity {
          text-align: center;
          margin-bottom: 24px;
        }

        .cyber-panda-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 60px;
          height: 60px;
          border-radius: 18px;
          margin-bottom: 12px;
        }

        .panda-svg {
          width: 38px;
          height: 38px;
        }

        .company-heading {
          font-size: 25px;
          font-weight: 700;
          letter-spacing: -0.3px;
          margin-bottom: 4px;
        }

        .company-subtext {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.8px;
        }

        /* Error Toast */
        .error-toast {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          border-radius: 10px;
          font-size: 13px;
          margin-bottom: 18px;
        }

        /* Form */
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .field-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
          text-align: left;
        }

        .field-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.8px;
        }

        .glass-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .field-icon {
          position: absolute;
          left: 14px;
          display: flex;
          align-items: center;
          pointer-events: none;
        }

        .glass-input-wrapper input {
          width: 100%;
          border-radius: 12px;
          padding: 12px 14px 12px 42px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .eye-toggle {
          position: absolute;
          right: 14px;
          background: none;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 4px;
        }

        /* Checkbox */
        .single-checkbox-row {
          display: flex;
          align-items: center;
        }

        .custom-checkbox-container {
          display: flex;
          align-items: center;
          gap: 9px;
          font-size: 12px;
          cursor: pointer;
          user-select: none;
        }

        .custom-checkbox-container input {
          display: none;
        }

        .glass-checkmark {
          width: 16px;
          height: 16px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .custom-checkbox-container input:checked + .glass-checkmark {
          background-color: #10b981;
          border-color: #10b981;
        }

        .custom-checkbox-container input:checked + .glass-checkmark::after {
          content: "";
          width: 4px;
          height: 8px;
          border: solid #ffffff;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
          margin-bottom: 2px;
        }

        /* Enter Workspace Button */
        .glass-action-button {
          width: 100%;
          margin-top: 6px;
          padding: 13px;
          border: none;
          border-radius: 12px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .glass-action-button:hover:not(:disabled) {
          background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
          transform: translateY(-1px);
        }

        .glass-action-button:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .btn-ready, .btn-loading {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .radar-spinner {
          width: 15px;
          height: 15px;
          border: 2px solid #062620;
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        /* Card Bottom */
        .glass-card-bottom {
          margin-top: 24px;
          padding-top: 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 10px;
        }

        .crypto-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 600;
          letter-spacing: 0.3px;
          color: #10b981;
        }

        .telemetry-node {
          font-family: monospace;
        }

        /* ========================================================
           LIGHT THEME DEFINITIONS (SOLID HEX ONLY)
           ======================================================== */
        .theme-light {
          background-color: #f4f8f7;
          color: #0f172a;
        }

        .theme-light .theme-switch-btn {
          background-color: #ffffff;
          color: #0f172a;
          border: 1px solid #cbd5e1;
        }

        .theme-light .watermark-tag {
          color: #059669;
          opacity: 0.65;
        }

        .theme-light .watermark-title {
          color: #d1fae5;
        }

        .theme-light .glass-login-box {
          background-color: #ffffff;
          border: 1px solid #a7f3d0;
          box-shadow: 0 20px 45px #cbd5e1, 0 0 25px #d1fae5;
        }

        .theme-light .radar-status-badge {
          background-color: #ecfdf5;
          border: 1px solid #a7f3d0;
        }

        .theme-light .radar-server {
          color: #334155;
        }

        .theme-light .radar-tag {
          background-color: #d1fae5;
          color: #047857;
        }

        .theme-light .cyber-panda-icon {
          background-color: #ecfdf5;
          border: 1px solid #a7f3d0;
          box-shadow: 0 4px 14px #e2e8f0;
        }

        .theme-light .company-heading {
          color: #0f172a;
        }

        .theme-light .company-subtext {
          color: #059669;
        }

        .theme-light .error-toast {
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          color: #b91c1c;
        }

        .theme-light .field-label {
          color: #475569;
        }

        .theme-light .glass-input-wrapper input {
          background-color: #f8fafc;
          border: 1px solid #cbd5e1;
          color: #0f172a;
        }

        .theme-light .glass-input-wrapper input::placeholder {
          color: #94a3b8;
        }

        .theme-light .glass-input-wrapper input:focus {
          border-color: #10b981;
          background-color: #ffffff;
          box-shadow: 0 0 10px #d1fae5;
        }

        .theme-light .eye-toggle {
          color: #94a3b8;
        }

        .theme-light .custom-checkbox-container {
          color: #475569;
        }

        .theme-light .glass-checkmark {
          border: 1px solid #cbd5e1;
          background-color: #ffffff;
        }

        .theme-light .glass-action-button {
          color: #ffffff;
          box-shadow: 0 6px 18px #a7f3d0;
        }

        .theme-light .glass-card-bottom {
          border-top: 1px solid #e2e8f0;
          color: #64748b;
        }

        .theme-light .telemetry-node {
          color: #94a3b8;
        }

        /* ========================================================
           DARK THEME DEFINITIONS (SOLID HEX ONLY)
           ======================================================== */
        .theme-dark {
          background-color: #030707;
          color: #ffffff;
        }

        .theme-dark .theme-switch-btn {
          background-color: #081a17;
          color: #34d399;
          border: 1px solid #14443c;
        }

        .theme-dark .watermark-tag {
          color: #34d399;
          opacity: 0.5;
        }

        .theme-dark .watermark-title {
          color: #0b2e28;
        }

        .theme-dark .glass-login-box {
          background-color: #071715;
          border: 1px solid #14443c;
          box-shadow: 0 25px 50px #000000, 0 0 25px #052923;
        }

        .theme-dark .radar-status-badge {
          background-color: #092420;
          border: 1px solid #13453d;
        }

        .theme-dark .radar-server {
          color: #94a3b8;
        }

        .theme-dark .radar-tag {
          background-color: #0d3830;
          color: #34d399;
        }

        .theme-dark .cyber-panda-icon {
          background-color: #0a2622;
          border: 1px solid #165045;
          box-shadow: 0 0 20px #08332c;
        }

        .theme-dark .company-heading {
          color: #ffffff;
        }

        .theme-dark .company-subtext {
          color: #34d399;
        }

        .theme-dark .error-toast {
          background-color: #2b0e0e;
          border: 1px solid #7f1d1d;
          color: #fca5a5;
        }

        .theme-dark .field-label {
          color: #8fa8a4;
        }

        .theme-dark .glass-input-wrapper input {
          background-color: #051210;
          border: 1px solid #123d36;
          color: #ffffff;
        }

        .theme-dark .glass-input-wrapper input::placeholder {
          color: #3a5c57;
        }

        .theme-dark .glass-input-wrapper input:focus {
          border-color: #10b981;
          background-color: #071916;
          box-shadow: 0 0 12px #09382f;
        }

        .theme-dark .eye-toggle {
          color: #597d78;
        }

        .theme-dark .custom-checkbox-container {
          color: #8ca5a2;
        }

        .theme-dark .glass-checkmark {
          border: 1px solid #1a4d44;
          background-color: #061715;
        }

        .theme-dark .glass-action-button {
          color: #031411;
          box-shadow: 0 5px 18px #083c31;
        }

        .theme-dark .glass-card-bottom {
          border-top: 1px solid #113630;
          color: #557571;
        }

        .theme-dark .telemetry-node {
          color: #43635f;
        }

        @keyframes beaconPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
