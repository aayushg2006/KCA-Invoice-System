const fs = require('fs');
const path = require('path');
const { getDefaultArtwork } = require('./invoiceArtwork');

const templatePath = path.resolve(__dirname, '../../assets/templates/kca-invoice-template.png');

let templateMeta = null;

function readPngDimensions(buffer) {
  if (buffer.length < 24) {
    throw new Error('Template image is too small to read PNG dimensions.');
  }

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function toDataUrl(buffer) {
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

function getTemplateMeta() {
  if (!templateMeta) {
    const templateBuffer = fs.readFileSync(templatePath);
    const dimensions = readPngDimensions(templateBuffer);

    templateMeta = {
      dataUrl: toDataUrl(templateBuffer),
      ...dimensions,
    };
  }

  return templateMeta;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatAmount(value) {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(invoiceDate) {
  const date = invoiceDate instanceof Date ? invoiceDate : new Date(invoiceDate);

  return {
    day: String(date.getDate()).padStart(2, '0'),
    month: String(date.getMonth() + 1).padStart(2, '0'),
    year: String(date.getFullYear()),
  };
}

function createIcon(type, className = 'icon-svg') {
  const base = `class="${className}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"`;

  switch (type) {
    case 'card':
      return `
        <svg ${base}>
          <rect x="3" y="5.5" width="18" height="13" rx="2.5" stroke="currentColor" stroke-width="1.8" />
          <path d="M3.5 10H20.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
          <path d="M7 14.5H10.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
        </svg>
      `;
    case 'cap':
      return `
        <svg ${base}>
          <path
            d="M12 4.75L3.5 9.25L12 13.75L20.5 9.25L12 4.75Z"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linejoin="round"
          />
          <path
            d="M7.5 11.5V15C7.5 16.8 9.51 18.25 12 18.25C14.49 18.25 16.5 16.8 16.5 15V11.5"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path d="M20.5 9.25V14.25" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
        </svg>
      `;
    case 'mail':
      return `
        <svg ${base}>
          <rect x="3.5" y="5.5" width="17" height="13" rx="2" stroke="currentColor" stroke-width="1.8" />
          <path
            d="M4.5 7L12 13L19.5 7"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      `;
    case 'phone':
      return `
        <svg ${base}>
          <path
            d="M7.1 4.85C7.63 4.32 8.49 4.32 9.02 4.85L10.78 6.61C11.31 7.14 11.31 8 10.78 8.53L9.72 9.59C10.44 10.86 11.33 12.04 12.39 13.1C13.45 14.16 14.63 15.05 15.9 15.77L16.96 14.71C17.49 14.18 18.35 14.18 18.88 14.71L20.64 16.47C21.17 17 21.17 17.86 20.64 18.39L19.53 19.5C18.59 20.44 17.14 20.69 15.93 20.12C13.48 18.97 11.26 17.23 9.33 15.3C7.4 13.37 5.66 11.15 4.51 8.7C3.94 7.49 4.19 6.04 5.13 5.1L7.1 4.85Z"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      `;
    case 'users':
      return `
        <svg ${base}>
          <path
            d="M9.5 10.25A3.25 3.25 0 1 0 9.5 3.75A3.25 3.25 0 0 0 9.5 10.25Z"
            stroke="currentColor"
            stroke-width="1.8"
          />
          <path
            d="M16.25 9A2.5 2.5 0 1 0 16.25 4"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
          />
          <path
            d="M3.75 18.75C4.26 15.95 6.72 13.9 9.65 13.9C12.58 13.9 15.04 15.95 15.55 18.75"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
          />
          <path
            d="M15.1 14.55C17.16 14.95 18.79 16.54 19.25 18.55"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
          />
        </svg>
      `;
    case 'user':
    default:
      return `
        <svg ${base}>
          <path
            d="M12 10.5A3.75 3.75 0 1 0 12 3A3.75 3.75 0 0 0 12 10.5Z"
            stroke="currentColor"
            stroke-width="1.8"
          />
          <path
            d="M4.5 20.25C5.17 17.1 8.11 14.75 12 14.75C15.89 14.75 18.83 17.1 19.5 20.25"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
          />
        </svg>
      `;
  }
}

function buildDateMarkup(date) {
  return `
    <span class="date-group">
      <span class="date-segment">${escapeHtml(date.day)}</span>
      <span class="date-divider">/</span>
      <span class="date-segment">${escapeHtml(date.month)}</span>
      <span class="date-divider">/</span>
      <span class="date-segment year">${escapeHtml(date.year)}</span>
    </span>
  `;
}

function buildStudentRowsMarkup(invoice) {
  const rows = [
    {
      icon: 'user',
      label: 'Student Name',
      value: `<span class="lined-value">${escapeHtml(invoice.studentName)}</span>`,
    },
    {
      icon: 'users',
      label: 'Parent Name',
      value: `<span class="lined-value">${escapeHtml(invoice.parentName)}</span>`,
    },
    {
      icon: 'user',
      label: 'Age of Student',
      value: `
        <div class="age-value">
          <span class="lined-value age-number">${escapeHtml(String(invoice.age))}</span>
          <span class="age-suffix">years</span>
        </div>
      `,
    },
    {
      icon: 'phone',
      label: 'Mobile Number',
      value: `<span class="lined-value">${escapeHtml(invoice.mobileNumber)}</span>`,
    },
    {
      icon: 'mail',
      label: 'Gmail ID',
      value: `<span class="lined-value">${escapeHtml(invoice.gmailId)}</span>`,
    },
  ];

  return rows
    .map(
      (row) => `
        <tr>
          <td class="icon-cell">${createIcon(row.icon)}</td>
          <td class="label-cell">${escapeHtml(row.label)}</td>
          <td class="colon-cell">:</td>
          <td class="value-cell">${row.value}</td>
        </tr>
      `
    )
    .join('');
}

function buildCourseRowsMarkup(courseRows) {
  return courseRows
    .map((row) => {
      const amount = `&#8377; ${escapeHtml(formatAmount(Number(row.amount)))}`;

      return `
        <tr class="course-row">
          <td class="course-title-cell">${escapeHtml(row.title)}</td>
          <td class="course-amount-cell">
            <span class="rupee-amount">${amount}</span>
          </td>
        </tr>
      `;
    })
    .join('');
}

function createInvoiceHtml(invoice) {
  const date = formatDate(invoice.invoiceDate);
  const template = getTemplateMeta();
  const artwork = getDefaultArtwork();
  const courseRows =
    Array.isArray(invoice.visibleCourseRows) && invoice.visibleCourseRows.length > 0
      ? invoice.visibleCourseRows
      : Array.isArray(invoice.courseDetails)
        ? invoice.courseDetails
        : [];
  const courseTableClass =
    courseRows.length > 5 ? 'course-table tight' : courseRows.length > 3 ? 'course-table compact' : 'course-table';

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(invoice.invoiceNumber)}</title>
        <style>
          @page {
            margin: 0;
            size: ${template.width}px ${template.height}px;
          }

          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          html,
          body {
            margin: 0;
            width: ${template.width}px;
            height: ${template.height}px;
            background: #ffffff;
            font-family: Arial, Helvetica, sans-serif;
          }

          body {
            color: #101828;
          }

          .page {
            position: relative;
            width: ${template.width}px;
            height: ${template.height}px;
            overflow: hidden;
            background-image: url("${template.dataUrl}");
            background-repeat: no-repeat;
            background-size: cover;
            background-position: center top;
          }

          .content-surface {
            position: absolute;
            left: 36px;
            right: 36px;
            top: 448px;
            bottom: 96px;
            background: rgba(255, 255, 255, 0.98);
          }

          .content {
            position: absolute;
            left: 48px;
            right: 48px;
            top: 466px;
            bottom: 108px;
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .section {
            position: relative;
            border: 2px solid #1f8fe8;
            border-radius: 18px;
            background: rgba(255, 255, 255, 0.98);
            box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.55) inset;
          }

          .titled-section {
            padding-top: 22px;
          }

          .meta-card + .titled-section,
          .titled-section + .titled-section {
            margin-top: 12px;
          }

          .section-pill {
            position: absolute;
            left: 0;
            top: -18px;
            display: inline-flex;
            align-items: center;
            gap: 12px;
            padding: 8px 20px 8px 12px;
            min-height: 48px;
            border-radius: 16px 16px 6px 6px;
            background: linear-gradient(90deg, #0f87ea 0%, #37a4ff 100%);
            color: #ffffff;
            font-size: 18px;
            font-weight: 800;
            letter-spacing: 0.04em;
            box-shadow: 0 10px 22px rgba(15, 135, 234, 0.18);
          }

          .pill-icon {
            width: 30px;
            height: 30px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.16);
            color: #ffffff;
            flex: 0 0 auto;
          }

          .icon-svg {
            display: block;
            width: 24px;
            height: 24px;
          }

          .meta-card {
            min-height: 62px;
            padding: 12px 22px;
          }

          .meta-grid {
            display: grid;
            grid-template-columns: minmax(0, 1fr) 304px;
            gap: 20px;
            align-items: center;
          }

          .meta-item {
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 0;
            font-size: 22px;
          }

          .meta-label {
            font-weight: 800;
            white-space: nowrap;
          }

          .meta-value {
            min-width: 0;
            flex: 1 1 auto;
            padding: 0 8px 3px;
            border-bottom: 1.4px solid rgba(15, 23, 42, 0.6);
            font-weight: 700;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .meta-date {
            justify-content: flex-end;
          }

          .date-group {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 0 4px 3px;
            border-bottom: 1.4px solid rgba(15, 23, 42, 0.6);
            font-weight: 700;
          }

          .date-segment {
            min-width: 28px;
            text-align: center;
          }

          .date-segment.year {
            min-width: 54px;
          }

          .date-divider {
            font-weight: 800;
          }

          .student-table,
          .course-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            table-layout: fixed;
          }

          .student-table td {
            padding: 11px 14px;
            font-size: 19px;
            vertical-align: middle;
          }

          .student-table tr + tr td {
            border-top: 1.2px solid rgba(15, 23, 42, 0.18);
          }

          .icon-cell {
            width: 46px;
            color: #1b92e8;
            text-align: center;
          }

          .label-cell {
            width: 258px;
            font-weight: 800;
            border-right: 1.2px solid rgba(15, 23, 42, 0.18);
          }

          .colon-cell {
            width: 34px;
            font-weight: 800;
            text-align: center;
          }

          .value-cell {
            font-weight: 700;
            color: #111827;
          }

          .lined-value {
            display: block;
            min-height: 24px;
            padding: 0 6px 3px;
            border-bottom: 1.2px solid rgba(15, 23, 42, 0.52);
            word-break: break-word;
          }

          .age-value {
            display: flex;
            align-items: flex-end;
            gap: 12px;
          }

          .age-number {
            width: 172px;
          }

          .age-suffix {
            padding-bottom: 3px;
            font-size: 18px;
            font-weight: 700;
          }

          .course-body {
            overflow: hidden;
            border-radius: 14px;
          }

          .course-table th {
            padding: 14px 18px;
            background: #050613;
            color: #ffffff;
            font-size: 18px;
            font-weight: 800;
            letter-spacing: 0.04em;
            text-transform: uppercase;
          }

          .course-table th:first-child {
            border-top-left-radius: 14px;
          }

          .course-table th:last-child {
            width: 242px;
            border-top-right-radius: 14px;
            text-align: center;
          }

          .course-table tbody td,
          .course-table tfoot td {
            padding: 12px 18px;
            border-top: 1.2px solid rgba(15, 23, 42, 0.18);
            font-size: 19px;
            vertical-align: middle;
          }

          .course-table tbody td:first-child,
          .course-table tfoot td:first-child {
            border-right: 1.2px solid rgba(15, 23, 42, 0.18);
          }

          .course-title-cell {
            padding-left: 24px;
            font-weight: 600;
            line-height: 1.35;
          }

          .course-amount-cell {
            text-align: center;
            font-weight: 700;
            white-space: nowrap;
          }

          .rupee-amount,
          .total-amount {
            display: inline-flex;
            align-items: baseline;
            gap: 8px;
          }

          .course-table.compact tbody td {
            padding-top: 10px;
            padding-bottom: 10px;
            font-size: 18px;
          }

          .course-table.tight tbody td {
            padding-top: 8px;
            padding-bottom: 8px;
            font-size: 17px;
          }

          .course-table tfoot td {
            background: linear-gradient(90deg, rgba(229, 243, 255, 0.92) 0%, rgba(208, 233, 255, 0.96) 100%);
            font-size: 20px;
            font-weight: 800;
          }

          .course-table tfoot td:first-child {
            padding-right: 22px;
            text-align: right;
            border-bottom-left-radius: 14px;
          }

          .course-table tfoot td:last-child {
            border-bottom-right-radius: 14px;
            text-align: center;
          }

          .bottom-stack {
            margin-top: auto;
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .payment-card {
            padding: 10px 16px;
          }

          .payment-row {
            display: flex;
            align-items: center;
            gap: 14px;
            min-height: 34px;
          }

          .inline-icon {
            width: 38px;
            height: 38px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            background: linear-gradient(180deg, #0f87ea 0%, #33a2ff 100%);
            color: #ffffff;
            flex: 0 0 auto;
          }

          .payment-label {
            color: #1b92e8;
            font-size: 18px;
            font-weight: 800;
            letter-spacing: 0.05em;
          }

          .payment-value {
            font-size: 19px;
            font-weight: 700;
            color: #111827;
          }

          .signature-card {
            padding: 16px 20px 12px;
          }

          .signature-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            min-height: 158px;
          }

          .signature-panel {
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 34px 18px 10px;
          }

          .signature-panel + .signature-panel {
            border-left: 1.2px solid rgba(15, 23, 42, 0.2);
          }

          .panel-badge {
            position: absolute;
            left: 50%;
            top: -6px;
            transform: translateX(-50%);
            display: inline-block;
            padding: 8px 18px 9px;
            background: #050613;
            color: #ffffff;
            border-radius: 0 0 16px 16px;
            font-size: 15px;
            font-weight: 800;
            letter-spacing: 0.05em;
            white-space: nowrap;
          }

          .signature-image {
            width: 226px;
            height: 122px;
            object-fit: contain;
            object-position: center center;
            mix-blend-mode: multiply;
          }

          .signature-line {
            width: 278px;
            margin-top: 10px;
            border-bottom: 1.4px solid rgba(15, 23, 42, 0.62);
          }

          .signature-note {
            margin-top: 6px;
            font-size: 17px;
            color: #111827;
          }

          .stamp-mark {
            width: 156px;
            height: 156px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .stamp-mark img {
            width: 156px;
            height: 156px;
            object-fit: contain;
          }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="content-surface" aria-hidden="true"></div>

          <div class="content">
            <section class="section meta-card">
              <div class="meta-grid">
                <div class="meta-item">
                  <span class="meta-label">Invoice No:</span>
                  <span class="meta-value">${escapeHtml(invoice.invoiceNumber)}</span>
                </div>

                <div class="meta-item meta-date">
                  <span class="meta-label">Date:</span>
                  ${buildDateMarkup(date)}
                </div>
              </div>
            </section>

            <section class="section titled-section">
              <div class="section-pill">
                <span class="pill-icon">${createIcon('user')}</span>
                <span>STUDENT &amp; PARENT DETAILS</span>
              </div>

              <table class="student-table">
                <tbody>
                  ${buildStudentRowsMarkup(invoice)}
                </tbody>
              </table>
            </section>

            <section class="section titled-section">
              <div class="section-pill">
                <span class="pill-icon">${createIcon('cap')}</span>
                <span>COURSE DETAILS</span>
              </div>

              <div class="course-body">
                <table class="${courseTableClass}">
                  <thead>
                    <tr>
                      <th>DESCRIPTION / TITLE OF THE COURSE</th>
                      <th>AMOUNT (&#8377;)</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${buildCourseRowsMarkup(courseRows)}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td>TOTAL AMOUNT PAID</td>
                      <td>
                        <span class="total-amount">&#8377; ${escapeHtml(formatAmount(invoice.totalAmount))}</span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>

            <div class="bottom-stack">
              <section class="section payment-card">
                <div class="payment-row">
                  <span class="inline-icon">${createIcon('card')}</span>
                  <span class="payment-label">PAYMENT MODE:</span>
                  <span class="payment-value">${escapeHtml(invoice.paymentMode)}</span>
                </div>
              </section>

              <section class="section signature-card">
                <div class="signature-grid">
                  <div class="signature-panel">
                    <span class="panel-badge">ACADEMY SIGNATURE</span>
                    <img
                      class="signature-image"
                      src="${invoice.signatureDataUrl || artwork.signatureDataUrl}"
                      alt="Academy signature"
                    />
                    <div class="signature-line"></div>
                    <div class="signature-note">(Sign Here)</div>
                  </div>

                  <div class="signature-panel">
                    <span class="panel-badge">AUTHORIZED STAMP</span>
                    <div class="stamp-mark">
                      <img src="${artwork.stampDataUrl}" alt="Kamath Chess Academy stamp" />
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

module.exports = {
  createInvoiceHtml,
  formatAmount,
  formatDate,
  getTemplateMeta,
};
