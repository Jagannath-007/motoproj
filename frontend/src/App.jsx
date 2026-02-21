import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './index.css';
import { USERS } from './users';

import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import LeadListing from './pages/LeadListing';
import LeadDetails from './pages/LeadDetails';
import LeadManagement from './pages/LeadManagement';
import Dashboard from './pages/Dashboard';

export const UserContext = React.createContext(null);

export default function App() {
    const [currentUser, setCurrentUser] = useState(USERS.sales);

    return (
        <UserContext.Provider value={{ currentUser, setCurrentUser }}>
            <BrowserRouter>
                <div className="app-shell">
                    <Sidebar />
                    <div className="main-area">
                        <Topbar />
                        <main className="content-area">
                            <Routes>
                                <Route path="/" element={<Navigate to="/leads" replace />} />
                                <Route path="/leads" element={<LeadListing />} />
                                <Route path="/leads/:id" element={<LeadDetails />} />
                                <Route path="/lead-management" element={<LeadManagement />} />
                                <Route path="/dashboard" element={<Dashboard key={currentUser.role} />} />
                            </Routes>
                        </main>
                    </div>
                </div>
                <Toaster
                    position="bottom-right"
                    toastOptions={{
                        style: {
                            background: '#FFFFFF',
                            color: '#111827',
                            border: '1px solid #E2E6ED',
                            fontSize: '13px',
                            fontFamily: 'Inter, sans-serif',
                            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -2px rgba(0,0,0,0.04)',
                            borderRadius: '8px',
                        },
                        success: { iconTheme: { primary: '#16A34A', secondary: '#DCFCE7' } },
                        error: { iconTheme: { primary: '#DC2626', secondary: '#FEE2E2' } },
                    }}
                />
            </BrowserRouter>
        </UserContext.Provider>
    );
}
