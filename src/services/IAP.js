import { useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import * as IAP from 'react-native-iap';
import { useDispatch, useSelector } from 'react-redux';
import { selectUser } from '../redux/slices/auth/authSlice';
import {
  fetchProductsRequest,
  validateReceiptRequest,
  selectIAPProducts,
  selectIsPremium,
  selectIAPLoading,
} from '../redux/slices/iap/iapSlice';

const useIAP = () => {
  const dispatch = useDispatch();
  const loggedInUser = useSelector(selectUser);
  const products = useSelector(selectIAPProducts);
  const isPremium = useSelector(selectIsPremium);
  const loading = useSelector(selectIAPLoading);

  useEffect(() => {
    let purchaseUpdateSubscription = null;
    let purchaseErrorSubscription = null;

    const initializeIAP = async () => {
      try {
        const result = await IAP.initConnection();
        // if (__DEV__) console.log('IAP connection initialized:', result);
        dispatch(fetchProductsRequest());
      } catch (error) {
        console.error('IAP initialization error:', error);
        Alert.alert('Error', 'Failed to initialize in-app purchases. Please try again later.');
      }
    };

    const setupListeners = () => {
      purchaseUpdateSubscription = IAP.purchaseUpdatedListener(async (purchase) => {
        try {
          if (purchase?.transactionReceipt) {
            dispatch(validateReceiptRequest({
              receipt: purchase,
              isNewPurchase: true,
              userId: loggedInUser?.uid,
              isRestore: false
            }));
          }
        } catch (error) {
          console.error('Error in purchase update listener:', error);
        }
      });

      purchaseErrorSubscription = IAP.purchaseErrorListener((error) => {
        console.error('Purchase Error Listener:', error);
      });
    };

    initializeIAP();
    setupListeners();

    return () => {
      IAP.endConnection();
      purchaseUpdateSubscription?.remove?.();
      purchaseErrorSubscription?.remove?.();
    };
  }, [dispatch, loggedInUser?.uid]);

  const handleiOSSubscription = async (productId) => {
    if (!productId || typeof productId !== 'string') {
      console.error('Invalid productId:', productId);
      return;
    }

    // console.log('TT201: Handling iOS subscription for productId:', productId);

    try {
      const subscription = await IAP.requestSubscription({ sku: productId });
      if (__DEV__) console.log('iOS Subscription Result:', subscription);
      if (subscription?.transactionReceipt) {
        dispatch(validateReceiptRequest({
          receipt: subscription,
          isNewPurchase: true,
          userId: loggedInUser?.uid,
          isRestore: false
        }));
      }
    } catch (error) {
      console.error('iOS Subscription Error:', error);
      Alert.alert('Subscription Error', error?.message || 'Something went wrong with your subscription.');
    }
  };

  const handleAndroidSubscription = async (productId, offerToken) => {
    if (!productId || typeof productId !== 'string') {
      console.error('Invalid productId:', productId);
      return;
    }

    if (!offerToken || typeof offerToken !== 'string') {
      console.error('Invalid offerToken:', offerToken);
      return;
    }

    const userId = loggedInUser?.uid;

    const getBase64 = (str) => {
      try {
        return btoa(str);
      } catch (e) {
        return Buffer.from(str).toString('base64');
      }
    };

    try {
      const subscription = await IAP.requestSubscription({
        sku: productId,
        subscriptionOffers: [{
          sku: productId,
          offerToken,
        }],
        ...(userId && { obfuscatedAccountIdAndroid: getBase64(userId) })
      });

      if (__DEV__) console.log('Android Subscription Result:', subscription);

      if (subscription?.transactionReceipt) {
        dispatch(validateReceiptRequest({
          receipt: subscription,
          isNewPurchase: true,
          userId,
          isRestore: false
        }));
      }
    } catch (error) {
      console.error('Android Subscription Error:', error);

      switch (error?.code) {
        case 'E_USER_CANCELLED':
          // console.log('User cancelled the subscription.');
          break;
        case 'E_NETWORK_ERROR':
          Alert.alert('Network Error', 'Please check your internet connection and try again.');
          break;
        case 'E_ITEM_ALREADY_OWNED':
          Alert.alert('Already Subscribed', 'You already have an active subscription.');
          break;
        case 'E_ITEM_UNAVAILABLE':
          Alert.alert('Unavailable', 'This subscription is currently unavailable.');
          break;
        default:
          Alert.alert('Subscription Error', `An error occurred (${error.code || 'Unknown'}): ${error.message || 'Please try again later.'}`);
          break;
      }
    }
  };

  return {
    products,
    isPremium,
    loading,
    handleiOSSubscription,
    handleAndroidSubscription,
  };
};

export default useIAP;
