import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, ProtectedRoute } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CustomCursor from './components/CustomCursor';
import Home from './pages/Home';
import Consultation from './pages/Consultation';
import MyConsultations from './pages/MyConsultations';
import ScanPrescription from './pages/ScanPrescription';
import QueryBot from './pages/QueryBot';
import StoreLocator from './pages/StoreLocator';
import LoginPage from './pages/Login/Login';
import './styles/global.css';

function AppLayout({ children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        {children}
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <CustomCursor />
      <Routes>
        {/* Public */}
        <Route path="/" element={<AppLayout><Home /></AppLayout>} />
        <Route path="/store-locator" element={<AppLayout><StoreLocator /></AppLayout>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/:path" element={<Navigate to="/login" replace />} />

        {/* Protected */}
        <Route path="/consultation" element={<AppLayout><ProtectedRoute><Consultation /></ProtectedRoute></AppLayout>} />
        <Route path="/my-consultations" element={<AppLayout><ProtectedRoute><MyConsultations /></ProtectedRoute></AppLayout>} />
        <Route path="/scan-prescription" element={<AppLayout><ProtectedRoute><ScanPrescription /></ProtectedRoute></AppLayout>} />
        <Route path="/query-bot" element={<AppLayout><ProtectedRoute><QueryBot /></ProtectedRoute></AppLayout>} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
