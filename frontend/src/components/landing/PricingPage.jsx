import React, { useState } from 'react';
import './LandingPage.css';
import {
  Users, CheckCircle2, Minus, MapPin, Mail, Phone,
  Facebook, Instagram, Twitter, Linkedin, Plus
} from 'lucide-react';

const PLANS = [
  {
    key: 'free',
    name: 'Free',
    desc: 'For small teams just getting off spreadsheets.',
    monthly: 0,
    yearly: 0,
    unit: 'Forever',
    cta: 'Sign Up',
    features: [
      'Employee profiles',
      'Automated salary calculations',
      'Up to 10 employees',
      'Mobile app access',
    ],
  },
  {
    key: 'growth',
    name: 'Growth',
    desc: 'For companies scaling past their first 50 hires.',
    monthly: 95,
    yearly: 76,
    unit: '/emp/mo',
    cta: 'Get Started',
    popular: true,
    features: [
      'Everything in Free',
      'GPS geofenced attendance',
      'Selfie verification',
      'PF, ESI & tax deductions',
      'One-click payslips',
      'Leave & shift rosters',
      'Multi-level approvals',
      'Document vault (256-bit)',
    ],
  },
  {
    key: 'enterprise',
    name: 'Enterprise',
    desc: 'For organizations that need it all, with support.',
    monthly: 159,
    yearly: 127,
    unit: '/emp/mo',
    cta: 'Contact Sales',
    features: [
      'Everything in Growth',
      'Biometric machine sync',
      'Expenses & claims',
      'Performance & OKRs',
      'Recruitment & ATS',
      'AI HR assistant',
      'Dedicated account manager',
    ],
  },
];

const PRICING_FAQS = [
  {
    q: 'What happens when we cross our plan\'s employee limit?',
    a: 'We\'ll notify your admin before you\'re billed for the extra headcount, so you can either upgrade or trim the roster — nothing changes automatically without your sign-off.',
  },
  {
    q: 'Is there a setup or onboarding fee?',
    a: 'No. Onboarding support, data import, and PF/ESI configuration are included in every paid plan at no extra cost.',
  },
  {
    q: 'Can we cancel at any time?',
    a: 'Yes. There\'s no lock-in on monthly billing. Annual plans can be cancelled too; you\'ll keep access until the end of the paid term.',
  },
  {
    q: 'Do you offer discounts for NGOs or educational institutions?',
    a: 'Yes — reach out to our sales team with proof of registration and we\'ll apply a discounted non-profit rate to the Growth or Enterprise plan.',
  },
];

export function PricingPage({
  onOpenLogin,
  onBackToHome
}) {
  const [billing, setBilling] = useState('monthly'); // 'monthly' | 'yearly'
  const [openFaq, setOpenFaq] = useState(0);
  const isYearly = billing === 'yearly';

  const formatPrice = (plan) => {
    const amount = isYearly ? plan.yearly : plan.monthly;
    if (amount === 0) return '₹0';
    return `₹${amount}`;
  };

  return (
    <div className="pb-landing">
      {/* Fixed Sticky Header */}
      <header className="pb-header" style={{ top: 0 }}>
        <div className="pb-header-inner">
          <div className="pb-logo" onClick={() => onBackToHome && onBackToHome()} style={{ cursor: 'pointer' }}>
            <Users className="pb-logo-icon" size={22} />
            Madhura<span>HRMS</span>
          </div>

          <nav className="pb-nav">
            <a onClick={() => onBackToHome && onBackToHome()} style={{ cursor: 'pointer' }}>Home</a>
            <a onClick={() => onBackToHome && onBackToHome()} style={{ cursor: 'pointer' }}>Products</a>
            <a className="current">Pricing</a>
          </nav>

          <div className="pb-actions">
            <button className="pb-btn-primary" onClick={() => onOpenLogin && onOpenLogin()}>
              Book Demo
            </button>
          </div>
        </div>
      </header>

      {/* Pricing Hero + Toggle */}
      <section className="pb-pricing-hero">
        <div className="pb-section-eyebrow">Pricing</div>
        <h1 className="pb-section-title" style={{ fontSize: '42px' }}>Plans that grow with your headcount</h1>
        <p className="pb-section-sub">Pay per employee, switch plans any time, and only add what your HR team actually needs.</p>
      </section>

      <div className="pb-pricing-toggle-wrap">
        <div className="pb-pricing-toggle">
          <button className={!isYearly ? 'active' : ''} onClick={() => setBilling('monthly')}>Monthly</button>
          <button className={isYearly ? 'active' : ''} onClick={() => setBilling('yearly')}>
            Yearly <span className="pb-save-pill">Save 20%</span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="pb-pricing-cards">
        {PLANS.map((plan) => (
          <div key={plan.key} className={`pb-price-card${plan.popular ? ' popular' : ''}`}>
            {plan.popular && <div className="pb-price-badge">Most Popular</div>}
            <div className="pb-price-plan">{plan.name}</div>
            <div className="pb-price-plan-desc">{plan.desc}</div>
            <div className="pb-price-amount-row">
              <span className="pb-price-amount">{formatPrice(plan)}</span>
              {plan.monthly > 0 && <span className="pb-price-unit">{plan.unit}</span>}
            </div>
            <div className="pb-price-annual-note">
              {plan.monthly > 0 ? (isYearly ? 'billed annually' : 'billed monthly') : ''}
            </div>
            <button className="pb-price-cta" onClick={() => onOpenLogin && onOpenLogin()}>{plan.cta}</button>
            <ul className="pb-price-features">
              {plan.features.map((f) => (
                <li key={f}><CheckCircle2 size={16} /> {f}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Feature Comparison Table */}
      <section className="pb-pricing-table-section" id="pricing">
        <div className="pb-section-head">
          <h2 className="pb-section-title" style={{ fontSize: '28px' }}>Compare every feature</h2>
          <p className="pb-section-sub">The full breakdown, module by module.</p>
        </div>

        <div className="pb-pricing-table-container">
          <div className="pb-pt-grid">

            {/* Table Headers */}
            <div className="pb-pt-header-cell">
              <div style={{ textAlign: 'left', fontWeight: '700', fontSize: '18px', paddingTop: '30px', color: 'var(--ink)', fontFamily: "'Sora', sans-serif" }}>
                Features Overview
              </div>
            </div>

            <div className="pb-pt-header-cell">
              <div className="pb-pt-plan-name">Free</div>
              <div className="pb-pt-plan-price">₹0</div>
              <div className="pb-pt-plan-unit">Forever</div>
            </div>

            <div className="pb-pt-header-cell popular">
              <div className="pb-pt-plan-name">Growth</div>
              <div className="pb-pt-plan-price">{formatPrice(PLANS[1])}</div>
              <div className="pb-pt-plan-unit">/emp/mo</div>
            </div>

            <div className="pb-pt-header-cell">
              <div className="pb-pt-plan-name">Enterprise</div>
              <div className="pb-pt-plan-price">{formatPrice(PLANS[2])}</div>
              <div className="pb-pt-plan-unit">/emp/mo</div>
            </div>

            {/* Category 1: Core HR & Attendance */}
            <div className="pb-pt-category">Core HR & Attendance</div>

            <div className="pb-pt-row">
              <div className="pb-pt-feature-name">Employee Profiles</div>
              <div className="pb-pt-feature-val"><CheckCircle2 size={20} className="pb-pt-val-check" /></div>
              <div className="pb-pt-feature-val popular-col"><CheckCircle2 size={20} className="pb-pt-val-check" /></div>
              <div className="pb-pt-feature-val"><CheckCircle2 size={20} className="pb-pt-val-check" /></div>
            </div>

            <div className="pb-pt-row">
              <div className="pb-pt-feature-name">GPS Geofenced Attendance</div>
              <div className="pb-pt-feature-val"><Minus size={20} className="pb-pt-val-dash" /></div>
              <div className="pb-pt-feature-val popular-col"><CheckCircle2 size={20} className="pb-pt-val-check" /></div>
              <div className="pb-pt-feature-val"><CheckCircle2 size={20} className="pb-pt-val-check" /></div>
            </div>

            <div className="pb-pt-row">
              <div className="pb-pt-feature-name">Selfie Verification</div>
              <div className="pb-pt-feature-val"><Minus size={20} className="pb-pt-val-dash" /></div>
              <div className="pb-pt-feature-val popular-col"><CheckCircle2 size={20} className="pb-pt-val-check" /></div>
              <div className="pb-pt-feature-val"><CheckCircle2 size={20} className="pb-pt-val-check" /></div>
            </div>

            <div className="pb-pt-row">
              <div className="pb-pt-feature-name">Biometric Machine Sync</div>
              <div className="pb-pt-feature-val"><Minus size={20} className="pb-pt-val-dash" /></div>
              <div className="pb-pt-feature-val popular-col"><Minus size={20} className="pb-pt-val-dash" /></div>
              <div className="pb-pt-feature-val"><CheckCircle2 size={20} className="pb-pt-val-check" /></div>
            </div>

            {/* Category 2: Payroll & Compliance */}
            <div className="pb-pt-category">Payroll & Compliance</div>

            <div className="pb-pt-row">
              <div className="pb-pt-feature-name">Automated Salary Calculations</div>
              <div className="pb-pt-feature-val"><CheckCircle2 size={20} className="pb-pt-val-check" /></div>
              <div className="pb-pt-feature-val popular-col"><CheckCircle2 size={20} className="pb-pt-val-check" /></div>
              <div className="pb-pt-feature-val"><CheckCircle2 size={20} className="pb-pt-val-check" /></div>
            </div>

            <div className="pb-pt-row">
              <div className="pb-pt-feature-name">PF, ESI & Tax Deductions</div>
              <div className="pb-pt-feature-val"><Minus size={20} className="pb-pt-val-dash" /></div>
              <div className="pb-pt-feature-val popular-col"><CheckCircle2 size={20} className="pb-pt-val-check" /></div>
              <div className="pb-pt-feature-val"><CheckCircle2 size={20} className="pb-pt-val-check" /></div>
            </div>

            <div className="pb-pt-row">
              <div className="pb-pt-feature-name">One-Click Payslips</div>
              <div className="pb-pt-feature-val"><Minus size={20} className="pb-pt-val-dash" /></div>
              <div className="pb-pt-feature-val popular-col"><CheckCircle2 size={20} className="pb-pt-val-check" /></div>
              <div className="pb-pt-feature-val"><CheckCircle2 size={20} className="pb-pt-val-check" /></div>
            </div>

            <div className="pb-pt-row">
              <div className="pb-pt-feature-name">Expenses & Claims</div>
              <div className="pb-pt-feature-val"><Minus size={20} className="pb-pt-val-dash" /></div>
              <div className="pb-pt-feature-val popular-col"><Minus size={20} className="pb-pt-val-dash" /></div>
              <div className="pb-pt-feature-val"><CheckCircle2 size={20} className="pb-pt-val-check" /></div>
            </div>

            {/* Category 3: Advanced Workflows */}
            <div className="pb-pt-category">Advanced Workflows</div>

            <div className="pb-pt-row">
              <div className="pb-pt-feature-name">Leave & Shift Rosters</div>
              <div className="pb-pt-feature-val"><Minus size={20} className="pb-pt-val-dash" /></div>
              <div className="pb-pt-feature-val popular-col"><CheckCircle2 size={20} className="pb-pt-val-check" /></div>
              <div className="pb-pt-feature-val"><CheckCircle2 size={20} className="pb-pt-val-check" /></div>
            </div>

            <div className="pb-pt-row">
              <div className="pb-pt-feature-name">Multi-level Approvals</div>
              <div className="pb-pt-feature-val"><Minus size={20} className="pb-pt-val-dash" /></div>
              <div className="pb-pt-feature-val popular-col"><CheckCircle2 size={20} className="pb-pt-val-check" /></div>
              <div className="pb-pt-feature-val"><CheckCircle2 size={20} className="pb-pt-val-check" /></div>
            </div>

            <div className="pb-pt-row">
              <div className="pb-pt-feature-name">Document Vault (256-bit)</div>
              <div className="pb-pt-feature-val"><Minus size={20} className="pb-pt-val-dash" /></div>
              <div className="pb-pt-feature-val popular-col"><CheckCircle2 size={20} className="pb-pt-val-check" /></div>
              <div className="pb-pt-feature-val"><CheckCircle2 size={20} className="pb-pt-val-check" /></div>
            </div>

            <div className="pb-pt-row">
              <div className="pb-pt-feature-name">Company Announcements</div>
              <div className="pb-pt-feature-val"><Minus size={20} className="pb-pt-val-dash" /></div>
              <div className="pb-pt-feature-val popular-col"><CheckCircle2 size={20} className="pb-pt-val-check" /></div>
              <div className="pb-pt-feature-val"><CheckCircle2 size={20} className="pb-pt-val-check" /></div>
            </div>

            {/* Category 4: Premium Modules */}
            <div className="pb-pt-category">Premium Modules</div>

            <div className="pb-pt-row">
              <div className="pb-pt-feature-name">Performance & OKRs</div>
              <div className="pb-pt-feature-val"><Minus size={20} className="pb-pt-val-dash" /></div>
              <div className="pb-pt-feature-val popular-col"><Minus size={20} className="pb-pt-val-dash" /></div>
              <div className="pb-pt-feature-val"><CheckCircle2 size={20} className="pb-pt-val-check" /></div>
            </div>

            <div className="pb-pt-row">
              <div className="pb-pt-feature-name">Recruitment & ATS</div>
              <div className="pb-pt-feature-val"><Minus size={20} className="pb-pt-val-dash" /></div>
              <div className="pb-pt-feature-val popular-col"><Minus size={20} className="pb-pt-val-dash" /></div>
              <div className="pb-pt-feature-val"><CheckCircle2 size={20} className="pb-pt-val-check" /></div>
            </div>

            <div className="pb-pt-row">
              <div className="pb-pt-feature-name">AI HR Assistant</div>
              <div className="pb-pt-feature-val"><Minus size={20} className="pb-pt-val-dash" /></div>
              <div className="pb-pt-feature-val popular-col"><Minus size={20} className="pb-pt-val-dash" /></div>
              <div className="pb-pt-feature-val"><CheckCircle2 size={20} className="pb-pt-val-check" /></div>
            </div>

            <div className="pb-pt-row">
              <div className="pb-pt-feature-name">Dedicated Account Manager</div>
              <div className="pb-pt-feature-val"><Minus size={20} className="pb-pt-val-dash" /></div>
              <div className="pb-pt-feature-val popular-col"><Minus size={20} className="pb-pt-val-dash" /></div>
              <div className="pb-pt-feature-val"><CheckCircle2 size={20} className="pb-pt-val-check" /></div>
            </div>

            {/* Action Buttons Row */}
            <div className="pb-pt-row">
              <div className="pb-pt-feature-name" style={{ borderBottom: 'none' }}></div>
              <div className="pb-pt-feature-val" style={{ borderBottom: 'none', padding: '28px 24px' }}>
                <button className="pb-btn-ghost" style={{ width: '100%' }} onClick={() => onOpenLogin && onOpenLogin()}>Sign Up</button>
              </div>
              <div className="pb-pt-feature-val popular-col" style={{ borderBottom: 'none', padding: '28px 24px' }}>
                <button className="pb-btn-primary" style={{ width: '100%' }} onClick={() => onOpenLogin && onOpenLogin()}>Get Started</button>
              </div>
              <div className="pb-pt-feature-val" style={{ borderBottom: 'none', padding: '28px 24px' }}>
                <button className="pb-btn-ghost" style={{ width: '100%' }} onClick={() => onOpenLogin && onOpenLogin()}>Contact Sales</button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Pricing FAQ */}
      <section className="pb-faq pb-pricing-faq-wrap" id="pricing-faq">
        <div className="pb-section-head" style={{ marginBottom: 24 }}>
          <div className="pb-section-eyebrow">Billing questions</div>
          <h2 className="pb-section-title" style={{ fontSize: '28px' }}>Pricing FAQ</h2>
        </div>
        {PRICING_FAQS.map((item, i) => (
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
            <h2 className="pb-cta-title">Ready to automate your HR?</h2>
            <div className="pb-cta-sub">Start free — upgrade whenever you're ready.</div>
          </div>
          <button className="pb-btn-primary" onClick={() => onOpenLogin && onOpenLogin()}>Request Demo</button>
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
          </div>

          <div className="pb-footer-col">
            <h4>Quick Links</h4>
            <ul className="pb-footer-list">
              <li><a onClick={() => onBackToHome && onBackToHome()} style={{ cursor: 'pointer' }}>Home</a></li>
              <li><a style={{ cursor: 'pointer' }}>Pricing</a></li>
              <li><a href="#terms">Terms & Conditions</a></li>
              <li><a href="#privacy">Privacy Policy</a></li>
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
    </div>
  );
}