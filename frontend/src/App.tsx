import { Routes, Route, Navigate } from "react-router-dom";
import { Web3Provider } from "@/providers/Web3Provider";
import { ToastContainer } from "@/components/toast/ToastContainer";
import { ModalProvider, ModalContainer } from "@/components/modal";
import { AppShell } from "@/components/layout/AppShell";
import { StitchDashboardPage } from "@/pages/StitchDashboardPage";
import { StitchAssetsPage } from "@/pages/StitchAssetsPage";
import { StitchLendingPage } from "@/pages/StitchLendingPage";
import { BorrowPage } from "@/pages/BorrowPage";
import { RepayPage } from "@/pages/RepayPage";
import { LockPage } from "@/pages/LockPage";
import { LiquidationsPage } from "@/pages/LiquidationsPage";

export default function App() {
  return (
    <Web3Provider>
      <ModalProvider>
        <ModalContainer />
        <ToastContainer />
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<StitchDashboardPage />} />
            <Route path="/dashboard" element={<Navigate to="/" replace />} />
            <Route path="/assets" element={<StitchAssetsPage />} />
            <Route path="/lending" element={<StitchLendingPage />} />
            <Route path="/borrow" element={<BorrowPage />} />
            <Route path="/repay" element={<RepayPage />} />
            <Route path="/lock" element={<LockPage />} />
            <Route path="/liquidations" element={<LiquidationsPage />} />
          </Route>
        </Routes>
      </ModalProvider>
    </Web3Provider>
  );
}
