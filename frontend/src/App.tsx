import { Routes, Route, Navigate } from "react-router-dom";
import { Web3Provider } from "@/providers/Web3Provider";
import { ToastContainer } from "@/components/toast/ToastContainer";
import { ModalProvider, ModalContainer } from "@/components/modal";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardPage } from "@/pages/DashboardPage";

const demoMode = String(import.meta.env.VITE_DEMO_MODE || "").toLowerCase() === "true";

export default function App() {
  if (demoMode) {
    return (
      <Web3Provider>
        <ModalProvider>
          <ModalContainer />
          <ToastContainer />
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ModalProvider>
      </Web3Provider>
    );
  }

  return (
    <Web3Provider>
      <ModalProvider>
        <ModalContainer />
        <ToastContainer />
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </ModalProvider>
    </Web3Provider>
  );
}
