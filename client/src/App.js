import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import PrivateRoute from './components/PrivateRoute';
import PublicSign from './pages/PublicSign';
import SignDocument from './pages/SignDocument';

function LogoutButton({ setIsLoggedIn }) {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    navigate('/login');
  };
  return (
    <button onClick={handleLogout} className="ml-4 bg-red-500 text-white px-3 py-1 rounded">Logout</button>
  );
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow p-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            {/* Logo and App Name */}
            {/* Replace with your SVG or image logo */}
            <span className="inline-block align-middle">
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="4" fill="#7C3AED" fillOpacity="0.15"/><path d="M8 7h8M8 11h8M8 15h4" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round"/></svg>
            </span>
            <span className="text-2xl font-extrabold text-gray-900 tracking-tight">SignBuddy</span>
          </div>
          <nav>
            {isLoggedIn ? (
              <LogoutButton setIsLoggedIn={setIsLoggedIn} />
            ) : (
              <>
                <Link to="/login" className="mr-4 font-medium text-gray-700 hover:text-purple-700">Sign In</Link>
                <Link to="/register">
                  <button className="bg-gradient-to-r from-purple-500 to-purple-400 text-white font-semibold px-4 py-2 rounded-lg shadow hover:from-purple-600 hover:to-purple-500 transition">Get Started</button>
                </Link>
              </>
            )}
          </nav>
        </header>
        <main className="container mx-auto px-4">
          <Routes>
            <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/sign/:docId" element={<PrivateRoute><SignDocument /></PrivateRoute>} />
            <Route path="/public/sign/:token" element={<PublicSign />} />
            {/* Landing Page Route */}
            <Route path="/" element={
              <div className="flex flex-col items-center justify-center min-h-[70vh]">
                <h2 className="text-5xl font-extrabold text-gray-900 mb-4 text-center">Sign Your PDF</h2>
                <p className="text-lg text-gray-500 mb-8 text-center">Your tool to eSign documents.</p>
                <div className="w-full max-w-md flex flex-col items-center">
                  <button className="w-full bg-gradient-to-r from-purple-500 to-purple-400 text-white font-semibold text-lg py-4 rounded-xl shadow mb-2 hover:from-purple-600 hover:to-purple-500 transition">Select PDF file</button>
                  <span className="text-gray-400 mt-2">or drop PDF here</span>
                </div>
              </div>
            } />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App; 