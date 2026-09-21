import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Mail, ShieldCheck, CheckCircle2, Loader2, ArrowLeft, RefreshCw, KeyRound, AlertCircle, Award, Info } from 'lucide-react';
import { apiFetch } from '../../lib/api';

export function AdminManagerRegister({ isModal = false, onClose }) {
  const navigate = useNavigate();

  // Wizard Steps: 'FORM' | 'OTP' | 'SUCCESS'
  const [step, setStep] = useState('FORM');

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '', // Login Email for the new Admin/Manager account
    role: 'Admin', // Options: 'Admin' | 'Manager'
    password: '',
    confirmPassword: ''
  });

  // OTP Verification State
  const [sessionId, setSessionId] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [otpExpiry, setOtpExpiry] = useState(300); // 5-minute expiry (300 seconds)

  // UI State
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Cooldown Countdown Timer (60 seconds)
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // OTP Expiry Timer (5 minutes / 300 seconds)
  useEffect(() => {
    let timer;
    if (step === 'OTP' && otpExpiry > 0) {
      timer = setInterval(() => {
        setOtpExpiry((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, otpExpiry]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrorMsg('');
  };

  // Format expiry time mm:ss
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  /**
   * Step 1: Submit Form -> Validate Details & Request OTP sent to fixed SMTP_USER
   */
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Field Validations
    if (!formData.fullName.trim()) {
      setErrorMsg("Please enter Full Name.");
      return;
    }
    if (!formData.email.trim()) {
      setErrorMsg("Please enter Login Email.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setErrorMsg("Please enter a valid Login Email address.");
      return;
    }

    if (formData.role !== 'Admin' && formData.role !== 'Manager') {
      setErrorMsg("Role must be Admin or Manager.");
      return;
    }

    if (!formData.password) {
      setErrorMsg("Please enter Password.");
      return;
    }

    if (formData.password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg("Password and Confirm Password do not match.");
      return;
    }

    setLoading(true);

    try {
      const data = await apiFetch('/auth/admin-register/send-otp', {
        method: 'POST',
        body: JSON.stringify({
          fullName: formData.fullName.trim(),
          email: formData.email.trim().toLowerCase(),
          role: formData.role,
          password: formData.password,
          confirmPassword: formData.confirmPassword
        })
      });

      if (data && data.success) {
        setSessionId(data.sessionId);
        setStep('OTP');
        setCooldown(60);
        setOtpExpiry(300); // 5 minutes
        setSuccessMsg(data.message || "Verification OTP has been sent to the administrator email.");
      } else {
        setErrorMsg((data && data.message) || "Failed to send OTP. Please try again.");
      }
    } catch (err) {
      console.error("sendOtp Error:", err);
      setErrorMsg(err.message || "Login email address may already be registered.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Step 2: Resend OTP to fixed SMTP_USER
   */
  const handleResendOtp = async () => {
    if (cooldown > 0) return;
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const data = await apiFetch('/auth/admin-register/resend-otp', {
        method: 'POST',
        body: JSON.stringify({
          sessionId,
          email: formData.email.trim().toLowerCase()
        })
      });

      if (data && data.success) {
        setCooldown(60);
        setOtpExpiry(300); // 5 minutes
        setSuccessMsg(data.message || "A new OTP code has been sent to administrator email.");
      } else {
        setErrorMsg((data && data.message) || "Failed to resend OTP.");
      }
    } catch (err) {
      console.error("resendOtp Error:", err);
      setErrorMsg(err.message || "Failed to resend OTP code.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Step 3: Verify OTP & Create Account
   */
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length < 6) {
      setErrorMsg("Please enter the complete 6-digit OTP code.");
      return;
    }

    if (otpExpiry <= 0) {
      setErrorMsg("OTP has expired. Please click Resend OTP.");
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const data = await apiFetch('/auth/admin-register/verify-otp', {
        method: 'POST',
        body: JSON.stringify({
          sessionId,
          email: formData.email.trim().toLowerCase(),
          otp: otpCode.trim()
        })
      });

      if (data && data.success) {
        setStep('SUCCESS');
        setSuccessMsg("Registration Successful ✓ Account Created.");
      } else {
        setErrorMsg((data && data.message) || "Invalid OTP code. Please check with the administrator.");
      }
    } catch (err) {
      console.error("verifyOtp Error:", err);
      setErrorMsg(err.message || "Invalid or expired OTP code.");
    } finally {
      setLoading(false);
    }
  };

  const handleRedirectLogin = () => {
    if (onClose) onClose();
    navigate('/login');
  };

  return (
    <div className={isModal ? "" : "min-h-screen bg-slate-50 flex items-center justify-center p-4 py-8"}>
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden transition-all">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 p-6 text-white relative">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <ShieldCheck size={26} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Admin & Manager Registration</h2>
              <p className="text-xs text-blue-100 mt-0.5">Authorized Account Registration (OTP sent to SMTP_USER)</p>
            </div>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center gap-2 mt-5">
            <div className={`h-1.5 flex-1 rounded-full transition-colors ${step === 'FORM' ? 'bg-white' : 'bg-white/40'}`} />
            <div className={`h-1.5 flex-1 rounded-full transition-colors ${step === 'OTP' ? 'bg-white' : step === 'SUCCESS' ? 'bg-white' : 'bg-white/20'}`} />
            <div className={`h-1.5 flex-1 rounded-full transition-colors ${step === 'SUCCESS' ? 'bg-white' : 'bg-white/20'}`} />
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-8">
          {/* Global Alert Messages */}
          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3 animate-fadeIn">
              <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">{errorMsg}</div>
            </div>
          )}

          {successMsg && step !== 'SUCCESS' && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-3 animate-fadeIn">
              <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">{successMsg}</div>
            </div>
          )}

          {/* STEP 1: Registration Form */}
          {step === 'FORM' && (
            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => handleChange('fullName', e.target.value)}
                    placeholder="e.g. Alexander Pierce"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Login Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Login Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="e.g. newadmin@company.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">This email will be used to log into the new account.</p>
              </div>

              {/* Role Selection (Admin / Manager ONLY) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Account Role <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleChange('role', 'Admin')}
                    className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-sm font-semibold transition-all cursor-pointer ${
                      formData.role === 'Admin'
                        ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <ShieldCheck size={16} className={formData.role === 'Admin' ? 'text-blue-600' : 'text-slate-400'} />
                    Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChange('role', 'Manager')}
                    className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-sm font-semibold transition-all cursor-pointer ${
                      formData.role === 'Manager'
                        ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Award size={16} className={formData.role === 'Manager' ? 'text-blue-600' : 'text-slate-400'} />
                    Manager
                  </button>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Sending OTP to Admin...
                    </>
                  ) : (
                    <>
                      <span>Send OTP & Continue</span>
                      <KeyRound size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: OTP Verification Screen */}
          {step === 'OTP' && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="text-center py-1">
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
                  <KeyRound size={28} />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Enter Verification OTP</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Registering account for <span className="font-semibold text-slate-700">{formData.email}</span>
                </p>
              </div>

              {/* Security Notice: OTP sent to SMTP_USER */}
              <div className="p-3.5 bg-indigo-50/80 border border-indigo-100 rounded-xl text-xs text-indigo-950 flex items-start gap-2.5">
                <Info size={18} className="text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-indigo-900">Security Verification Notice</p>
                  <p className="mt-0.5 text-[11.5px] leading-relaxed text-indigo-800">
                    A 6-digit verification OTP has been sent to the authorized administrator mailbox (SMTP_USER). Please obtain the OTP code from the administrator to verify and complete registration.
                  </p>
                </div>
              </div>

              {/* 6-Digit OTP Code Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider text-center mb-2">
                  6-Digit OTP Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => {
                    setOtpCode(e.target.value.replace(/\D/g, ''));
                    setErrorMsg('');
                  }}
                  placeholder="123456"
                  className="w-full text-center tracking-[12px] text-2xl font-bold py-3.5 bg-slate-50 border-2 border-blue-200 focus:border-blue-600 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 text-slate-900 transition-all"
                />
              </div>

              {/* OTP Expiry (5 minutes) & Resend Cooldown */}
              <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span>Expires in: <strong className="text-slate-700 font-mono">{formatTime(otpExpiry)}</strong></span>
                </div>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={cooldown > 0 || loading}
                  className="text-blue-600 font-semibold hover:text-blue-700 disabled:text-slate-400 transition-colors flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                >
                  <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                  {cooldown > 0 ? `Resend (${cooldown}s)` : 'Resend OTP'}
                </button>
              </div>

              {/* Actions */}
              <div className="space-y-2.5 pt-2">
                <button
                  type="submit"
                  disabled={loading || otpCode.length < 6}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Verifying & Creating Account...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} />
                      Verify OTP & Create Account
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep('FORM');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="w-full py-2.5 px-4 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft size={14} />
                  Back to Registration Form
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Registration Successful Screen */}
          {step === 'SUCCESS' && (
            <div className="text-center py-6 animate-fadeIn space-y-4">
              <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner border border-emerald-100">
                <CheckCircle2 size={48} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">Registration Successful!</h3>
                <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
                  The <strong className="text-slate-700">{formData.role}</strong> account for <span className="text-blue-600 font-semibold">{formData.email}</span> has been verified and created successfully.
                </p>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 text-left space-y-2 border border-slate-200 max-w-sm mx-auto text-xs text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Full Name:</span>
                  <span className="font-semibold text-slate-800">{formData.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Login Email:</span>
                  <span className="font-semibold text-slate-800">{formData.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Assigned Role:</span>
                  <span className="font-semibold text-blue-600">{formData.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Account Status:</span>
                  <span className="font-semibold text-emerald-600">Active ✓</span>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleRedirectLogin}
                  className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  Redirect to Login Page
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
