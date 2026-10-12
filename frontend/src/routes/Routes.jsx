import React from "react";
import {
  createBrowserRouter,
  Navigate,
  Link,
} from "react-router-dom";

// Pages
import Home from "../commonpages/Home";
import Login from "../commonpages/Login";
import EmployeeDashboard from "../commonpages/EmployeeDashboard";

// Protected Routing
import Pvtrouting from "./Pvtrouting";
import RoleBasedRoute from "../componenet/RoleBasedRoute";

// Common Layout
import MainLayout from "../Layouts/Layout";

// Other Pages
import Settings from "../componenet/Settings";
import Attendance from "../componenet/Attendance";
import Leave from "../componenet/Leave";

// Placeholder for pages not created yet
function PagePlaceholder({ title }) {
  return (
    <section className="w-full min-w-0">
      <h1 className="text-2xl font-bold text-emerald-500">
        {title}
      </h1>

      <p className="mt-3 text-sm text-slate-500">
        Panda Workspace · Infotech Platform
      </p>

      <Link
        to="/home"
        className="mt-6 inline-block text-sm font-medium text-emerald-500 hover:underline"
      >
        ← Back to Dashboard
      </Link>
    </section>
  );
}

// Main Router
export const Routes = createBrowserRouter([
  // Root Route
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },

  // Public Login Route
  {
    path: "/login",
    element: <Login />,
  },

  // Protected Layout
  {
    element: (
      <Pvtrouting>
        <MainLayout />
      </Pvtrouting>
    ),

    children: [
      // Admin Dashboard
      {
        path: "home",
        element: (
          <RoleBasedRoute requiredRole="admin">
            <Home />
          </RoleBasedRoute>
        ),
      },

      // Admin Dashboard Alternative Route
      {
        path: "admin/dashboard",
        element: (
          <RoleBasedRoute requiredRole="admin">
            <Home />
          </RoleBasedRoute>
        ),
      },

      // Employee Dashboard
      {
        path: "employee/dashboard",
        element: (
          <RoleBasedRoute requiredRole="employee">
            <EmployeeDashboard />
          </RoleBasedRoute>
        ),
      },

      // Tasks
      {
        path: "tasks",
        element: (
          <PagePlaceholder title="Tasks & Workflows" />
        ),
      },

      // Employees
      {
        path: "employees",
        element: (
          <PagePlaceholder title="Employee Directory" />
        ),
      },

      // Chat
      {
        path: "chat",
        element: (
          <PagePlaceholder title="Chat & Calls" />
        ),
      },

      // Projects
      {
        path: "projects",
        element: (
          <PagePlaceholder title="Projects" />
        ),
      },

      // Teams
      {
        path: "teams",
        element: (
          <PagePlaceholder title="Teams" />
        ),
      },

      // Settings
      {
        path: "settings",
        element: <Settings />,
      },

      // Attendance
      {
        path: "attendance",
        element: <Attendance />,
      },

      // Leave
      {
        path: "leave",
        element: <Leave />,
      },

      // Admin Control Center
      {
        path: "control-center",
        element: (
          <RoleBasedRoute requiredRole="admin">
            <PagePlaceholder
              title="Super Admin Control Center"
            />
          </RoleBasedRoute>
        ),
      },
    ],
  },

  // Invalid Route
  {
    path: "*",
    element: <Navigate to="/login" replace />,
  },
]);

export default Routes;