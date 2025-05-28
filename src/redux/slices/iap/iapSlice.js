import { createSlice } from '@reduxjs/toolkit';

const iapSlice = createSlice({
  name: 'iap',
  initialState: {
    products: [], 
    isPremium: false, 
    loading: true, 
    error: null,
    selectedProduct: {
      productId: null,
      productTitle: '',
      localizedPrice: '',
    },
  },
  reducers: {
    fetchProductsRequest: (state) => {
      state.error = null;
    },
    fetchProductsSuccess: (state, action) => {
      state.products = action.payload;
    },
    fetchProductsFailure: (state, action) => {
      state.error = action.payload;
    },
    validateReceiptRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    validateReceiptSuccess: (state) => {
      state.loading = false;
      state.isPremium = true;
    },
    validateReceiptFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
      state.isPremium = false;
    },
    restorePurchasesRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    restorePurchasesSuccess: (state) => {
      // state.loading = false;
    },
    restorePurchasesFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    purchaseHistoryRequest: (state) => {
      state.error = null;
    },
    purchaseHistorySuccess: (state) => {
    },
    purchaseHistoryFailure: (state, action) => {
      state.error = action.payload;
    },
    setSelectedProduct: (state, action) => {
      state.selectedProduct.productId = action.payload.productId;
      state.selectedProduct.productTitle = action.payload.title;
      state.selectedProduct.localizedPrice = action.payload.localizedPrice;
    },
    clearSelectedProduct: (state) => {
      state.selectedProduct.productId = null;
      state.selectedProduct.productTitle = '';
      state.selectedProduct.localizedPrice = '';
    },
     setPremiumStatus: (state, action) => {
      state.isPremium = action.payload;
      // state.loading = false;
    }
  },
});

export const {
  fetchProductsRequest,
  fetchProductsSuccess,
  fetchProductsFailure,
  validateReceiptRequest,
  validateReceiptSuccess,
  validateReceiptFailure,
  restorePurchasesRequest,
  restorePurchasesSuccess,
  restorePurchasesFailure,
  purchaseHistoryRequest,
  purchaseHistorySuccess,
  purchaseHistoryFailure,
  setSelectedProduct,
  clearSelectedProduct,
  setPremiumStatus,
} = iapSlice.actions;

export const selectIAPProducts = (state) => state.iap.products;
export const selectIsPremium = (state) => state.iap.isPremium;
export const selectIAPLoading = (state) => state.iap.loading;
export const selectSelectedProduct = (state) => state.iap.selectedProduct;
export const selectSelectedProductId = (state) => state.iap.selectedProduct.productId;
export const selectSelectedProductTitle = (state) => state.iap.selectedProduct.productTitle;
export const selectSelectedProductPrice = (state) => state.iap.selectedProduct.localizedPrice;

export default iapSlice.reducer;
