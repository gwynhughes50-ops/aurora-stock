import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";

import Layout from "./layout/Layout";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Alerts from "./pages/Alerts";
import TemperatureLog from "./pages/TemperatureLog";
import AdminDashboard from "./pages/AdminDashboard";
import Reports from "./pages/Reports";

import Login from "./pages/Login";
import Register from "./pages/Register";

import Compliance from "./pages/Compliance";

import { AuthProvider } from "./contexts/AuthContext.jsx";

function AppRouter() {
  return (
    <Routes>
      {/* ✅ PUBLIC ROUTES (NO Layout) */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* ✅ APP ROUTES (WITH Layout) */}
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="temperature" element={<TemperatureLog />} />
        <Route path="admin/*" element={<AdminDashboard />} />
        <Route path="reports" element={<Reports />} />
        <Route path="compliance" element={<Compliance />} />
      </Route>

      {/* ✅ FALLBACK */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);



