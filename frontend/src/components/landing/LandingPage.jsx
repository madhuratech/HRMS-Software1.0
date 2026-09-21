import React, { useState } from 'react';
import './LandingPage.css';
import {
  Users,
  MapPin,
  CheckCircle2,
  X,
  Bell,
  CreditCard,
  Briefcase,
  DollarSign,
  Calendar,
  Mail,
  Phone,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Plus,
  UserPlus,
  Settings,
  Rocket
} from 'lucide-react';

const TESTIMONIALS = [
  {
    quote: "We run payroll for 180 field staff across three states. What used to take our accountant four days now closes before lunch on the first of the month.",
    author: 'Priya Ramesh',
    role: 'Head of HR, Velan Logistics',
  },
  {
    quote: "The geofenced attendance ended our biggest source of disputes. Nobody argues about punch-in times anymore because the GPS log settles it.",
    author: 'Suresh Kumar',
    role: 'Operations Director, Anand Textiles',
  },
  {
    quote: "Our HR team of two manages 400 employees comfortably. Leave approvals that used to sit in someone's inbox now clear in under a day.",
    author: 'Meena Balakrishnan',
    role: 'People Ops Lead, Coimbatore Auto Components',
  },
];

const FAQS = [
  {
    q: 'How long does it take to get set up?',
    a: 'Most teams are running payroll within a week. Import your employee list from a spreadsheet, set your salary structures, and our onboarding team handles PF and ESI configuration with you on a call.',
  },
  {
    q: 'Does it work for staff without smartphones?',
    a: 'Yes. You can pair MadhuraHRMS with a biometric attendance machine on-site, and staff without the app can still be marked present by a supervisor from their device.',
  },
  {
    q: 'Can we switch plans later?',
    a: 'You can move between Free, Growth, and Enterprise at any time from your billing settings. Upgrades apply immediately; downgrades take effect at the start of your next billing cycle.',
  },
  {
    q: 'Is our employee data stored securely?',
    a: 'All records, including ID documents, are encrypted at rest with 256-bit encryption, and access is scoped by role so field managers cannot see salary data.',
  },
];

export function LandingPage({
  onOpenLogin,
  onOpenRegister,
  onQuickDemoLogin,
  onOpenPricing,
  isLoggedIn = false,
}) {
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [demoSubmitted, setDemoSubmitted] = useState(false);
  const [testiIndex, setTestiIndex] = useState(0);
  const [openFaq, setOpenFaq] = useState(0);

  const handleDemoSubmit = (e) => {
    e.preventDefault();
    setDemoSubmitted(true);
  };

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  const activeTesti = TESTIMONIALS[testiIndex];

  return (
    <div className="pb-landing">
      {/* Announcement Bar */}
      <div className="pb-announcement">
        <span className="pb-announcement-badge">NEW</span>
        MadhuraHRMS is here: manage attendance, payroll, and performance in one place.
        <a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}>Take a look →</a>
      </div>

      {/* Fixed Sticky Header */}
      <header className="pb-header">
        <div className="pb-header-inner">
          <div className="pb-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <Users className="pb-logo-icon" size={22} />
            Madhura<span>HRMS</span>
          </div>

          <nav className="pb-nav">
            <a onClick={() => scrollToSection('features')}>Products</a>
            <a onClick={() => scrollToSection('how-it-works')}>How it works</a>
            <a onClick={() => onOpenPricing && onOpenPricing()}>Pricing</a>
            <a onClick={() => scrollToSection('faq')}>FAQ</a>
          </nav>

          <div className="pb-actions">
            <button className="pb-btn-primary" onClick={() => onOpenLogin && onOpenLogin()}>
              Book Demo
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pb-hero" id="home">
        <div>
          {/* Promotional Card */}
          <div className="pb-promo-card">
            <div>
              <div className="pb-promo-title">More than just <span>Payroll</span></div>
              <div className="text-sm mt-1 text-[var(--slate)]">Everything you need to scale your workforce.</div>
            </div>
            <div className="pb-promo-price-block">
              <div className="pb-promo-price">
                <span className="pb-promo-strike">₹119</span> ₹95
              </div>
              <span className="pb-save-badge">Save 20% on Annual Plans</span>
            </div>
          </div>

          <h1 className="pb-hero-title">
            Run HR without<br />the Spreadsheets
          </h1>
          <p className="pb-hero-sub">
            Automate your attendance, payroll, leave workflows, and performance reviews. Built for modern enterprises and growing teams.
          </p>

          <div className="pb-hero-cta-row">
            <button className="pb-btn-primary" style={{ padding: '14px 32px', fontSize: '16px' }} onClick={() => onOpenRegister ? onOpenRegister() : onOpenLogin()}>
              Sign Up Free
            </button>
            <button className="pb-btn-ghost" style={{ padding: '14px 28px', fontSize: '16px' }} onClick={() => scrollToSection('features')}>
              See how it works
            </button>
            <div className="pb-hero-avail">
              Available on
              <strong>Android, iOS &amp; Web</strong>
            </div>
          </div>
        </div>

        <div className="pb-hero-visual" id="demo">
          <div className="pb-hero-circle"></div>
          <div className="pb-hero-mockup">
            <div className="pb-hero-mockup-inner">
              <div className="flex justify-between items-center mb-6">
                <div className="font-bold text-lg">Today</div>
                <div className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">98% Present</div>
              </div>
              <div className="space-y-4">
                <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold">D</div>
                  <div>
                    <div className="text-sm font-bold">Dhilipan</div>
                    <div className="text-xs text-gray-500">In: 09:02 AM</div>
                  </div>
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-700 font-bold">M</div>
                  <div>
                    <div className="text-sm font-bold">Muthu</div>
                    <div className="text-xs text-gray-500">Field GPS</div>
                  </div>
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-bold">D</div>
                  <div>
                    <div className="text-sm font-bold">Dina</div>
                    <div className="text-xs text-red-500">On Leave</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="pb-floating-card">
            My entire staff's payroll<br />with a single app
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <div className="pb-trust-bar">
        <div className="pb-trust-col">
          <div className="pb-trust-icon green"><Users size={22} /></div>
          <div className="pb-trust-metric">50,000+</div>
          <div className="pb-trust-label">Employees Tracked</div>
        </div>
        <div className="pb-trust-col">
          <div className="pb-trust-icon blue"><MapPin size={22} /></div>
          <div className="pb-trust-metric">99.99%</div>
          <div className="pb-trust-label">Uptime & Reliability</div>
        </div>
        <div className="pb-trust-col">
          <div className="pb-trust-icon yellow"><CheckCircle2 size={22} /></div>
          <div className="pb-trust-metric">65% Less</div>
          <div className="pb-trust-label">Admin Hours Logged</div>
        </div>
      </div>

      {/* Logo strip */}
      <div className="pb-logostrip">
        <div className="pb-logostrip-label">Trusted by HR teams at growing companies across Tamil Nadu</div>
        <div className="pb-logostrip-row">
          <span className="pb-logostrip-item">Velan Logistics</span>
          <span className="pb-logostrip-item">Anand Textiles</span>
          <span className="pb-logostrip-item">CBE Auto Components</span>
          <span className="pb-logostrip-item">Sundar Foods</span>
          <span className="pb-logostrip-item">NextGen Apparel</span>
        </div>
      </div>

      {/* Products Grid - All 8 HRMS Modules */}
      <section className="pb-features" id="features">
        <div className="pb-section-head">
          <div className="pb-section-eyebrow">What's inside</div>
          <h2 className="pb-section-title">Eight tools, one login</h2>
          <p className="pb-section-sub">Everything an HR team touches in a week — attendance, pay, leave, and hiring — built to work together instead of around each other.</p>
        </div>
        <div className="pb-features-grid">

          <div className="pb-feat-card">
            <div className="pb-feat-icon-wrap yellow"><MapPin size={22} /></div>
            <h3 className="pb-feat-title">GPS & Geofencing</h3>
            <p className="pb-feat-desc">Radius-restricted mobile punch-in, live location pins, and biometric machine sync for field and office staff.</p>
          </div>

          <div className="pb-feat-card">
            <div className="pb-feat-icon-wrap blue"><CreditCard size={22} /></div>
            <h3 className="pb-feat-title">One-Click Payroll</h3>
            <p className="pb-feat-desc">Bulk payslips with automatic PF, ESI, tax, and reimbursement deductions, disbursed in minutes.</p>
          </div>

          <div className="pb-feat-card">
            <div className="pb-feat-icon-wrap green"><Calendar size={22} /></div>
            <h3 className="pb-feat-title">Leave & Shift Rosters</h3>
            <p className="pb-feat-desc">Multi-level approvals, comp-off calculations, rotational shifts, and a shared holiday calendar.</p>
          </div>

          <div className="pb-feat-card">
            <div className="pb-feat-icon-wrap purple"><Bell size={22} /></div>
            <h3 className="pb-feat-title">AI HR Assistant</h3>
            <p className="pb-feat-desc">A chat assistant employees can ask about policy, leave balances, and payroll — trained on your HR manual.</p>
          </div>

          <div className="pb-feat-card">
            <div className="pb-feat-icon-wrap blue"><Users size={22} /></div>
            <h3 className="pb-feat-title">Recruitment & ATS</h3>
            <p className="pb-feat-desc">A branded career page, resume screening, interview scheduling, and offer letters, in one place.</p>
          </div>

          <div className="pb-feat-card">
            <div className="pb-feat-icon-wrap yellow"><CheckCircle2 size={22} /></div>
            <h3 className="pb-feat-title">Performance & OKRs</h3>
            <p className="pb-feat-desc">Objective tracking, self and manager reviews, and a transparent path to promotion.</p>
          </div>

          <div className="pb-feat-card">
            <div className="pb-feat-icon-wrap green"><Briefcase size={22} /></div>
            <h3 className="pb-feat-title">Document Vault</h3>
            <p className="pb-feat-desc">Encrypted 256-bit storage for ID documents, certificates, and policy acknowledgments.</p>
          </div>

          <div className="pb-feat-card">
            <div className="pb-feat-icon-wrap purple"><DollarSign size={22} /></div>
            <h3 className="pb-feat-title">Expenses & Claims</h3>
            <p className="pb-feat-desc">Photograph a receipt, route it to the right approver, and fold it into the next payroll run.</p>
          </div>

        </div>
      </section>

      {/* How it works — a real 3-step sequence */}
      <section className="pb-howitworks" id="how-it-works">
        <div className="pb-section-head" style={{ marginBottom: 48 }}>
          <div className="pb-section-eyebrow">Getting started</div>
          <h2 className="pb-section-title">Live in three steps</h2>
          <p className="pb-section-sub">No implementation team required — most HR admins finish this themselves in an afternoon.</p>
        </div>
        <div className="pb-steps">
          <div className="pb-step">
            <div className="pb-step-num"><UserPlus size={16} /></div>
            <h3 className="pb-step-title">Import your team</h3>
            <p className="pb-step-desc">Upload your existing employee spreadsheet or add staff one by one. We map salary structures automatically.</p>
            <div className="pb-step-connector"></div>
          </div>
          <div className="pb-step">
            <div className="pb-step-num"><Settings size={16} /></div>
            <h3 className="pb-step-title">Set your policies</h3>
            <p className="pb-step-desc">Configure leave types, shift patterns, geofences, and approval chains to match how your business actually runs.</p>
            <div className="pb-step-connector"></div>
          </div>
          <div className="pb-step">
            <div className="pb-step-num"><Rocket size={16} /></div>
            <h3 className="pb-step-title">Go live</h3>
            <p className="pb-step-desc">Staff download the app, mark their first attendance, and your next payroll run is ready to process automatically.</p>
          </div>
        </div>
      </section>

      {/* Detailed Zig-Zag Sections */}
      <section className="pb-zigzag-section">

        {/* Row 1 */}
        <div className="pb-zigzag-row">
          <div className="pb-zigzag-image">
            <div className="pb-zigzag-mockup">
              <div className="bg-[var(--navy)] text-white p-4">
                <div className="font-bold">Attendance</div>
              </div>
              <div className="p-4 space-y-4">
                <div className="bg-gray-100 h-12 rounded-lg flex items-center px-4 gap-3">
                  <MapPin size={18} className="text-[var(--navy)]" /> Geofence: Active
                </div>
                <div className="bg-green-100 text-green-800 p-4 rounded-lg font-bold text-center border border-green-200">
                  Punch In Successful
                </div>
              </div>
            </div>
            <div className="pb-zigzag-popup right hidden md:flex">
              <CheckCircle2 size={18} className="text-green-400" />
              Verified via Selfie & GPS
            </div>
          </div>
          <div className="pb-zigzag-content">
            <h2 className="pb-zigzag-title">Keep track of your staff attendance anywhere</h2>
            <ul className="pb-zigzag-list">
              <li>Track staff attendance with selfie verification and location-based geofencing.</li>
              <li>Employees can mark attendance remotely, perfect for field sales and distributed teams.</li>
              <li>Syncs seamlessly with hardware biometric machines if needed.</li>
            </ul>
          </div>
        </div>

        {/* Row 2 */}
        <div className="pb-zigzag-row reverse">
          <div className="pb-zigzag-image">
            <div className="pb-zigzag-mockup">
              <div className="bg-white p-4 border-b border-gray-100 shadow-sm">
                <div className="font-bold text-lg text-center">Payslip - Sept 2026</div>
              </div>
              <div className="p-4 space-y-3 bg-gray-50 h-full">
                <div className="flex justify-between bg-white p-3 rounded border border-gray-100 shadow-sm">
                  <span className="text-sm text-gray-500">Basic Salary</span>
                  <span className="font-bold">₹24,000</span>
                </div>
                <div className="flex justify-between bg-white p-3 rounded border border-gray-100 shadow-sm">
                  <span className="text-sm text-gray-500">PF Deduction</span>
                  <span className="font-bold text-red-500">-₹1,800</span>
                </div>
                <div className="flex justify-between bg-[var(--navy)] text-white p-3 rounded mt-4">
                  <span className="font-bold">Net Pay</span>
                  <span className="font-bold">₹22,200</span>
                </div>
              </div>
            </div>
            <div className="pb-zigzag-popup left hidden md:flex">
              <DollarSign size={18} className="text-[var(--amber)]" />
              Automatic Tax & PF Calculations
            </div>
          </div>
          <div className="pb-zigzag-content">
            <h2 className="pb-zigzag-title">Manage your staff salary, PF, Advances & Deductions</h2>
            <ul className="pb-zigzag-list">
              <li>Generate accurate payslips with auto-calculated taxes, PF, and ESI in one click.</li>
              <li>Manage employee advances, expense reimbursements, and pro-rata salary adjustments.</li>
              <li>Customizable salary structures for different roles and departments.</li>
            </ul>
          </div>
        </div>

        {/* Row 3 */}
        <div className="pb-zigzag-row">
          <div className="pb-zigzag-image">
            <div className="pb-zigzag-mockup">
              <div className="bg-[var(--navy)] text-white p-4">
                <div className="font-bold">Leave Requests</div>
              </div>
              <div className="p-4 space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                  <div className="text-sm font-bold text-yellow-800">Sick Leave (Pending)</div>
                  <div className="text-xs text-yellow-600 mt-1">12 Oct - 14 Oct</div>
                </div>
                <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                  <div className="text-sm font-bold text-green-800">Earned Leave (Approved)</div>
                  <div className="text-xs text-green-600 mt-1">20 Nov - 25 Nov</div>
                </div>
              </div>
            </div>
            <div className="pb-zigzag-popup right hidden md:flex">
              <Calendar size={18} className="text-blue-400" />
              Multi-level Approval Workflows
            </div>
          </div>
          <div className="pb-zigzag-content">
            <h2 className="pb-zigzag-title">Automate Leave & Shift Rosters</h2>
            <ul className="pb-zigzag-list">
              <li>Set up custom leave policies (Casual, Sick, Comp-off) tailored to your company rules.</li>
              <li>Employees can view their balance and request leaves via the mobile app.</li>
              <li>Managers receive instant notifications to approve or reject requests on the go.</li>
            </ul>
          </div>
        </div>

        {/* Row 4 */}
        <div className="pb-zigzag-row reverse">
          <div className="pb-zigzag-image">
            <div className="pb-zigzag-mockup">
              <div className="bg-[var(--navy)] text-white p-4 flex items-center justify-between">
                <div className="font-bold">Inbox</div>
                <Bell size={18} />
              </div>
              <div className="p-4 space-y-3">
                <div className="bg-white p-3 rounded border-l-4 border-blue-500 shadow-sm text-sm">
                  <div className="font-bold mb-1">Company Announcement</div>
                  <div className="text-gray-500">Diwali bonus will be credited on 25th Oct.</div>
                </div>
                <div className="bg-white p-3 rounded border-l-4 border-yellow-500 shadow-sm text-sm">
                  <div className="font-bold mb-1">Action Required</div>
                  <div className="text-gray-500">Please submit your tax declarations.</div>
                </div>
              </div>
            </div>
          </div>
          <div className="pb-zigzag-content">
            <h2 className="pb-zigzag-title">Send notifications to your staff instantly</h2>
            <ul className="pb-zigzag-list">
              <li>Broadcast important announcements and policy updates to the entire organization.</li>
              <li>Automated reminders for pending approvals, document uploads, and tax submissions.</li>
              <li>Keep everyone aligned without relying on scattered WhatsApp groups.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="pb-testimonial">
        <div className="pb-testi-inner">
          <div className="pb-testi-quotemark">"</div>
          <p className="pb-testi-quote">{activeTesti.quote}</p>
          <div className="pb-testi-author">{activeTesti.author}</div>
          <div className="pb-testi-role">{activeTesti.role}</div>
          <div className="pb-testi-dots">
            {TESTIMONIALS.map((t, i) => (
              <button
                key={t.author}
                className={`pb-testi-dot${i === testiIndex ? ' active' : ''}`}
                onClick={() => setTestiIndex(i)}
                aria-label={`Show testimonial from ${t.author}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="pb-faq" id="faq">
        <div className="pb-section-head" style={{ marginBottom: 24 }}>
          <div className="pb-section-eyebrow">Questions</div>
          <h2 className="pb-section-title">Frequently asked</h2>
        </div>
        {FAQS.map((item, i) => (
          <div key={item.q} className={`pb-faq-item${openFaq === i ? ' open' : ''}`}>
            <button className="pb-faq-question" onClick={() => setOpenFaq(openFaq === i ? -1 : i)}>
              {item.q}
              <span className="pb-faq-icon"><Plus size={14} /></span>
            </button>
            <div className="pb-faq-answer">
              <p>{item.a}</p>
            </div>
          </div>
        ))}
      </section>

      {/* CTA Banner */}
      <section className="pb-cta-banner">
        <div className="pb-cta-inner">
          <div>
            <h2 className="pb-cta-title">Get in touch with us now!</h2>
            <div className="pb-cta-sub">Free 14-day trial. No card required.</div>
          </div>
          <button className="pb-btn-primary" onClick={() => onOpenLogin && onOpenLogin()}>Request Callback</button>
        </div>
      </section>

      {/* Custom Dark Footer */}
      <footer className="pb-footer">
        <div className="pb-footer-inner">
          <div>
            <div className="pb-footer-logo">
              <Users size={30} className="pb-footer-logo-icon" /> Madhura<span>HRMS</span>
            </div>
            <p className="pb-footer-desc">
              Madhura Technologies specializes in comprehensive HR and workforce management software, SaaS solutions, and advanced digital transformation – empowering modern businesses with technology.
            </p>
            <a href="#demo" className="pb-footer-btn" onClick={() => onOpenLogin && onOpenLogin()}>Read More</a>
          </div>

          <div className="pb-footer-col">
            <h4>Quick Links</h4>
            <ul className="pb-footer-list">
              <li><a href="#about">About Us</a></li>
              <li><a href="#contact">Contact Us</a></li>
              <li><a href="#features">Our Services</a></li>
              <li><a href="#blog">Blog</a></li>
              <li><a href="#terms">Terms & Conditions</a></li>
              <li><a href="#privacy">Privacy Policy</a></li>
            </ul>
          </div>

          <div className="pb-footer-col">
            <h4>Our Features</h4>
            <ul className="pb-footer-list">
              <li><a href="#features">GPS & Geofencing</a></li>
              <li><a href="#features">One-Click Payroll</a></li>
              <li><a href="#features">Leave & Shift Rosters</a></li>
              <li><a href="#features">AI HR Assistant</a></li>
              <li><a href="#features">Recruitment & ATS</a></li>
              <li><a href="#features">Performance & OKRs</a></li>
              <li><a href="#features">Document Vault</a></li>
              <li><a href="#features">Expenses & Claims</a></li>
            </ul>
          </div>

          <div className="pb-footer-col">
            <h4>Contact</h4>
            <ul className="pb-footer-contact">
              <li>
                <MapPin size={20} />
                <span>18, 2nd Floor, Rangaswamy Road, Sukrawar Pettai, R.S. Puram, Coimbatore, Tamil Nadu 641002.</span>
              </li>
              <li>
                <Mail size={20} />
                <span>biz@madhuratech.com</span>
              </li>
              <li>
                <Phone size={20} />
                <span>+91 90036 63660</span>
              </li>
            </ul>
            <div className="pb-footer-social">
              <a href="#"><Facebook size={18} /></a>
              <a href="#"><Instagram size={18} /></a>
              <a href="#"><Twitter size={18} /></a>
              <a href="#"><Linkedin size={18} /></a>
            </div>
          </div>
        </div>
        <div className="pb-footer-bottom">
          Copyright © 2026 Madhura Technologies. All Rights Reserved
        </div>
      </footer>

      {/* Demo Modal */}
      {demoModalOpen && (
        <div className="pb-modal-overlay">
          <div className="pb-modal">
            <button className="pb-modal-close" onClick={() => setDemoModalOpen(false)}>
              <X size={20} />
            </button>

            {!demoSubmitted ? (
              <>
                <h2 className="pb-modal-title">Book a free demo</h2>
                <p className="pb-modal-desc">See how MadhuraHRMS can transform your workplace.</p>

                <form onSubmit={handleDemoSubmit}>
                  <div className="pb-form-group">
                    <label className="pb-form-label">Full Name</label>
                    <input type="text" className="pb-form-input" placeholder="e.g. Rajesh Kumar" required />
                  </div>
                  <div className="pb-form-group">
                    <label className="pb-form-label">Work Email</label>
                    <input type="email" className="pb-form-input" placeholder="rajesh@company.com" required />
                  </div>
                  <div className="pb-form-group">
                    <label className="pb-form-label">Phone Number</label>
                    <input type="tel" className="pb-form-input" placeholder="+91 98765 43210" required />
                  </div>
                  <div className="pb-form-group">
                    <label className="pb-form-label">Company Size</label>
                    <select className="pb-form-input" required>
                      <option value="">Select employees count</option>
                      <option value="1-50">1 - 50</option>
                      <option value="51-200">51 - 200</option>
                      <option value="201-500">201 - 500</option>
                      <option value="500+">500+</option>
                    </select>
                  </div>

                  <button type="submit" className="pb-btn-primary" style={{ width: '100%', marginTop: '16px', padding: '16px' }}>
                    Request Demo
                  </button>
                </form>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ color: 'var(--mint)', display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                  <CheckCircle2 size={64} />
                </div>
                <h2 className="pb-modal-title">Request Received!</h2>
                <p className="pb-modal-desc" style={{ marginBottom: 0 }}>
                  Thank you for your interest in MadhuraHRMS.<br />Our team will contact you shortly to schedule your demo.
                </p>
                <button
                  className="pb-btn-primary"
                  style={{ marginTop: '32px' }}
                  onClick={() => { setDemoModalOpen(false); setDemoSubmitted(false); }}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}