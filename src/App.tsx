import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import DashboardLayout from "./layouts/DashboardLayout";
import ComingSoon from "./pages/ComingSoon";
import Jurusan from "./pages/Jurusan";
import Classes from "./pages/Classes";
import Student from "./pages/Student";
import Item from "./pages/Item";

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

          <Route path="/bills" element={<ComingSoon />} />

          <Route path="/payments" element={<ComingSoon />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
