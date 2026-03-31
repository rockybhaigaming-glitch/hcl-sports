import { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "@/pages/Login";
import UserDashboard from "@/pages/UserDashboard";
import MyBookings from "@/pages/MyBookings";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminBookings from "@/pages/AdminBookings";
import AdminSlots from "@/pages/AdminSlots";
import AdminReports from "@/pages/AdminReports";
import { Toaster } from "@/components/ui/sonner";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const employeeId = localStorage.getItem("employee_id");
    const employeeName = localStorage.getItem("employee_name");
    const isAdmin = localStorage.getItem("is_admin") === "true";

    if (token && employeeId) {
      setUser({ token, employee_id: employeeId, employee_name: employeeName, is_admin: isAdmin });
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem("token", userData.token);
    localStorage.setItem("employee_id", userData.employee_id);
    localStorage.setItem("employee_name", userData.employee_name);
    localStorage.setItem("is_admin", userData.is_admin);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.clear();
  };

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to={user.is_admin ? "/admin" : "/dashboard"} />} />
          <Route path="/dashboard" element={user && !user.is_admin ? <UserDashboard user={user} onLogout={handleLogout} /> : <Navigate to="/" />} />
          <Route path="/my-bookings" element={user && !user.is_admin ? <MyBookings user={user} onLogout={handleLogout} /> : <Navigate to="/" />} />
          <Route path="/admin" element={user && user.is_admin ? <AdminDashboard user={user} onLogout={handleLogout} /> : <Navigate to="/" />} />
          <Route path="/admin/bookings" element={user && user.is_admin ? <AdminBookings user={user} onLogout={handleLogout} /> : <Navigate to="/" />} />
          <Route path="/admin/slots" element={user && user.is_admin ? <AdminSlots user={user} onLogout={handleLogout} /> : <Navigate to="/" />} />
          <Route path="/admin/reports" element={user && user.is_admin ? <AdminReports user={user} onLogout={handleLogout} /> : <Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;