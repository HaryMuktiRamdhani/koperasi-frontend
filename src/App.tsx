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

function App() {
  const token = localStorage.getItem("token");

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
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
