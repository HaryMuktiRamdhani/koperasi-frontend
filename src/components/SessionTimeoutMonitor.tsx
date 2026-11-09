import { useEffect, useRef, useState } from "react";
import api from "../services/api";

function SessionTimeoutMonitor() {
  const [timeoutMinutes, setTimeoutMinutes] = useState(60);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [remaining, setRemaining] = useState(0);
  const [open, setOpen] = useState(false);
  const lastSent = useRef(0);

  useEffect(() => {
    api.get<{ sessionTimeoutMinutes: number }>("/security/settings").then((response) => setTimeoutMinutes(response.data.sessionTimeoutMinutes)).catch(() => undefined);
  }, []);

  useEffect(() => {
    function activity() {
      const now = Date.now();
      if (now - lastSent.current < 30000) return;
      lastSent.current = now;
      setLastActivity(now);
    }
    window.addEventListener("mousedown", activity);
    window.addEventListener("keydown", activity);
    window.addEventListener("touchstart", activity);
    return () => {
      window.removeEventListener("mousedown", activity);
      window.removeEventListener("keydown", activity);
      window.removeEventListener("touchstart", activity);
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const limit = timeoutMinutes * 60000;
      const nextRemaining = Math.max(0, limit - (Date.now() - lastActivity));
      setRemaining(nextRemaining);
      const warning = timeoutMinutes === 15 ? 120000 : 60000;
      setOpen(nextRemaining > 0 && nextRemaining <= warning);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [lastActivity, timeoutMinutes]);

  async function keepAlive() {
    try {
      await api.post("/auth/session/keep-alive");
      setLastActivity(Date.now());
      setOpen(false);
    } catch { /* interceptor handles expired sessions */ }
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.assign("/");
  }

  if (!open) return null;
  const seconds = Math.ceil(remaining / 1000);
  return <div className="fixed inset-x-0 bottom-5 z-50 mx-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950 shadow-xl dark:border-amber-900 dark:bg-amber-950/90 dark:text-amber-100" role="dialog" aria-modal="true">
    <p className="font-semibold">Sesi akan segera berakhir</p>
    <p className="mt-1 text-sm">Sesi Anda berakhir dalam {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")} karena tidak ada aktivitas.</p>
    <div className="mt-3 flex justify-end gap-2"><button type="button" onClick={logout} className="cursor-pointer rounded-lg border border-amber-300 px-3 py-2 text-sm font-semibold dark:border-amber-700">Keluar</button><button type="button" onClick={() => void keepAlive()} className="cursor-pointer rounded-lg bg-[#168b87] px-3 py-2 text-sm font-semibold text-white">Tetap masuk</button></div>
  </div>;
}

export default SessionTimeoutMonitor;
