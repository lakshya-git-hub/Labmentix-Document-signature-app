import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../utils/api';

function Login({ setIsLoggedIn }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const data = await apiRequest('/auth/login', 'POST', { email, password });
      localStorage.setItem('token', data.token);
      if (data.user && data.user.name) {
        localStorage.setItem('userName', data.user.name);
      }
      setIsLoggedIn && setIsLoggedIn(true);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 shadow-xl rounded-xl">
        <div className="flex flex-col items-center mb-6">
          <span className="inline-block mb-2">
            <svg width="40" height="40" fill="none" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="4" fill="#7C3AED" fillOpacity="0.15"/><path d="M8 7h8M8 11h8M8 15h4" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round"/></svg>
          </span>
          <span className="text-2xl font-extrabold text-gray-900 tracking-tight">SignBuddy</span>
        </div>
        <h2 className="text-2xl font-bold mb-2 text-center">Sign in to your account</h2>
        {error && <div className="text-red-500 mb-2 text-center">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <input
            type="email"
            placeholder="Email address"
            className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="w-full bg-gradient-to-r from-purple-500 to-purple-400 text-white font-semibold text-lg py-3 rounded-lg shadow hover:from-purple-600 hover:to-purple-500 transition">Sign In</button>
        </form>
        <div className="mt-6 text-center text-gray-500 text-sm">
          Don't have an account? <a href="/register" className="text-purple-600 font-semibold hover:underline">Create account</a>
        </div>
      </div>
    </div>
  );
}

export default Login; 