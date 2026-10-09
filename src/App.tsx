import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import DashboardLayout from "./layouts/DashboardLayout";
import Jurusan from "./pages/Jurusan";
import Classes from "./pages/Kelas";
import Student from "./pages/Student";
import Item from "./pages/Item";
import Bill from "./pages/Bill";
import Payment from "./pages/Payment";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Help from "./pages/Help";
import Users from "./pages/Users";

function App() {
  const token = localStorage.getItem("token");
  let role = "";
  try {
    const storedUser = localStorage.getItem("user");
    if (storedUser) role = (JSON.parse(storedUser) as { role?: string }).role || "";
  } catch {
    role = "";
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route element={token ? <DashboardLayout /> : <Navigate to="/" />}>
          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/jurusan" element={<Jurusan />} />

          <Route path="/classes" element={<Classes />} />

          <Route path="/students" element={<Student />} />

          <Route path="/items" element={<Item />} />

          <Route path="/bills" element={<Bill />} />

          <Route path="/payments" element={<Payment />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/help" element={<Help />} />
          <Route path="/users" element={role === "admin" ? <Users /> : <Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
