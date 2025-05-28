import { call, put, takeLatest, select } from 'redux-saga/effects';
import { Platform } from 'react-native';
import * as IAP from 'react-native-iap';
import axios from 'axios';
import firestore from '@react-native-firebase/firestore';
import {
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
  selectIAPProducts,
  setPremiumStatus,
} from './iapSlice';

const FIREBASE_WEBHOOK_URL = 'https://receiptwebhook-3pkmzoynfa-uc.a.run.app';

const subscriptionIds = Platform.select({
  ios: ['wellie_sub_3m_29usd', 'wellie_sub_12m_199usd'],
  android: ['wellie_sub_3m_29usd', 'wellie_sub_12m_199usd'],
}) || [];

function* saveProductsToFirestoreSaga(products, platform) {
  if (!products || products.length === 0) {
    return;
  }
  try {
    const batch = firestore().batch();
    let writeCount = 0;

    for (const product of products) {
      if (!product.productId) continue;
      const docId = `${platform}_${product.productId}`;
      const productRef = firestore().collection('Subscriptions').doc(docId);
      let productData;
      if (Platform.OS === 'android') {
        productData = {
          productId: product.productId,
          platform: platform,
          title: product.title || product.localizedTitle || 'Unknown Title',
          price: product?.subscriptionOfferDetails?.[0]?.pricingPhases?.pricingPhaseList?.[0]?.formattedPrice || 'N/A',
          currency: product?.subscriptionOfferDetails?.[0]?.pricingPhases?.pricingPhaseList?.[0]?.priceCurrencyCode || 'N/A',
          type: product.type || 'subscription',
          updatedAt: firestore.FieldValue.serverTimestamp(),
        };
      } else if (Platform.OS === 'ios') {
        productData = {
        productId: product.productId,
        platform: platform,
        title: product.title || product.localizedTitle || 'Unknown Title',
        price: product?.localizedPrice || 'N/A',
        currency: product?.currency || 'N/A',
        type: product.type || 'subscription',
        updatedAt: firestore.FieldValue.serverTimestamp(),
      };
    }

      batch.set(productRef, productData, { merge: true });
      writeCount++;

      if (writeCount >= 400) {
        yield call([batch, 'commit']);
        batch = firestore().batch();
        writeCount = 0;
      }
    }

    if (writeCount > 0) {
      yield call([batch, 'commit']);
    }
  } catch (error) {
    console.error('Failed to save products to Firestore:', error);
  }
}


function* fetchProductsSaga() {
  try {
    const products = yield call(IAP.getSubscriptions, { skus: subscriptionIds });
    console.log('Products fetched (Full Structure): ', JSON.stringify(products, null, 2));

    if (!products || !Array.isArray(products)) {
      throw new Error('Invalid products format received from IAP.getSubscriptions.');
    }

    yield put(fetchProductsSuccess(products));
    yield call(saveProductsToFirestoreSaga, products, Platform.OS);
  } catch (error) {
    console.error('Fetch Products Error:', error);
    yield put(fetchProductsFailure(error?.message || 'Failed to fetch IAP products.'));
  }
}

function* validateReceiptSaga(action) {
  const { receipt, userId, isRestore } = action.payload || {};
  const receiptProductId = receipt?.productId;
  const platform = Platform.OS;

  console.log(`[${platform.toUpperCase()}] Validating receipt for product ID: ${receiptProductId} for user ID: ${userId}`);

  try {
    if (!receipt) {
      throw new Error('Missing receipt for validation.');
    }

    let payload;

    if (Platform.OS === 'ios') {
      const iosReceipt = receipt.transactionReceipt;
      if (!iosReceipt) throw new Error('Missing iOS transaction receipt.');

      payload = {
        latest_receipt: iosReceipt,
        userId: userId || '',
        productId: receipt.productId || 'unknown',
        transactionId: receipt.transactionId || '',
        platform: 'iOS',
        isRestore: !!isRestore,
      };
    } else if (Platform.OS === 'android') {
      const androidPurchaseToken = receipt.purchaseToken;
      if (!androidPurchaseToken) throw new Error('Missing Android purchase token.');

      payload = {
        purchaseToken: androidPurchaseToken,
        userId: userId,
        productId: receipt.productId || 'unknown',
        transactionId: receipt.transactionId || '',
        platform: 'Android',
        isRestore: !!isRestore,
      };
    } else {
      throw new Error(`Unsupported platform: ${Platform.OS}`);
    }

    console.log(`[${Platform.OS.toUpperCase()}] Sending validation payload to webhook`, JSON.stringify(payload));

    const response = yield call(axios.post, FIREBASE_WEBHOOK_URL, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
    });

    const responseData = response?.data;
    if (responseData?.validationStatus === 'Valid') {
      yield put(validateReceiptSuccess());
      console.log(`[${Platform.OS.toUpperCase()}] Receipt validated successfully.`);
      if (typeof responseData?.isPremium === 'boolean') {
          yield put(setPremiumStatus(responseData.isPremium));
      } else {
           yield put(setPremiumStatus(true));
      }
    } else {
      throw new Error(responseData?.message || 'Receipt validation failed.');
    }

  } catch (error) {
    console.error(`[VALIDATION ERROR]:`, error);

    let errorMessage = 'Receipt validation failed.';
    if (error.response) {
      errorMessage = `Server Error: ${error.response?.data?.message || error.response.status}`;
    } else if (error.request) {
      errorMessage = 'Network error. Please check your internet connection.';
    } else {
      errorMessage = error.message || 'Unknown error occurred during validation.';
    }

    yield put(validateReceiptFailure(errorMessage));
    yield put(setPremiumStatus(false));
  }
}

function* restorePurchasesSaga(action) {
  const { userId } = action.payload || {};
  const platform = Platform.OS;

  try {
    if (!userId) throw new Error('Missing user ID for restore.');

    const restoredPurchases = yield call(IAP.getAvailablePurchases);

    console.log("TT500: Restored Purchases: ", JSON.stringify(restoredPurchases, null, 2));
    
    if (Array.isArray(restoredPurchases) && restoredPurchases.length > 0) {
      const sortedAvailablePurchases = restoredPurchases.sort(
        (a, b) => b.transactionDate - a.transactionDate
      );
      const latestPurchase = sortedAvailablePurchases[0].transactionReceipt;
      console.log("TT501: latestPurchase: ", JSON.stringify(latestPurchase, null, 2));
      yield put(validateReceiptRequest({
        receipt: latestPurchase,
        isNewPurchase: false,
        userId: userId,
        isRestore: true,
      }));
    } else {
      throw new Error('No available purchases to restore.');
    }

    yield put(restorePurchasesSuccess());

  } catch (error) {
    console.log('TT1905:IAP restorePurchasesFailure');
    console.error(`[${platform.toUpperCase()} Restore] TT1905:IAP restorePurchasesFailure:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Restore purchases failed.';
    yield put(restorePurchasesFailure({ error: errorMessage, userId: userId }));
    yield put(setPremiumStatus(false));
  }
}


function* handleRestoreFailureSaga(action) {
  const { error: restoreError, userId } = action.payload || {};
  const platform = Platform.OS;
  if (!userId) {
    console.error('[Restore Failure Handler] Critical: userId is missing in restorePurchasesFailure action payload. Cannot perform cleanup.');
    return;
  }

  try {
    console.log(`TT1905:IAP restorePurchasesFailure: Attempting to remove Firestore subscriptions for user: ${userId}`);

    const subscriptionCollectionRef = firestore()
      .collection('users')
      .doc(userId)
      .collection('userSubscription');

    const subscriptionSnapshot = yield call([subscriptionCollectionRef, 'get']);

    if (subscriptionSnapshot.empty) {
      console.log(`[Restore Failure Handler] No Firestore subscriptions found for user ${userId} to remove.`);
      return;
    }

    console.log(`[Restore Failure Handler] Found ${subscriptionSnapshot.size} subscription documents to remove for user ${userId}.`);

    const batch = firestore().batch();
    let deleteCount = 0;

    subscriptionSnapshot.docs.forEach((doc) => {
      console.log(`[Restore Failure Handler] Queuing deletion for Firestore doc: ${doc.ref.path}`);
      batch.delete(doc.ref);
      deleteCount++;
    });

    yield call([batch, 'commit']);
    console.log(`[Restore Failure Handler] Successfully removed ${deleteCount} Firestore subscription(s) for user ${userId}.`);

  } catch (deleteError) {
    console.error(`[Restore Failure Handler] Failed to remove Firestore subscriptions for user ${userId}:`, deleteError);
  }
}


function* fetchPurchaseHistorySaga(action) {
  const { userId } = action.payload || {};

  try {
    if (!userId) throw new Error('Missing user ID for purchase history.');

    const history = yield call(IAP.getPurchaseHistory);

    if (Array.isArray(history) && history.length > 0) {
      yield put(purchaseHistorySuccess());
    } else {
      yield put(purchaseHistoryFailure('No purchase history found.'));
    }

  } catch (error) {
    console.error('[PURCHASE HISTORY ERROR]:', error);
    yield put(purchaseHistoryFailure(error?.message || 'Failed to fetch purchase history.'));
  }
}

export function* watchIAP() {
  yield takeLatest(fetchProductsRequest.type, fetchProductsSaga);
  yield takeLatest(validateReceiptRequest.type, validateReceiptSaga);
  yield takeLatest(restorePurchasesRequest.type, restorePurchasesSaga);
  yield takeLatest(purchaseHistoryRequest.type, fetchPurchaseHistorySaga);
  yield takeLatest(restorePurchasesFailure.type, handleRestoreFailureSaga);
}
