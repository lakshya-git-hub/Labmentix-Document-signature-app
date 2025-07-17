import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../utils/api';

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await apiRequest('/auth/register', 'POST', { name, email, password });
      // Registration successful, now login
      const data = await apiRequest('/auth/login', 'POST', { email, password });
      localStorage.setItem('token', data.token);
      if (data.user && data.user.name) {
        localStorage.setItem('userName', data.user.name);
      }
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
        <h2 className="text-2xl font-bold mb-2 text-center">Create your account</h2>
        {error && <div className="text-red-500 mb-2 text-center">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="#A0AEC0"/></svg>
            </span>
            <input
              type="text"
              placeholder="Full Name"
              className="w-full border border-gray-300 p-3 pl-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 2l-8 5-8-5" fill="#A0AEC0"/></svg>
            </span>
            <input
              type="email"
              placeholder="Email address"
              className="w-full border border-gray-300 p-3 pl-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M12 17a2 2 0 100-4 2 2 0 000 4zm6-2V9a6 6 0 10-12 0v6a2 2 0 002 2h8a2 2 0 002-2z" fill="#A0AEC0"/></svg>
            </span>
            <input
              type="password"
              placeholder="Password"
              className="w-full border border-gray-300 p-3 pl-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="w-full bg-gradient-to-r from-purple-500 to-purple-400 text-white font-semibold text-lg py-3 rounded-lg shadow hover:from-purple-600 hover:to-purple-500 transition">Create account</button>
        </form>
        <div className="mt-6 text-center text-gray-500 text-sm">
          Already have an account? <a href="/login" className="text-purple-600 font-semibold hover:underline">Sign in</a>
        </div>
      </div>
    </div>
  );
}

export default Register; 