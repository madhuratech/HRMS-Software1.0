const PDFDocument = require('pdfkit');

class PayslipPdfService {
  /**
   * Format number as INR currency
   */
  static formatCurrency(num) {
    const val = Number(num) || 0;
    return 'Rs. ' + val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  /**
   * Render payslip elements onto a PDFDocument instance
   */
  static renderPayslipDoc(payrollData, doc) {
    const primaryColor = '#1E3A8A'; // Deep Navy Blue
    const secondaryColor = '#2563EB'; // Vibrant Blue
    const darkColor = '#0F172A';
    const grayColor = '#64748B';
    const lightGray = '#F1F5F9';
    const borderGray = '#CBD5E1';

    // 1. COMPANY HEADER BOX
    doc.rect(40, 40, 515, 80).fill('#F8FAFC');
    doc.rect(40, 40, 515, 80).stroke(borderGray);

    // Company Name & Subtitle
    const company = payrollData.company || {};
    doc.fontSize(18).fillColor(primaryColor).font('Helvetica-Bold')
       .text(company.company_name || 'Madhura Technologies', 55, 52);

    doc.fontSize(9).fillColor(grayColor).font('Helvetica')
       .text(company.head_office_address || 'Tamil Nadu, India', 55, 74)
       .text(`Email: ${company.official_email || 'hr@madhuratech.com'} | Tel: ${company.phone_number || '+91 9876543210'}`, 55, 88);

    // Payslip Title & Period Badge
    doc.fontSize(14).fillColor(darkColor).font('Helvetica-Bold')
       .text('SALARY PAYSLIP', 380, 52, { align: 'right', width: 160 });

    doc.fontSize(10).fillColor(secondaryColor).font('Helvetica-Bold')
       .text(`${payrollData.month} ${payrollData.year}`, 380, 72, { align: 'right', width: 160 });

    const statusText = (payrollData.status || 'Generated').toUpperCase();
    const statusColor = statusText === 'PAID' ? '#059669' : statusText === 'APPROVED' ? '#2563EB' : '#D97706';
    doc.fontSize(9).fillColor(statusColor).font('Helvetica-Bold')
       .text(`STATUS: ${statusText}`, 380, 88, { align: 'right', width: 160 });

    // 2. EMPLOYEE DETAILS SECTION
    let y = 135;
    doc.rect(40, y, 515, 75).fill('#FFFFFF');
    doc.rect(40, y, 515, 75).stroke(borderGray);

    doc.fontSize(9).fillColor(grayColor).font('Helvetica-Bold')
       .text('Employee Name:', 55, y + 10)
       .text('Employee ID:', 55, y + 26)
       .text('Designation:', 55, y + 42)
       .text('Department:', 55, y + 58);

    doc.fontSize(9).fillColor(darkColor).font('Helvetica-Bold')
       .text(payrollData.employee_name || 'Employee', 150, y + 10)
       .text(payrollData.emp_code || `EMP${payrollData.employee_id}`, 150, y + 26)
       .font('Helvetica')
       .text(payrollData.designation || 'Staff', 150, y + 42)
       .text(payrollData.department || 'General', 150, y + 58);

    doc.fontSize(9).fillColor(grayColor).font('Helvetica-Bold')
       .text('Date of Joining:', 320, y + 10)
       .text('Payment Mode:', 320, y + 26)
       .text('Loss of Pay (LOP):', 320, y + 42)
       .text('Disbursement Date:', 320, y + 58);

    const joinDateStr = payrollData.join_date ? new Date(payrollData.join_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
    const payDateStr = payrollData.payment_date ? new Date(payrollData.payment_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Pending';

    doc.fontSize(9).fillColor(darkColor).font('Helvetica')
       .text(joinDateStr, 430, y + 10)
       .text(payrollData.payment_mode || 'Bank Transfer', 430, y + 26)
       .text(`${payrollData.lop_days || 0} Day(s)`, 430, y + 42)
       .text(payDateStr, 430, y + 58);

    y += 90;

    // 3. EARNINGS & DEDUCTIONS TABLE
    const colWidth = 250;
    const tableX1 = 40;
    const tableX2 = 305;

    // Header Bars
    doc.rect(tableX1, y, colWidth, 24).fill(primaryColor);
    doc.rect(tableX2, y, colWidth, 24).fill(primaryColor);

    doc.fontSize(10).fillColor('#FFFFFF').font('Helvetica-Bold')
       .text('EARNINGS', tableX1 + 10, y + 7)
       .text('AMOUNT', tableX1 + colWidth - 75, y + 7, { align: 'right', width: 65 })
       .text('DEDUCTIONS', tableX2 + 10, y + 7)
       .text('AMOUNT', tableX2 + colWidth - 75, y + 7, { align: 'right', width: 65 });

    y += 24;

    const earningsItems = [
      { label: 'Basic Salary', val: payrollData.basic },
      { label: 'House Rent Allowance (HRA)', val: payrollData.hra },
      { label: 'Special / Other Allowances', val: payrollData.allowances },
      { label: 'Performance Bonus', val: payrollData.bonus },
      { label: 'Other Earnings / Reimbursement', val: payrollData.other_earnings }
    ];

    const deductionsItems = [
      { label: 'Provident Fund (PF - 12%)', val: payrollData.pf },
      { label: 'Employee State Insurance (ESI)', val: payrollData.esi },
      { label: 'Statutory Tax / PT / TDS', val: payrollData.tax },
      { label: `Loss of Pay (${payrollData.lop_days || 0}d LOP)`, val: payrollData.lop_amount },
      { label: 'Loan EMI / Advance Deductions', val: payrollData.other_deductions }
    ];

    const maxRows = Math.max(earningsItems.length, deductionsItems.length);
    const rowHeight = 22;

    for (let i = 0; i < maxRows; i++) {
      const bg = i % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
      doc.rect(tableX1, y, colWidth, rowHeight).fill(bg);
      doc.rect(tableX2, y, colWidth, rowHeight).fill(bg);
      doc.rect(tableX1, y, colWidth, rowHeight).stroke(borderGray);
      doc.rect(tableX2, y, colWidth, rowHeight).stroke(borderGray);

      const e = earningsItems[i];
      if (e) {
        doc.fontSize(8.5).fillColor(darkColor).font('Helvetica')
           .text(e.label, tableX1 + 10, y + 6)
           .font('Helvetica-Bold')
           .text(this.formatCurrency(e.val), tableX1 + colWidth - 85, y + 6, { align: 'right', width: 75 });
      }

      const d = deductionsItems[i];
      if (d) {
        doc.fontSize(8.5).fillColor(darkColor).font('Helvetica')
           .text(d.label, tableX2 + 10, y + 6)
           .font('Helvetica-Bold')
           .text(this.formatCurrency(d.val), tableX2 + colWidth - 85, y + 6, { align: 'right', width: 75 });
      }

      y += rowHeight;
    }

    // Totals Bar
    doc.rect(tableX1, y, colWidth, 26).fill('#EFF6FF');
    doc.rect(tableX2, y, colWidth, 26).fill('#FEF2F2');
    doc.rect(tableX1, y, colWidth, 26).stroke(borderGray);
    doc.rect(tableX2, y, colWidth, 26).stroke(borderGray);

    doc.fontSize(9.5).fillColor(primaryColor).font('Helvetica-Bold')
       .text('Gross Earnings (A):', tableX1 + 10, y + 7)
       .text(this.formatCurrency(payrollData.gross_salary), tableX1 + colWidth - 95, y + 7, { align: 'right', width: 85 });

    doc.fontSize(9.5).fillColor('#DC2626').font('Helvetica-Bold')
       .text('Total Deductions (B):', tableX2 + 10, y + 7)
       .text(this.formatCurrency(payrollData.total_deductions), tableX2 + colWidth - 95, y + 7, { align: 'right', width: 85 });

    y += 38;

    // 4. NET PAYABLE CARD
    doc.rect(40, y, 515, 60).fill('#ECFDF5');
    doc.rect(40, y, 515, 60).stroke('#86EFAC');

    doc.fontSize(11).fillColor('#166534').font('Helvetica-Bold')
       .text('NET SALARY PAYABLE (A - B):', 55, y + 16);

    doc.fontSize(8).fillColor('#15803D').font('Helvetica')
       .text('Transferred directly to registered corporate bank account', 55, y + 32);

    doc.fontSize(20).fillColor('#15803D').font('Helvetica-Bold')
       .text(this.formatCurrency(payrollData.net_salary), 280, y + 18, { align: 'right', width: 260 });

    y += 80;

    // 5. SIGNATURE & VERIFICATION SECTION
    doc.rect(40, y, 515, 65).fill('#FFFFFF');
    doc.rect(40, y, 515, 65).stroke(borderGray);

    doc.fontSize(8).fillColor(grayColor).font('Helvetica')
       .text('Employer Signature / Authority:', 55, y + 12)
       .text('Authorized Payroll Signatory', 55, y + 42);

    doc.fontSize(8).fillColor(grayColor).font('Helvetica')
       .text('Employee Signature:', 380, y + 12)
       .text('Acknowledged & Received', 380, y + 42);

    y += 80;

    // 6. FOOTER NOTE
    doc.fontSize(8).fillColor(grayColor).font('Helvetica-Oblique')
       .text('Note: This is a computer-generated payslip generated by Madhura HRMS. No physical signature is required.', 40, y, { align: 'center', width: 515 });

    doc.end();
  }

  /**
   * Stream PDF directly to HTTP response
   */
  static generatePayslipPdf(payrollData, res) {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    const empCode = payrollData.emp_code || (payrollData.employee_id ? `EMP${payrollData.employee_id}` : 'EMP');
    const safeMonth = (payrollData.month || 'Month').replace(/[^a-zA-Z0-9]/g, '');
    const safeYear = payrollData.year || new Date().getFullYear();
    const filename = `Payslip_${empCode}_${safeMonth}_${safeYear}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);
    this.renderPayslipDoc(payrollData, doc);
  }

  static generatePdfStream(payrollData, res) {
    return this.generatePayslipPdf(payrollData, res);
  }

  /**
   * Return PDF as a Promise resolving to a Buffer
   */
  static generatePdfBuffer(payrollData) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];
      doc.on('data', chunk => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      this.renderPayslipDoc(payrollData, doc);
    });
  }
}

module.exports = PayslipPdfService;
