import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const ZOHO_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/zoho-crm`;
const TOKEN_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/zoho-token`;

// Secure token management via edge function (no localStorage)
async function callTokenFunction(action: string, token?: string) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(TOKEN_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ action, provider: 'zoho', token }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Token operation failed');
  }

  return response.json();
}

// Hook to check if Zoho is connected
export function useZohoConnectionStatus() {
  return useQuery({
    queryKey: ['zoho-connection-status'],
    queryFn: async () => {
      const result = await callTokenFunction('check');
      return result.connected as boolean;
    },
    retry: false,
  });
}

// Hook to connect/update Zoho token
export function useSetZohoToken() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (token: string) => callTokenFunction('set', token),
    onSuccess: () => {
      toast.success('Zoho CRM connected securely');
      queryClient.invalidateQueries({ queryKey: ['zoho-connection-status'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to connect: ${error.message}`);
    },
  });
}

// Hook to disconnect Zoho
export function useDisconnectZoho() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => callTokenFunction('delete'),
    onSuccess: () => {
      toast.success('Zoho CRM disconnected');
      queryClient.invalidateQueries({ queryKey: ['zoho-connection-status'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to disconnect: ${error.message}`);
    },
  });
}

// Internal function to call Zoho edge function (token retrieved server-side)
async function callZohoFunction(action: string, data?: unknown) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(ZOHO_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ action, data }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Zoho sync failed');
  }

  return response.json();
}

export function useSyncCustomer() {
  return useMutation({
    mutationFn: (customer: unknown) => callZohoFunction('sync_customer', customer),
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
    mutationFn: (order: unknown) => callZohoFunction('sync_order', order),
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
    mutationFn: (lead: unknown) => callZohoFunction('sync_lead', lead),
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

// Legacy exports for backwards compatibility (deprecated - will be removed)
/** @deprecated Use useSetZohoToken instead */
export const setZohoRefreshToken = (_token: string) => {
  console.warn('setZohoRefreshToken is deprecated. Use useSetZohoToken hook instead.');
};
