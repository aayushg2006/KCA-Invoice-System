export type CourseDetail = {
  amount: number | string;
  title: string;
};

export type CreateInvoicePayload = {
  age: number | string;
  courseDetails: CourseDetail[];
  createdBy: string;
  gmailId: string;
  invoiceDate: string;
  mobileNumber: string;
  parentName: string;
  paymentMode: 'Cash' | 'UPI' | 'Bank Transfer';
  signatureDataUrl?: string;
  studentName: string;
};

export type InvoiceRecord = {
  age: number;
  courseDetails: CourseDetail[];
  createdAt: string | null;
  createdBy: string;
  emailMessage: string;
  emailStatus: string;
  gmailId: string;
  id: string;
  invoiceDate: string | null;
  invoiceNumber: string;
  mobileNumber: string;
  parentName: string;
  paymentMode: string;
  pdfUrl: string;
  studentName: string;
  totalAmount: number;
};

export type CreateInvoiceResponse = {
  invoice: InvoiceRecord;
  message: string;
};
