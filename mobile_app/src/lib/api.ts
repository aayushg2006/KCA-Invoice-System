import Constants from 'expo-constants';
import { create } from 'axios';
import type {
  CreateInvoicePayload,
  CreateInvoiceResponse,
  InvoiceRecord,
} from '@/src/types/invoice';

const configuredBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL || Constants.expoConfig?.extra?.apiBaseUrl;

export const API_BASE_URL =
  configuredBaseUrl || 'https://kca-invoice-backend-497170441120.asia-south1.run.app/api';

// Create an Axios client that forces the phone to wait up to 2 minutes
const apiClient = create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 120 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function createInvoice(payload: CreateInvoicePayload) {
  try {
    const response = await apiClient.post<CreateInvoiceResponse>('/invoices', payload);
    return response.data;
  } catch (error: any) {
    const message =
      error.response?.data?.message || error.message || 'The backend request failed.';
    throw new Error(message);
  }
}

export async function fetchRecentInvoices(limit = 25) {
  try {
    const response = await apiClient.get<{ invoices: InvoiceRecord[] }>(
      `/invoices/recent?limit=${limit}`
    );
    return response.data.invoices;
  } catch (error: any) {
    const message =
      error.response?.data?.message || error.message || 'Failed to fetch recent invoices.';
    throw new Error(message);
  }
}
