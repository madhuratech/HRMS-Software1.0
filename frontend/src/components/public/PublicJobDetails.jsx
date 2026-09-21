import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { MapPin, Briefcase, Building, Calendar, ArrowLeft, CheckCircle2, FileText, Upload, AlertCircle, Send } from 'lucide-react';

export default function PublicJobDetails() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();

  // Capture tracking source parameter from URL (e.g. ?source=linkedin)
  const sourceParam = (searchParams.get('source') || 'CAREER_PAGE').toUpperCase();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Form State
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    currentLocation: '',
    totalExperience: '',
    currentCompany: '',
    currentDesignation: '',
    expectedSalary: '',
    noticePeriod: '',
    linkedin: '',
    portfolio: '',
    coverLetter: ''
  });

  const API_URL = import.meta.env.VITE_HRMS_API_URL || '';

  useEffect(() => {
    const fetchJobDetails = async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const res = await fetch(`${API_URL}/api/public/jobs/${encodeURIComponent(slug)}`);
        const data = await res.json();
        if (data.success && data.job) {
          setJob(data.job);
        } else {
          setNotFound(true);
        }
      } catch (err) {
        console.error('Error fetching job details:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchJobDetails();
    }
  }, [slug, API_URL]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!formData.fullName || !formData.email || !formData.phone) {
      alert('Full Name, Email, and Phone Number are required.');
      return;
    }
    if (!resumeFile) {
      alert('Please upload your resume file (PDF, DOC, DOCX).');
      return;
    }

    setSubmitting(true);
    try {
      const data = new FormData();
      data.append('fullName', formData.fullName);
      data.append('email', formData.email);
      data.append('phone', formData.phone);
      data.append('currentLocation', formData.currentLocation || '');
      data.append('totalExperience', formData.totalExperience || '');
      data.append('currentCompany', formData.currentCompany || '');
      data.append('currentDesignation', formData.currentDesignation || '');
      data.append('expectedSalary', formData.expectedSalary || '');
      data.append('noticePeriod', formData.noticePeriod || '');
      data.append('linkedin', formData.linkedin || '');
      data.append('portfolio', formData.portfolio || '');
      data.append('coverLetter', formData.coverLetter || '');
      data.append('source', sourceParam || '');
      data.append('resume', resumeFile);

      console.log("========== RESUME UPLOAD DEBUG ==========");
      console.log("Selected Resume File:", resumeFile);
      console.log("File Name:", resumeFile?.name);
      console.log("File Type:", resumeFile?.type);
      console.log("File Size:", resumeFile?.size);
      for (const [key, value] of data.entries()) {
        console.log(key, value);
      }
      console.log("=========================================");

      const res = await fetch(`${API_URL}/api/public/jobs/${job.id}/apply`, {
        method: 'POST',
        body: data
      });

      const resData = await res.json();
      if (resData.success) {
        setSubmittedSuccess(true);
      } else {
        alert(resData.message || 'Failed to submit application.');
      }
    } catch (err) {
      alert('Error submitting application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ fontFamily: '"Inter", sans-serif', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', color: '#64748B' }}>
        Loading position details...
      </div>
    );
  }

  if (notFound || !job) {
    return (
      <div style={{ fontFamily: '"Inter", sans-serif', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', padding: '24px', textAlign: 'center' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#FEF2F2', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
          <AlertCircle size={32} />
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0F172A', marginBottom: '8px' }}>This position is no longer available.</h2>
        <p style={{ fontSize: '14px', color: '#64748B', maxWidth: '400px', marginBottom: '24px' }}>
          The job opening you are looking for has expired, been filled, or closed by the recruitment team.
        </p>
        <Link to="/career" style={{ padding: '10px 20px', background: '#2563EB', color: '#FFF', borderRadius: '8px', textDecoration: 'none', fontWeight: '600', fontSize: '14px' }}>
          View All Open Positions
        </Link>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: '"Inter", -apple-system, sans-serif', background: '#F8FAFC', minHeight: '100vh', color: '#1E293B' }}>

      {/* Brand Header */}
      <header style={{ background: '#0F172A', color: '#FFFFFF', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', background: '#2563EB', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '18px' }}>
            M
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: '800' }}>Madhura Technologies</div>
            <div style={{ fontSize: '11px', color: '#94A3B8' }}>Career Portal & Opportunities</div>
          </div>
        </div>
        <Link to="/career" style={{ fontSize: '13px', color: '#94A3B8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <ArrowLeft size={14} /> Back to Open Positions
        </Link>
      </header>

      {/* Main Container */}
      <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 24px' }}>

        {/* Job Header Card */}
        <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '32px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {job.department}
              </span>
              <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#0F172A', margin: '4px 0 12px' }}>{job.title}</h1>

              <div style={{ display: 'flex', gap: '20px', fontSize: '14px', color: '#64748B', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={16} /> {job.location}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Briefcase size={16} /> {job.experience}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Building size={16} /> {job.employmentType}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={16} /> Posted {new Date(job.publishedAt).toLocaleDateString()}</span>
              </div>
            </div>

            <button
              onClick={() => setShowApplyModal(true)}
              style={{ padding: '14px 28px', background: '#2563EB', color: '#FFF', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 14px rgba(37,99,235,0.3)' }}
            >
              Apply Now
            </button>
          </div>
        </div>

        {/* Content Breakdown Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '32px' }}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* Job Summary */}
            {job.jobSummary && (
              <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '28px', border: '1px solid #E2E8F0' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 12px', color: '#0F172A' }}>Job Summary</h3>
                <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.7', margin: 0, whiteSpace: 'pre-line' }}>{job.jobSummary}</p>
              </div>
            )}

            {/* Responsibilities */}
            {job.responsibilities && (
              <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '28px', border: '1px solid #E2E8F0' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 12px', color: '#0F172A' }}>Responsibilities</h3>
                <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.7', margin: 0, whiteSpace: 'pre-line' }}>{job.responsibilities}</p>
              </div>
            )}

            {/* Requirements */}
            {job.requirements && (
              <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '28px', border: '1px solid #E2E8F0' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 12px', color: '#0F172A' }}>Requirements</h3>
                <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.7', margin: 0, whiteSpace: 'pre-line' }}>{job.requirements}</p>
              </div>
            )}

          </div>

          {/* Sidebar Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '24px', border: '1px solid #E2E8F0', spaceY: '16px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 16px', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>Job Snapshot</h4>

              <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '12px', color: '#64748B' }}>
                <div>
                  <span style={{ color: '#94A3B8', display: 'block', marginBottom: '2px' }}>Required Experience</span>
                  <strong style={{ color: '#0F172A' }}>{job.experience}</strong>
                </div>
                <div>
                  <span style={{ color: '#94A3B8', display: 'block', marginBottom: '2px' }}>Openings / Vacancies</span>
                  <strong style={{ color: '#0F172A' }}>{job.vacancies} Position(s)</strong>
                </div>
                <div>
                  <span style={{ color: '#94A3B8', display: 'block', marginBottom: '2px' }}>Required Skills</span>
                  <strong style={{ color: '#0F172A' }}>{job.skills || 'Not specified'}</strong>
                </div>
              </div>

              <div style={{ marginTop: '24px' }}>
                <button
                  onClick={() => setShowApplyModal(true)}
                  style={{ width: '100%', padding: '12px', background: '#2563EB', color: '#FFF', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}
                >
                  Apply Now
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Candidate Application Modal */}
      {showApplyModal && (
        <>
          <div className="modal-backdrop-blur" onClick={() => setShowApplyModal(false)} />
          <div className="modal-centered-content" style={{ width: '650px', maxWidth: '95vw', maxHeight: '90vh' }}>

            <div className="p-6 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Apply for {job.title}</h3>
                <p className="text-xs text-slate-500 mt-1">Submit your details to enter the Madhura Technologies hiring pipeline.</p>
              </div>
              <button onClick={() => setShowApplyModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            {submittedSuccess ? (
              <div className="p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 size={36} />
                </div>
                <h3 className="text-2xl font-bold text-slate-800">Application Submitted!</h3>
                <p className="text-sm text-slate-600 max-w-md mx-auto">
                  Your application for <strong>{job.title}</strong> has been submitted successfully to Madhura HRMS ATS. Our recruitment team will review your profile.
                </p>
                <button
                  onClick={() => {
                    setShowApplyModal(false);
                    setSubmittedSuccess(false);
                  }}
                  className="px-6 py-2.5 bg-slate-800 text-white font-semibold rounded-xl text-sm"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                    <input type="text" required value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} placeholder="John Doe" className="w-full h-10 px-3 border border-slate-200 rounded-lg" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Email Address <span className="text-red-500">*</span></label>
                    <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="john@example.com" className="w-full h-10 px-3 border border-slate-200 rounded-lg" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Phone Number <span className="text-red-500">*</span></label>
                    <input type="tel" required value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+91 9876543210" className="w-full h-10 px-3 border border-slate-200 rounded-lg" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Current Location</label>
                    <input type="text" value={formData.currentLocation} onChange={e => setFormData({ ...formData, currentLocation: e.target.value })} placeholder="Chennai, TN" className="w-full h-10 px-3 border border-slate-200 rounded-lg" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Total Experience</label>
                    <input type="text" value={formData.totalExperience} onChange={e => setFormData({ ...formData, totalExperience: e.target.value })} placeholder="e.g. 3 Years" className="w-full h-10 px-3 border border-slate-200 rounded-lg" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Current Company</label>
                    <input type="text" value={formData.currentCompany} onChange={e => setFormData({ ...formData, currentCompany: e.target.value })} placeholder="Company Name" className="w-full h-10 px-3 border border-slate-200 rounded-lg" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Expected Salary</label>
                    <input type="text" value={formData.expectedSalary} onChange={e => setFormData({ ...formData, expectedSalary: e.target.value })} placeholder="e.g. ₹ 8,00,000" className="w-full h-10 px-3 border border-slate-200 rounded-lg" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Notice Period</label>
                    <input type="text" value={formData.noticePeriod} onChange={e => setFormData({ ...formData, noticePeriod: e.target.value })} placeholder="Immediate / 30 Days" className="w-full h-10 px-3 border border-slate-200 rounded-lg" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">LinkedIn Profile</label>
                    <input type="url" value={formData.linkedin} onChange={e => setFormData({ ...formData, linkedin: e.target.value })} placeholder="https://linkedin.com/in/..." className="w-full h-10 px-3 border border-slate-200 rounded-lg" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Portfolio / GitHub URL</label>
                    <input type="url" value={formData.portfolio} onChange={e => setFormData({ ...formData, portfolio: e.target.value })} placeholder="https://..." className="w-full h-10 px-3 border border-slate-200 rounded-lg" />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Resume Upload <span className="text-red-500">*</span> (PDF, DOC, DOCX)</label>
                  <input
                    type="file"
                    required
                    accept=".pdf,.doc,.docx"
                    onChange={e => setResumeFile(e.target.files[0] || null)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cover Letter / Notes</label>
                  <textarea
                    rows={3}
                    value={formData.coverLetter}
                    onChange={e => setFormData({ ...formData, coverLetter: e.target.value })}
                    placeholder="Briefly introduce yourself and why you're a great fit for this position..."
                    className="w-full p-3 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                  <button type="button" onClick={() => setShowApplyModal(false)} className="px-5 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg">Cancel</button>
                  <button type="submit" disabled={submitting} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">
                    {submitting ? 'Submitting...' : 'Submit Application'}
                  </button>
                </div>

              </form>
            )}

          </div>
        </>
      )}

    </div>
  );
}
