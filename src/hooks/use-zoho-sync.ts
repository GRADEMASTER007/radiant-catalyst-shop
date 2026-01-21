import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

const ZOHO_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/zoho-crm`;

// Store refresh token securely (in production, this should be in a secure backend store)
const getRefreshToken = () => {
  return localStorage.getItem('zoho_refresh_token');
};

export const setZohoRefreshToken = (token: string) => {
  localStorage.setItem('zoho_refresh_token', token);
};

async function callZohoFunction(action: string, data?: any) {
  const refreshToken = getRefreshToken();
  
  if (!refreshToken) {
    throw new Error('Zoho not connected. Please configure your refresh token.');
  }

  const response = await fetch(ZOHO_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ action, data, refreshToken }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Zoho sync failed');
  }

  return response.json();
}

export function useSyncCustomer() {
  return useMutation({
    mutationFn: (customer: any) => callZohoFunction('sync_customer', customer),
    onSuccess: () => {
      toast.success('Customer synced to Zoho CRM');
    },
    onError: (error: Error) => {
      toast.error(`Sync failed: ${error.message}`);
    },
  });
}

export function useSyncOrder() {
  return useMutation({
    mutationFn: (order: any) => callZohoFunction('sync_order', order),
    onSuccess: () => {
      toast.success('Order synced to Zoho CRM');
    },
    onError: (error: Error) => {
      toast.error(`Sync failed: ${error.message}`);
    },
  });
}

export function useSyncLead() {
  return useMutation({
    mutationFn: (lead: any) => callZohoFunction('sync_lead', lead),
    onSuccess: () => {
      toast.success('Lead synced to Zoho CRM');
    },
    onError: (error: Error) => {
      toast.error(`Sync failed: ${error.message}`);
    },
  });
}

export function useGetZohoLeads() {
  return useMutation({
    mutationFn: () => callZohoFunction('get_leads'),
  });
}

export function useGetZohoContacts() {
  return useMutation({
    mutationFn: () => callZohoFunction('get_contacts'),
  });
}
