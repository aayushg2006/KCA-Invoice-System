const { admin, db } = require('../config/firebase');

async function initializeDatabase() {
  try {
    const currentYear = new Date().getFullYear();
    console.log('Starting database initialization...');

    await db.collection('counters').doc('invoiceCounter').set({
      lastNumber: 0,
      prefix: `KCA-${currentYear}-`,
      description: 'Tracks the latest invoice number for auto-generation',
      year: currentYear,
      updatedAt: admin.firestore.Timestamp.now(),
    });
    console.log('Counters collection initialized.');

    await db.collection('users').doc('admin_init').set({
      name: 'System Admin',
      role: 'admin',
      email: 'admin@kamathchess.com',
      createdAt: admin.firestore.Timestamp.now(),
    });
    console.log('Users collection initialized.');

    await db.collection('invoices').doc('schema_init').set({
      invoiceNumber: 'INIT-000',
      invoiceDate: admin.firestore.Timestamp.now(),
      studentName: 'Init',
      parentName: 'Init',
      age: 0,
      mobileNumber: '0000000000',
      gmailId: 'init@test.com',
      courseDetails: [],
      totalAmount: 0,
      paymentMode: 'System',
      pdfUrl: '',
      emailStatus: 'seeded',
      createdBy: 'admin_init',
      createdAt: admin.firestore.Timestamp.now(),
      signatureCaptured: false,
    });
    console.log('Invoices collection initialized.');

    console.log('Database setup complete. You can delete the seed documents later if you want.');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initializeDatabase();
