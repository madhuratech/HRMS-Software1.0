import React, { useState, useEffect, useRef } from 'react';
import { User, Lock, Mail, CheckCircle, Loader2, Users, Briefcase, KeyRound, ShieldCheck, CheckCircle2, TrendingUp, ChevronDown, Check } from 'lucide-react';
import { apiFetch } from '../../lib/api';

export function Register({ onRegister, onLoginClick, onHomeClick }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Employee'); // 'Admin' | 'Employee'
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const roleDropdownRef = useRef(null);

  const roleOptions = [
    { value: 'Employee', label: 'Employee' },
    { value: 'Admin', label: 'Organization Admin' }
  ];

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Close custom dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(e.target)) {
        setIsRoleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Session & Verification States
  const [sessionId, setSessionId] = useState('');
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Handle 60s resend cooldown timer
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // Reset verification state if user edits Full Name or Email Address
  const handleNameChange = (e) => {
    setName(e.target.value);
    resetVerificationState();
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    resetVerificationState();
  };

  const resetVerificationState = () => {
    setEmailVerified(false);
    setVerifiedEmail('');
    setSessionId('');
    setOtpSent(false);
    setOtpCode('');
  };

  const handleVerifyEmailRequest = async () => {
    if (!name || !email) {
      setErrorMsg("Please enter Full Name and Company Email before verifying.");
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const data = await apiFetch('/auth/verify-email-request', {
        method: 'POST',
        body: JSON.stringify({ name, email, role })
      });

      if (data && data.success) {
        setSessionId(data.sessionId);
        setOtpSent(true);
        setCooldown(60);
        setSuccessMsg(data.message || "Verification code sent to your email!");
      } else {
        setErrorMsg((data && data.message) || "Unable to send verification email. Please try again.");
      }
    } catch (err) {
      console.error("Email verification request error:", err);
      setErrorMsg(err.message || "Unable to send verification email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmOtp = async () => {
    if (!otpCode || otpCode.length < 4) {
      setErrorMsg("Please enter the complete verification code sent to your email.");
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const data = await apiFetch('/auth/verify-email-confirm', {
        method: 'POST',
        body: JSON.stringify({ email, sessionId, otp: otpCode })
      });

      if (data && data.success) {
        setEmailVerified(true);
        setVerifiedEmail(email);
        setOtpSent(false);
        setSuccessMsg("Email successfully verified ✓");
      } else {
        setErrorMsg((data && data.message) || "Invalid or expired verification code.");
      }
    } catch (err) {
      console.error("OTP verification error:", err);
      setErrorMsg(err.message || "Invalid or expired verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRegister = async (e) => {
    e.preventDefault();
    if (!emailVerified || email.trim().toLowerCase() !== verifiedEmail.trim().toLowerCase()) {
      setErrorMsg("Please verify your email address before creating an account.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match. Please verify.");
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const data = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, role, password, confirmPassword, sessionId })
      });

      if (data && data.success) {
        setSuccessMsg(data.message || "Account Created Successfully ✓ Redirecting to login...");
        setTimeout(() => {
          onLoginClick();
        }, 1500);
      } else {
        setErrorMsg((data && data.message) || "Registration failed. Please try again.");
      }
    } catch (err) {
      console.error("Account registration error:", err);
      setErrorMsg(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isVerifiedForCurrentEmail = emailVerified && email.trim().toLowerCase() === verifiedEmail.trim().toLowerCase();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-900 flex items-center justify-center p-4 py-8">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row my-auto">
        
        {/* Left Side - Brand & Info */}
        <div className="md:w-1/2 bg-blue-600 p-8 sm:p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')] bg-cover bg-center opacity-10 pointer-events-none"></div>
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600/90 to-indigo-900/90 pointer-events-none"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-blue-600 shadow-md">
                <TrendingUp size={24} />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Madhura HRMS</h1>
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold mb-4 leading-tight">
              Modernize Your HR & Team Management
            </h2>
            <p className="text-blue-100 text-base leading-relaxed">
              Join thousands of businesses managing attendance, automated payroll, multi-tier approvals, and talent performance with ease.
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-2 gap-4 mt-8">
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20">
              <ShieldCheck className="mb-2 text-blue-200" />
              <h3 className="font-bold">Instant Setup</h3>
              <p className="text-xs text-blue-100">Ready in under 24 hrs</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20">
              <CheckCircle2 className="mb-2 text-blue-200" />
              <h3 className="font-bold">100% Compliant</h3>
              <p className="text-xs text-blue-100">PF, ESI & TDS enabled</p>
            </div>
          </div>
        </div>

        {/* Right Side - Registration Form */}
        <div className="md:w-1/2 p-8 sm:p-12 bg-white flex flex-col justify-center">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-1">Create Account</h2>
            <p className="text-sm text-slate-500">Register your business credentials to get started.</p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmitRegister} className="space-y-4">
            
            {/* Full Name */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                <input
                  type="text"
                  value={name}
                  onChange={handleNameChange}
                  disabled={isVerifiedForCurrentEmail}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all disabled:opacity-60"
                  placeholder="Enter your full name"
                  required />
              </div>
            </div>

            {/* Company Email Address */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Company Email</label>
                {isVerifiedForCurrentEmail && (
                  <span className="text-emerald-600 text-xs font-bold flex items-center gap-1 normal-case">
                    <CheckCircle size={13} /> Verified
                  </span>
                )}
              </div>
              <div className="relative flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    disabled={isVerifiedForCurrentEmail}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all disabled:opacity-60"
                    placeholder="name@company.com"
                    required />
                </div>
                {!isVerifiedForCurrentEmail && !otpSent && (
                  <button
                    type="button"
                    onClick={handleVerifyEmailRequest}
                    disabled={loading || !name || !email}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold rounded-lg transition-all shadow-sm shrink-0 flex items-center justify-center min-w-[105px]"
                  >
                    {loading ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'Verify Email'}
                  </button>
                )}
              </div>
            </div>

            {/* OTP Code Entry UI */}
            {otpSent && !isVerifiedForCurrentEmail && (
              <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl space-y-2.5 animate-in fade-in">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                  <KeyRound size={15} className="text-blue-600" />
                  <span>Enter 6-Digit OTP sent to {email}</span>
                </div>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2 bg-white border border-blue-300 rounded-lg text-center font-mono font-bold tracking-widest text-base focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="• • • • • •"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleConfirmOtp}
                    disabled={loading || otpCode.length < 4}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-lg transition-all shrink-0 flex items-center justify-center"
                  >
                    {loading ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'Confirm OTP'}
                  </button>
                </div>

                <div className="flex justify-between items-center text-[11px] text-slate-500">
                  <span>Didn't receive email? Check spam.</span>
                  {cooldown > 0 ? (
                    <span className="font-semibold text-slate-600">Resend in {cooldown}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleVerifyEmailRequest}
                      className="font-bold text-blue-600 hover:underline"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Account Role (Custom Dropdown UI) */}
            <div className="space-y-2" ref={roleDropdownRef}>
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">Account Role</label>
              <div className="relative">
                <button
                  type="button"
                  disabled={isVerifiedForCurrentEmail}
                  onClick={() => !isVerifiedForCurrentEmail && setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                  className={`w-full pl-10 pr-10 py-2.5 bg-slate-50 border rounded-lg text-sm text-left transition-all flex items-center justify-between disabled:opacity-60 cursor-pointer ${
                    isRoleDropdownOpen 
                      ? 'border-blue-500 ring-2 ring-blue-500 bg-white' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="text-slate-800 font-medium">
                    {role === 'Admin' ? 'Organization Admin' : 'Employee'}
                  </span>
                </button>
                <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" size={18} />
                <ChevronDown className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none transition-transform duration-200 ${isRoleDropdownOpen ? 'rotate-180 text-blue-600' : ''}`} size={16} />

                {/* Floating Custom Options Menu */}
                {isRoleDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5 overflow-hidden animate-in fade-in">
                    {roleOptions.map((opt) => {
                      const isSelected = role === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setRole(opt.value);
                            setIsRoleDropdownOpen(false);
                          }}
                          className={`w-full px-4 py-2.5 text-sm text-left flex items-center justify-between transition-colors ${
                            isSelected
                              ? 'bg-blue-50 text-blue-600 font-semibold'
                              : 'text-slate-700 hover:bg-slate-50 hover:text-blue-600'
                          }`}
                        >
                          <span>{opt.label}</span>
                          {isSelected && <Check size={16} className="text-blue-600" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Password (Full Width Straight Down) */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={!isVerifiedForCurrentEmail}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all disabled:opacity-50"
                  placeholder="Min 6 characters"
                  required />
              </div>
            </div>

            {/* Confirm Password (Full Width Straight Down) */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={!isVerifiedForCurrentEmail}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all disabled:opacity-50"
                  placeholder="Confirm password"
                  required />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !isVerifiedForCurrentEmail}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 mt-4 text-sm"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : 'Create Account & Start Trial'}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              Already have an account?{' '}
              <button
                type="button"
                onClick={onLoginClick}
                className="text-blue-600 font-bold hover:underline"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}