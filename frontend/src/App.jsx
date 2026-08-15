import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TopBar from './components/TopBar';
import BottomNav from './components/BottomNav';
import SpeedDialFab from './components/SpeedDialFab';
import { ToastProvider } from './components/Toast';
import Dashboard from './pages/Dashboard';
import DailyOperations from './pages/DailyOperations';
import Reporting from './pages/Reporting';
import MasterDatabase from './pages/MasterDatabase';
import Settings from './pages/Settings';
import DashboardCustomize from './pages/DashboardCustomize';
import LeadDetail from './pages/LeadDetail';
import LoanFileDetail from './pages/LoanFileDetail';
import ChecklistRules from './pages/ChecklistRules';
import EligibilityRules from './pages/EligibilityRules';
import AuditLog from './pages/AuditLog';

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <div className="max-w-[420px] mx-auto app-frame bg-canvas relative shadow-[0_0_40px_rgba(0,0,0,0.08)]">
          <TopBar />
          <div className="relative">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/daily-operations" element={<DailyOperations />} />
              <Route path="/reporting" element={<Reporting />} />
              <Route path="/master-database" element={<MasterDatabase />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/settings/dashboard-customization" element={<DashboardCustomize />} />
              <Route path="/settings/checklist-rules" element={<ChecklistRules />} />
              <Route path="/settings/eligibility-rules" element={<EligibilityRules />} />
              <Route path="/settings/audit-log" element={<AuditLog />} />
              <Route path="/leads/:id" element={<LeadDetail />} />
              <Route path="/loan-files/:id" element={<LoanFileDetail />} />
            </Routes>
          </div>
          <SpeedDialFab />
          <BottomNav />
        </div>
      </BrowserRouter>
    </ToastProvider>
  );
}
