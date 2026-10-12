import React, { useState, useRef } from "react";

import { useNavigate } from "react-router-dom";
import { getCurrentSession, logoutFromLocalStorage } from "../utils/authStorage";



function readLoggedInUser() {
  const session = getCurrentSession();
  if (session?.user && typeof session.user === "object") return session.user;

  try {
    const raw = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (!raw) return { name: "Employee", email: "", department: "Not assigned", role: "Employee", employeeId: "" };
    const parsed = JSON.parse(raw);
    const user = parsed?.user && typeof parsed.user === "object" ? parsed.user : parsed;
    if (!user || typeof user !== "object") return { name: "Employee", email: "", department: "Not assigned", role: "Employee", employeeId: "" };
    return {
      ...user,
      name: user.name || user.fullName || user.username || "Employee",
      email: user.email || "",
      department: user.department || "Not assigned",
      role: user.role || "Employee",
    };
  } catch {
    return { name: "Employee", email: "", department: "Not assigned", role: "Employee", employeeId: "" };
  }
}

const DEFAULT_PROFILE_PIC = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80";

export default function Settings({ onClose }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [adminData, setAdminData] = useState(() => {
    const user = readLoggedInUser();
    const profileKey = `panda-profile:${user.employeeId || user.id || user.email || "current"}`;
    let savedProfile = {};
    try {
      savedProfile = JSON.parse(
        localStorage.getItem(profileKey) || sessionStorage.getItem(profileKey) || "{}"
      );
    } catch {
      savedProfile = {};
    }
    return {
      name: user.name,
      email: user.email,
      department: user.department || "Not assigned",
      accessTier: user.role || "Employee",
      profilePic: savedProfile.profilePic || DEFAULT_PROFILE_PIC,
    };
  });

  const [savedSuccess, setSavedSuccess] = useState(false);



  // Handle Input Changes

  const handleChange = (e) => {

    const { name, value } = e.target;

    setAdminData((prev) => ({ ...prev, [name]: value }));

  };



  // Handle Avatar Image Upload

  const handleImageUpload = (e) => {

    const file = e.target.files[0];

    if (file) {

      const imageUrl = URL.createObjectURL(file);

      setAdminData((prev) => ({ ...prev, profilePic: imageUrl }));

    }

  };



  // Save the profile locally and update the saved session user.
  // The current Express API does not yet have an endpoint to update user details.
  const handleSave = (e) => {
    e.preventDefault();

    const storage = localStorage.getItem("token") ? localStorage : sessionStorage;
    const currentUser = readLoggedInUser();
    const updatedUser = {
      ...currentUser,
      name: adminData.name.trim(),
      email: adminData.email.trim(),
      department: adminData.department.trim(),
    };

    storage.setItem("user", JSON.stringify(updatedUser));
    try {
      const rawSession = storage.getItem("panda_session");
      const session = rawSession ? JSON.parse(rawSession) : {};
      storage.setItem("panda_session", JSON.stringify({
        ...session,
        token: session.token || storage.getItem("token") || "",
        user: updatedUser,
      }));
    } catch {
      storage.setItem("panda_session", JSON.stringify({
        token: storage.getItem("token") || "",
        user: updatedUser,
      }));
    }

    const profileKey = `panda-profile:${updatedUser.employeeId || updatedUser.id || updatedUser.email || "current"}`;
    storage.setItem(profileKey, JSON.stringify({ profilePic: adminData.profilePic }));

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      if (onClose) onClose();
      else navigate("/home");
    }, 1000);
  };



  // Handle Cancel / Close

  const handleCancel = () => {

    if (onClose) onClose();

    else navigate("/home");

  };



  const handleSignOut = () => {
    logoutFromLocalStorage();
    navigate("/login", { replace: true });
  };



  return (

    <div className="settings-backdrop">

      <div className="settings-modal-card">

        {/* Header */}

        <div className="modal-header">

          <div className="header-left">

            <div className="header-icon-wrap">

              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.2">

                <circle cx="12" cy="12" r="3" />

                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />

              </svg>

            </div>

            <h2 className="modal-title">Account Settings & Profile</h2>

          </div>



          <button type="button" className="close-btn" onClick={handleCancel} title="Close">

            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">

              <line x1="18" y1="6" x2="6" y2="18" />

              <line x1="6" y1="6" x2="18" y2="18" />

            </svg>

          </button>

        </div>



        {/* Profile Picture Upload Section */}

        <div className="avatar-section">

          <div className="avatar-preview-wrap">

            <img src={adminData.profilePic} alt={adminData.name} className="avatar-preview" />

          </div>



          <div className="avatar-info">

            <h3 className="avatar-title">Profile Picture</h3>

            <p className="avatar-subtitle">Click photo to upload new picture (PNG, JPG, WebP).</p>



            <button

              type="button"

              className="browse-btn"

              onClick={() => fileInputRef.current && fileInputRef.current.click()}

            >

              Browse Image

            </button>

            <input

              type="file"

              ref={fileInputRef}

              onChange={handleImageUpload}

              accept="image/*"

              style={{ display: "none" }}

            />

          </div>

        </div>



        {/* Form Fields */}

        <form onSubmit={handleSave} className="settings-form">

          <div className="form-grid">

            {/* Field 1: Full Name */}

            <div className="field-block">

              <label className="field-label" htmlFor="name">

                Full Name

              </label>

              <input

                type="text"

                id="name"

                name="name"

                value={adminData.name}

                onChange={handleChange}

                className="text-input"

                required

              />

            </div>



            {/* Field 2: Work Email */}

            <div className="field-block">

              <label className="field-label" htmlFor="email">

                Work Email

              </label>

              <input

                type="email"

                id="email"

                name="email"

                value={adminData.email}

                onChange={handleChange}

                className="text-input"

                required

              />

            </div>



            {/* Field 3: Department */}

            <div className="field-block">

              <label className="field-label" htmlFor="department">

                Department

              </label>

              <input

                type="text"

                id="department"

                name="department"

                value={adminData.department}

                onChange={handleChange}

                className="text-input"

                required

              />

            </div>



            {/* Field 4: Account Role (Read Only / Highlighted) */}

            <div className="field-block">

              <label className="field-label" htmlFor="accessTier">

                Account Role

              </label>

              <input

                type="text"

                id="accessTier"

                name="accessTier"

                value={adminData.accessTier}

                readOnly

                className="text-input text-input-access"

              />

            </div>

          </div>



          {/* Footer Actions */}

          <div className="modal-footer">

            <button type="button" className="signout-btn" onClick={handleSignOut}>

              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">

                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />

                <polyline points="16 17 21 12 16 7" />

                <line x1="21" y1="12" x2="9" y2="12" />

              </svg>

              <span>Sign Out</span>

            </button>



            <div className="right-actions">

              <button type="button" className="cancel-btn" onClick={handleCancel}>

                Cancel

              </button>



              <button type="submit" className="save-btn">

                {savedSuccess ? "Saved Successfully!" : "Save Profile"}

              </button>

            </div>

          </div>

        </form>

      </div>



      {/* Scoped CSS with 100% Solid Hex Colors */}

      <style>{`

        * {

          box-sizing: border-box;

          margin: 0;

          padding: 0;

          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

        }



        .settings-backdrop {

          position: fixed;

          top: 0;

          left: 0;

          width: 100vw;

          height: 100vh;

          background-color: #030807;

          opacity: 0.98;

          display: flex;

          align-items: center;

          justify-content: center;

          padding: 20px;

          z-index: 9999;

        }



        .settings-modal-card {

          width: 100%;

          max-width: 580px;

          background-color: #0b1a18;

          border: 1px solid #144238;

          border-radius: 20px;

          padding: 24px 28px;

          box-shadow: 0 25px 50px #000000, 0 0 30px #062b24;

        }



        /* Header */

        .modal-header {

          display: flex;

          align-items: center;

          justify-content: space-between;

          margin-bottom: 22px;

        }



        .header-left {

          display: flex;

          align-items: center;

          gap: 10px;

        }



        .header-icon-wrap {

          display: flex;

          align-items: center;

          justify-content: center;

        }



        .modal-title {

          font-size: 16px;

          font-weight: 700;

          color: #ffffff;

          letter-spacing: -0.2px;

        }



        .close-btn {

          background: none;

          border: none;

          color: #64748b;

          cursor: pointer;

          display: flex;

          align-items: center;

          padding: 4px;

          border-radius: 6px;

          transition: color 0.15s ease;

        }



        .close-btn:hover {

          color: #ffffff;

        }



        /* Avatar Upload Section */

        .avatar-section {

          background-color: #081715;

          border: 1px solid #113831;

          border-radius: 14px;

          padding: 16px 20px;

          display: flex;

          align-items: center;

          gap: 18px;

          margin-bottom: 22px;

        }



        .avatar-preview-wrap {

          width: 66px;

          height: 66px;

          border-radius: 50%;

          border: 2px solid #10b981;

          overflow: hidden;

          flex-shrink: 0;

          box-shadow: 0 0 12px #0a382f;

        }



        .avatar-preview {

          width: 100%;

          height: 100%;

          object-fit: cover;

        }



        .avatar-info {

          display: flex;

          flex-direction: column;

          align-items: flex-start;

          gap: 4px;

        }



        .avatar-title {

          font-size: 14px;

          font-weight: 700;

          color: #ffffff;

        }



        .avatar-subtitle {

          font-size: 11px;

          color: #6d8e89;

          margin-bottom: 6px;

        }



        .browse-btn {

          background-color: #08211c;

          border: 1px solid #14493e;

          color: #34d399;

          font-size: 11px;

          font-weight: 700;

          padding: 6px 14px;

          border-radius: 8px;

          cursor: pointer;

          transition: background-color 0.2s ease, border-color 0.2s ease;

        }



        .browse-btn:hover {

          background-color: #0b2b25;

          border-color: #10b981;

        }



        /* Form Grid */

        .settings-form {

          display: flex;

          flex-direction: column;

          gap: 22px;

        }



        .form-grid {

          display: grid;

          grid-template-columns: 1fr 1fr;

          gap: 14px 18px;

        }



        .field-block {

          display: flex;

          flex-direction: column;

          gap: 6px;

          text-align: left;

        }



        .field-label {

          font-size: 11px;

          font-weight: 700;

          color: #648a84;

        }



        .text-input {

          width: 100%;

          background-color: #051311;

          border: 1px solid #133d36;

          border-radius: 10px;

          padding: 10px 14px;

          font-size: 13px;

          color: #ffffff;

          outline: none;

          transition: border-color 0.2s ease, box-shadow 0.2s ease;

        }



        .text-input:focus {

          border-color: #10b981;

          box-shadow: 0 0 10px #09382f;

        }



        .text-input-access {

          color: #10b981;

          font-weight: 700;

          cursor: default;

        }



        /* Modal Footer */

        .modal-footer {

          display: flex;

          align-items: center;

          justify-content: space-between;

          padding-top: 10px;

        }



        .signout-btn {

          display: flex;

          align-items: center;

          gap: 8px;

          background: none;

          border: none;

          color: #ef4444;

          font-size: 12px;

          font-weight: 600;

          cursor: pointer;

          padding: 6px 0;

          transition: opacity 0.15s ease;

        }



        .signout-btn:hover {

          opacity: 0.8;

        }



        .right-actions {

          display: flex;

          align-items: center;

          gap: 10px;

        }



        .cancel-btn {

          background-color: #081a17;

          border: 1px solid #14443c;

          color: #94a3b8;

          font-size: 12px;

          font-weight: 700;

          padding: 9px 18px;

          border-radius: 10px;

          cursor: pointer;

          transition: background-color 0.15s ease;

        }



        .cancel-btn:hover {

          background-color: #0d2924;

          color: #ffffff;

        }



        .save-btn {

          background-color: #10b981;

          border: none;

          color: #031411;

          font-size: 12px;

          font-weight: 800;

          padding: 9px 20px;

          border-radius: 10px;

          cursor: pointer;

          box-shadow: 0 4px 14px #0a3d32;

          transition: background-color 0.15s ease, transform 0.15s ease;

        }



        .save-btn:hover {

          background-color: #34d399;

          transform: translateY(-1px);

        }

      `}</style>

    </div>

  );

}