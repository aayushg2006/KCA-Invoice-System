import Constants from 'expo-constants';

import type {
  CreateInvoicePayload,
  CreateInvoiceResponse,
  InvoiceRecord,
} from '@/src/types/invoice';

const configuredBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL || Constants.expoConfig?.extra?.apiBaseUrl;

export const API_BASE_URL = configuredBaseUrl || 'http://127.0.0.1:4000/api';

async function readJson<T>(response: Response): Promise<T> {
  const data = await response.json();

  if (!response.ok) {
    const message =
      typeof data?.message === 'string' ? data.message : 'The backend request failed.';
    throw new Error(message);
  }

  return data as T;
}

export async function createInvoice(payload: CreateInvoicePayload) {
  const response = await fetch(`${API_BASE_URL}/invoices`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return readJson<CreateInvoiceResponse>(response);
}

export async function fetchRecentInvoices(limit = 25) {
  const response = await fetch(`${API_BASE_URL}/invoices/recent?limit=${limit}`);
  const data = await readJson<{ invoices: InvoiceRecord[] }>(response);
  return data.invoices;
}
