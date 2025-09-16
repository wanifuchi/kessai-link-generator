'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { PaymentStore, PaymentService, PaymentCredentials, PaymentRequest, PaymentLinkResponse } from '@/types/payment';

// セキュリティ上の理由で、認証情報は持続化しない
const initialState = {
  selectedService: null,
  credentials: null,
  paymentRequest: null,
  generatedLink: null,
  isLoading: false,
  error: null,
};

export const usePaymentStore = create<PaymentStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setSelectedService: (service: PaymentService) => {
        set((state) => ({
          ...state,
          selectedService: service,
          credentials: null, // サービス変更時に認証情報をクリア
          error: null,
        }));
      },

      setCredentials: (credentials: PaymentCredentials) => {
        set((state) => ({
          ...state,
          credentials,
          error: null,
        }));
      },

      setPaymentRequest: (paymentRequest: PaymentRequest) => {
        set((state) => ({
          ...state,
          paymentRequest,
          error: null,
        }));
      },

      setGeneratedLink: (generatedLink: PaymentLinkResponse) => {
        set((state) => ({
          ...state,
          generatedLink,
          error: generatedLink.error || null,
        }));
      },

      setLoading: (isLoading: boolean) => {
        set((state) => ({
          ...state,
          isLoading,
        }));
      },

      setError: (error: string | null) => {
        set((state) => ({
          ...state,
          error,
          isLoading: false,
        }));
      },

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'payment-generator-storage',
      storage: createJSONStorage(() => {
        if (typeof window === 'undefined') {
          // SSR環境では何もしない
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return sessionStorage;
      }),
      // 認証情報など機密データは持続化しない
      partialize: (state) => ({
        selectedService: state.selectedService,
        paymentRequest: state.paymentRequest,
        // credentials と generatedLink は含めない（セキュリティ上の理由）
      }),
      version: 1,
      migrate: (persistedState: any, version: number) => {
        // バージョン管理とマイグレーション
        if (version < 1) {
          return initialState;
        }
        return persistedState;
      },
    }
  )
);

// セレクター関数（パフォーマンス最適化用）
export const useSelectedService = () => usePaymentStore((state) => state.selectedService);
export const useCredentials = () => usePaymentStore((state) => state.credentials);
export const usePaymentRequest = () => usePaymentStore((state) => state.paymentRequest);
export const useGeneratedLink = () => usePaymentStore((state) => state.generatedLink);
export const useIsLoading = () => usePaymentStore((state) => state.isLoading);
export const useError = () => usePaymentStore((state) => state.error);

// アクション関数（使いやすさのため）
export const usePaymentActions = () => usePaymentStore((state) => ({
  setSelectedService: state.setSelectedService,
  setCredentials: state.setCredentials,
  setPaymentRequest: state.setPaymentRequest,
  setGeneratedLink: state.setGeneratedLink,
  setLoading: state.setLoading,
  setError: state.setError,
  reset: state.reset,
}));

// 計算された値（派生状態）
export const useIsReadyToGenerate = () => 
  usePaymentStore((state) => 
    !!(state.selectedService && state.credentials && state.paymentRequest)
  );

export const useCurrentStep = () => 
  usePaymentStore((state) => {
    if (!state.selectedService) return 1;
    if (!state.credentials) return 2;
    if (!state.paymentRequest) return 3;
    if (state.generatedLink?.success) return 5;
    return 4;
  });

// デバッグ用（開発環境のみ）
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  (window as any).paymentStore = usePaymentStore;
}