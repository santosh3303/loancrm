import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Leads from './pages/Leads';
import LeadDetail from './pages/LeadDetail';
import LoanFiles from './pages/LoanFiles';
import LoanFileDetail from './pages/LoanFileDetail';
import Contacts from './pages/Contacts';
import Reports from './pages/Reports';
import ChecklistRules from './pages/ChecklistRules';
import EligibilityRules from './pages/EligibilityRules';
import AuditLog from './pages/AuditLog';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-canvas flex flex-col md:flex-row">
        <Sidebar />
        <main className="flex-1 min-w-0">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/leads" element={<Leads />} />
            <Route path="/leads/:id" element={<LeadDetail />} />
            <Route path="/loan-files" element={<LoanFiles />} />
            <Route path="/loan-files/:id" element={<LoanFileDetail />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/checklist-rules" element={<ChecklistRules />} />
            <Route path="/eligibility-rules" element={<EligibilityRules />} />
            <Route path="/audit-log" element={<AuditLog />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
