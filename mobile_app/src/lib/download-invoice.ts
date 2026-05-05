import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Linking, Platform } from 'react-native';

import type { InvoiceRecord } from '@/src/types/invoice';

export type InvoicePdfTarget = Pick<InvoiceRecord, 'invoiceNumber' | 'pdfUrl'>;

export async function saveInvoicePdf(invoice: InvoicePdfTarget) {
  if (Platform.OS === 'web') {
    return {
      localUri: invoice.pdfUrl,
      message: 'Invoice is ready to preview in the app.',
    };
  }

  const invoicesDirectory = new Directory(Paths.cache, 'kca-invoices');
  invoicesDirectory.create({ idempotent: true, intermediates: true });
  const targetFile = new File(invoicesDirectory, `${invoice.invoiceNumber}.pdf`);

  const downloadedFile = await File.downloadFileAsync(invoice.pdfUrl, targetFile, {
    idempotent: true,
  });

  return {
    localUri: downloadedFile.uri,
    message: 'Invoice is ready to preview and share.',
  };
}

export async function shareInvoicePdf(localUri: string) {
  if (Platform.OS === 'web') {
    await Linking.openURL(localUri);
    return;
  }

  const isAvailable = await Sharing.isAvailableAsync();

  if (!isAvailable) {
    throw new Error('Sharing is not available on this device.');
  }

  await Sharing.shareAsync(localUri, {
    dialogTitle: 'Share invoice PDF',
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
  });
}
