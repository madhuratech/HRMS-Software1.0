import React, { useState } from 'react';
import { User, Lock, ArrowRight, ShieldCheck, TrendingUp, Wrench } from 'lucide-react';
import { apiFetch } from '../../lib/api';

export function Login({ onLogin, onRegisterClick }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginType, setLoginType] = useState('admin'); // 'admin' | 'employee'
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Keep the same visual "selectedRole" state for button active styling
  const selectedRole = loginType === 'admin' ? 'SUPER_ADMIN' : 'EMPLOYEE';

  const handleRoleClick = (type, emailPreset) => {
    setLoginType(type);
    const knownPresets = ['admin@hawkeye.com', 'madhuratechcbe@gmail.com', 'dhilipanmadhuratech@gmail.com', 'muthu@gmail.com'];
    if (!email || knownPresets.includes(email.trim().toLowerCase())) {
      setEmail(emailPreset);
      setPassword('Admin@123');
    }
    setErrorMsg('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      // Send selectedRole so the backend can validate it against the actual account role
      const selectedRole = loginType === 'admin' ? 'admin' : loginType;
      // Attempt real backend authentication
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, selectedRole })
      });

      if (data && data.success && data.user) {
        // Backend resolved the actual role and employee ID
        const userPayload = {
          ...data.user,
          token: data.token,
          permissions: data.permissions
        };
        onLogin(data.user.role, data.user.name, userPayload);
        return;
      } else if (data && data.message && !data.message.toLowerCase().includes('fetch') && !data.message.toLowerCase().includes('network')) {
        setErrorMsg(data.message);
        return;
      }
    } catch (err) {
      console.error('Login error:', err);
      // Show the backend-returned error message (e.g., role mismatch, invalid credentials)
      if (err.message) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Unable to connect to the server. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">

        {/* Left Side - Brand & Info */}
        <div className="md:w-1/2 bg-blue-600 p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')] bg-cover bg-center opacity-10"></div>
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600/90 to-indigo-900/90"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-blue-600">
                <TrendingUp size={24} />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">HAWKEYE NEST</h1>
            </div>
            <h2 className="text-4xl font-bold mb-4">Enterprise Management Solution</h2>
            <p className="text-blue-100 text-lg leading-relaxed">
              Unified platform for HR, Sales, and Service management across all your branches.
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-2 gap-4 mt-8">
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20">
              <ShieldCheck className="mb-2 text-blue-200" />
              <h3 className="font-bold">Role Based</h3>
              <p className="text-xs text-blue-100">Secure access control</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20">
              <Wrench className="mb-2 text-blue-200" />
              <h3 className="font-bold">Service Ops</h3>
              <p className="text-xs text-blue-100">Job card tracking</p>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="md:w-1/2 p-12 bg-white flex flex-col justify-center">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome back</h2>
            <p className="text-slate-500">Please choose your role and sign in.</p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Role — Admin and Employee (includes Team Leaders & Staff) */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Role</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleRoleClick('admin', 'madhuratechcbe@gmail.com')}
                  className={`w-full py-3 px-4 rounded-xl border-2 text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 ${
                    selectedRole === 'SUPER_ADMIN'
                      ? 'border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-200'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600'
                  }`}>
                  <ShieldCheck size={16} />
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleClick('employee', 'dhilipanmadhuratech@gmail.com')}
                  className={`w-full py-3 px-4 rounded-xl border-2 text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 ${
                    selectedRole === 'EMPLOYEE'
                      ? 'border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-200'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600'
                  }`}>
                  <User size={16} />
                  Employee
                </button>
              </div>
              <p className="text-xs text-slate-400 text-center">
                Employee option supports Staff and Team Leader logins
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Email Address</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                    placeholder="name@company.com"
                    required />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                    placeholder="••••••••"
                    required />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
              {loading ? 'Signing in...' : <>Sign In to Dashboard <ArrowRight size={18} /></>}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500">
              Don't have an account?{' '}
              <button
                onClick={onRegisterClick}
                className="text-blue-600 font-bold hover:underline">
                Create Account
              </button>
            </p>
          </div>

          <p className="mt-8 text-center text-xs text-slate-400">
            © 2026 HAWKEYE NEST. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}