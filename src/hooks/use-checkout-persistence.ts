import { useState, useEffect, useCallback } from 'react';

const CHECKOUT_STORAGE_KEY = 'checkout_form_state';
const CHECKOUT_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface CheckoutFormState {
  shippingData: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    province: string;
    postalCode: string;
  };
  step: 'shipping' | 'delivery' | 'payment';
  selectedShippingService?: string;
  certifications?: {
    phytoCertificate: boolean;
    inspectionCertificate: boolean;
    plantInspection: boolean;
  };
  timestamp: number;
}

const defaultShippingData = {
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  province: '',
  postalCode: '',
};

const defaultCertifications = {
  phytoCertificate: false,
  inspectionCertificate: false,
  plantInspection: false,
};

export function useCheckoutPersistence() {
  const [isRestored, setIsRestored] = useState(false);

  // Load saved state from localStorage
  const loadSavedState = useCallback((): Partial<CheckoutFormState> | null => {
    try {
      const saved = localStorage.getItem(CHECKOUT_STORAGE_KEY);
      if (!saved) return null;

      const parsed: CheckoutFormState = JSON.parse(saved);
      
      // Check if expired
      if (Date.now() - parsed.timestamp > CHECKOUT_EXPIRY_MS) {
        localStorage.removeItem(CHECKOUT_STORAGE_KEY);
        return null;
      }

      return parsed;
    } catch (error) {
      console.warn('Failed to load checkout state:', error);
      localStorage.removeItem(CHECKOUT_STORAGE_KEY);
      return null;
    }
  }, []);

  // Save state to localStorage
  const saveState = useCallback((state: Omit<CheckoutFormState, 'timestamp'>) => {
    try {
      const stateWithTimestamp: CheckoutFormState = {
        ...state,
        timestamp: Date.now(),
      };
      localStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(stateWithTimestamp));
    } catch (error) {
      console.warn('Failed to save checkout state:', error);
    }
  }, []);

  // Clear saved state (on successful checkout)
  const clearSavedState = useCallback(() => {
    try {
      localStorage.removeItem(CHECKOUT_STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear checkout state:', error);
    }
  }, []);

  return {
    loadSavedState,
    saveState,
    clearSavedState,
    isRestored,
    setIsRestored,
    defaultShippingData,
    defaultCertifications,
  };
}
