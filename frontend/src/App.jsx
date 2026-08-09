import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import LeadDetail from './pages/LeadDetail';
import LoanFiles from './pages/LoanFiles';
import LoanFileDetail from './pages/LoanFileDetail';
import Contacts from './pages/Contacts';
import Reports from './pages/Reports';
import ChecklistRules from './pages/ChecklistRules';
import EligibilityRules from './pages/EligibilityRules';
import AuditLog from './pages/AuditLog';

const navItem = ({ isActive }) =>
  `px-3 py-2 rounded-md text-sm ${isActive ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`;

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <nav className="bg-white border-b px-4 py-2 flex gap-1 items-center flex-wrap">
          <span className="font-semibold text-blue-700 mr-4">Loan CRM</span>
          <NavLink to="/" end className={navItem}>Dashboard</NavLink>
          <NavLink to="/leads" className={navItem}>Leads</NavLink>
          <NavLink to="/loan-files" className={navItem}>Loan Files</NavLink>
          <NavLink to="/contacts" className={navItem}>Contacts</NavLink>
          <NavLink to="/reports" className={navItem}>Reports</NavLink>
          <NavLink to="/checklist-rules" className={navItem}>Checklist Rules</NavLink>
          <NavLink to="/eligibility-rules" className={navItem}>Eligibility Rules</NavLink>
          <NavLink to="/audit-log" className={navItem}>Change History</NavLink>
        </nav>
        <Routes>
          <Route path="/" element={<Dashboard />} />
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
      </div>
    </BrowserRouter>
  );
}
