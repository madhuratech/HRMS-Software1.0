-- Schema patch to create tables and seed them

CREATE TABLE IF NOT EXISTS company_profile (
    id INT PRIMARY KEY DEFAULT 1,
    company_name VARCHAR(255) DEFAULT 'Hawkeye Nest Technologies Pvt Ltd',
    legal_company_name VARCHAR(255) DEFAULT 'Hawkeye Nest Technologies Private Limited',
    company_code VARCHAR(50) DEFAULT 'HNTPL',
    company_type VARCHAR(100) DEFAULT 'Private Limited',
    industry VARCHAR(100) DEFAULT 'Information Technology',
    business_type VARCHAR(100) DEFAULT 'Service',
    year_established VARCHAR(50) DEFAULT '2018',
    number_of_employees VARCHAR(50) DEFAULT '250',
    financial_year VARCHAR(100) DEFAULT 'April - March',
    
    -- contact
    official_email VARCHAR(100) DEFAULT 'info@hawkeyenest.com',
    hr_email VARCHAR(100) DEFAULT 'hr@hawkeyenest.com',
    support_email VARCHAR(100) DEFAULT 'support@hawkeyenest.com',
    website VARCHAR(100) DEFAULT 'www.hawkeyenest.com',
    phone_number VARCHAR(50) DEFAULT '+91 9876543210',
    mobile_number VARCHAR(50) DEFAULT '+91 98765 43210',
    alternate_number VARCHAR(50) DEFAULT '+91 98765 43211',
    fax_number VARCHAR(50) DEFAULT '+91 44 1234 5679',
    linkedin_url VARCHAR(255) DEFAULT 'https://linkedin.com/company/hawkeyenest',
    facebook_url VARCHAR(255) DEFAULT 'https://facebook.com/hawkeyenest',
    twitter_url VARCHAR(255) DEFAULT 'https://twitter.com/hawkeyenest',
    instagram_url VARCHAR(255) DEFAULT 'https://instagram.com/hawkeyenest',
    
    -- address
    head_office_address1 VARCHAR(255) DEFAULT 'No. 123, Tech Park, Tower A',
    head_office_address2 VARCHAR(255) DEFAULT '4th Floor, Unit 401',
    head_office_landmark VARCHAR(255) DEFAULT 'Near Tidel Park',
    head_office_city VARCHAR(100) DEFAULT 'Chennai',
    head_office_state VARCHAR(100) DEFAULT 'Tamil Nadu',
    head_office_country VARCHAR(100) DEFAULT 'India',
    head_office_zip_code VARCHAR(50) DEFAULT '600096',
    head_office_google_maps_url VARCHAR(255) DEFAULT 'https://maps.google.com/?q=Chennai',
    branch_name VARCHAR(255) DEFAULT 'Bengaluru Branch',
    branch_address VARCHAR(255) DEFAULT 'No. 45, 80 Feet Road, Koramangala',
    branch_city VARCHAR(100) DEFAULT 'Bengaluru',
    branch_state VARCHAR(100) DEFAULT 'Karnataka',
    branch_country VARCHAR(100) DEFAULT 'India',
    branch_zip_code VARCHAR(50) DEFAULT '560034',
    
    -- business
    gst_number VARCHAR(50) DEFAULT '33ABCDE1234F1Z5',
    pan_number VARCHAR(50) DEFAULT 'ABCDE1234F',
    cin_number VARCHAR(50) DEFAULT 'U72900TN2024PTC123456',
    tan_number VARCHAR(50) DEFAULT 'CHNH01234E',
    msme_number VARCHAR(50) DEFAULT 'UDYAM-TN-01-0012345',
    iec_code VARCHAR(50) DEFAULT '0102030405',
    pf_registration_number VARCHAR(100) DEFAULT 'TN/MAS/0012345/000',
    esi_registration_number VARCHAR(100) DEFAULT '31000123450001001',
    professional_tax_number VARCHAR(100) DEFAULT 'PT123456789',
    labour_license_number VARCHAR(100) DEFAULT 'LL/MAS/2018/12345',
    shop_establishment_number VARCHAR(100) DEFAULT 'SE/MAS/2018/67890',
    
    -- hr_settings
    employee_id_prefix VARCHAR(50) DEFAULT 'HNT',
    auto_generate_employee_id VARCHAR(50) DEFAULT 'Yes',
    default_department VARCHAR(100) DEFAULT 'Engineering',
    default_designation VARCHAR(100) DEFAULT 'Software Engineer',
    probation_period VARCHAR(50) DEFAULT '6',
    notice_period VARCHAR(50) DEFAULT '90',
    default_shift VARCHAR(100) DEFAULT '09:30 AM - 06:30 PM',
    working_days VARCHAR(100) DEFAULT 'Monday - Friday',
    weekend_policy VARCHAR(100) DEFAULT 'Saturday & Sunday Off',
    attendance_method VARCHAR(100) DEFAULT 'Biometric & Web Check-in',
    biometric_enabled BOOLEAN DEFAULT TRUE,
    overtime_enabled BOOLEAN DEFAULT FALSE,
    leave_carry_forward BOOLEAN DEFAULT TRUE,
    
    -- payroll
    payroll_frequency VARCHAR(50) DEFAULT 'Monthly',
    salary_cycle VARCHAR(100) DEFAULT '1st to End of Month',
    salary_payment_date VARCHAR(50) DEFAULT '30',
    basic_salary_pct VARCHAR(50) DEFAULT '50',
    hra_pct VARCHAR(50) DEFAULT '40',
    pf_enabled BOOLEAN DEFAULT TRUE,
    esi_enabled BOOLEAN DEFAULT TRUE,
    professional_tax BOOLEAN DEFAULT TRUE,
    tds_enabled BOOLEAN DEFAULT TRUE,
    bonus_enabled BOOLEAN DEFAULT FALSE,
    gratuity_enabled BOOLEAN DEFAULT TRUE,
    payroll_approval VARCHAR(100) DEFAULT 'HR & Finance Head',
    
    -- banking
    bank_name VARCHAR(100) DEFAULT 'HDFC Bank',
    bank_branch_name VARCHAR(100) DEFAULT 'OMR Branch',
    account_holder_name VARCHAR(255) DEFAULT 'Hawkeye Nest Technologies Pvt. Ltd.',
    account_number VARCHAR(100) DEFAULT '50100234567890',
    confirm_account_number VARCHAR(100) DEFAULT '50100234567890',
    ifsc_code VARCHAR(50) DEFAULT 'HDFC0001234',
    swift_code VARCHAR(50) DEFAULT 'HDFCINBB',
    micr_code VARCHAR(50) DEFAULT '600240012',
    upi_id VARCHAR(100) DEFAULT 'hawkeyenest@hdfc',
    salary_payment_method VARCHAR(100) DEFAULT 'Bank Transfer',
    
    -- branding
    company_theme_color VARCHAR(50) DEFAULT '#2453D4',
    secondary_theme_color VARCHAR(50) DEFAULT '#64748B',
    company_logo_name VARCHAR(255) DEFAULT 'logo.png',
    favicon_name VARCHAR(255) DEFAULT 'favicon.ico',
    login_bg_name VARCHAR(255) DEFAULT 'login-bg.jpg',
    dashboard_banner_name VARCHAR(255) DEFAULT 'banner.png',
    email_header_logo_name VARCHAR(255) DEFAULT 'email-header.png',
    email_footer_logo_name VARCHAR(255) DEFAULT 'email-footer.png',
    company_seal_name VARCHAR(255) DEFAULT 'company-seal.png',
    digital_signature_name VARCHAR(255) DEFAULT 'signature.png',
    
    -- documents
    documents TEXT,
    
    -- system_settings
    language VARCHAR(100) DEFAULT 'English (US)',
    time_zone VARCHAR(100) DEFAULT '(UTC+05:30) Asia/Kolkata',
    currency VARCHAR(50) DEFAULT 'INR',
    date_format VARCHAR(50) DEFAULT 'DD/MM/YYYY',
    time_format VARCHAR(50) DEFAULT '12 Hour (AM/PM)',
    password_policy VARCHAR(255) DEFAULT 'Strong (Min 8 chars, 1 Uppercase, 1 Number, 1 Special)',
    two_factor_authentication BOOLEAN DEFAULT TRUE,
    session_timeout VARCHAR(50) DEFAULT '30 Minutes',
    login_attempts VARCHAR(50) DEFAULT '5',
    email_notification BOOLEAN DEFAULT TRUE,
    sms_notification BOOLEAN DEFAULT FALSE,
    push_notification BOOLEAN DEFAULT TRUE,
    smtp VARCHAR(100) DEFAULT 'smtp.gmail.com',
    sms_gateway VARCHAR(100) DEFAULT 'Twilio',
    google_workspace VARCHAR(100) DEFAULT 'Connected',
    microsoft_365 VARCHAR(100) DEFAULT 'Disconnected',
    biometric_device VARCHAR(100) DEFAULT 'Connected'
);

CREATE TABLE IF NOT EXISTS activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_email VARCHAR(100) NOT NULL,
    action VARCHAR(255) NOT NULL,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert seed record
INSERT IGNORE INTO company_profile (id) VALUES (1);
