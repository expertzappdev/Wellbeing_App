import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, PermissionsAndroid } from 'react-native';
import MainNavigation from '../navigation/MainNavigation';
import messaging from '@react-native-firebase/messaging';
import { useDispatch, useSelector } from 'react-redux';
import * as IAP from 'react-native-iap';
import useIAP from '../services/IAP';
import {
  restorePurchasesRequest,
  fetchProductsRequest,
  restorePurchasesFailure,
  selectIAPLoading,
  restorePurchasesSuccess,
  validateReceiptSuccess
} from '../redux/slices/iap/iapSlice';
import { fetchExploreDataRequest } from '../redux/slices/explore/exploreSlice';
import analytics from '@react-native-firebase/analytics';
import crashlytics from '@react-native-firebase/crashlytics';
import DailyDiaryReminder from './DailyDiaryReminder';
import { selectUser } from '../redux/slices/auth/authSlice';
import CustomSplashScreen from '../components/CustomSplashScreen';
import i18n from 'i18next';
import * as RNLocalize from 'react-native-localize';
import LottieView from 'lottie-react-native';
import { styleConstants } from '../utils/styleConstants';
import { useTranslation } from 'react-i18next';

const RootContainer = () => {
  const dispatch = useDispatch();
  const { exploreData = {} } = useSelector((state) => state.explore || {});
  const loggedUser = useSelector(selectUser);
  const iapLoading = useSelector(selectIAPLoading);
  // const { loading: iapHookLoading } = useIAP(); // iapHookLoading not used
  const { t, i18n } = useTranslation(); // t not used in this snippet directly
  const [isAppLoading, setIsAppLoading] = useState(true); // For the 5-second minimum splash

  const ASYNC_STORAGE_USER_LANG_KEY = 'userLanguage';
  const supportedLanguages = ['en', 'de'];
  const defaultLanguage = 'en';

  const initializeLanguage = async () => {
    let languageToSet = defaultLanguage;
    try {
      const locales = RNLocalize.getLocales();
      let deviceLanguageCode = null;
      if (locales && locales.length > 0) {
        deviceLanguageCode = locales[0].languageCode;
      }
      crashlytics().log(`Detected device language code: ${deviceLanguageCode}`);
      if (deviceLanguageCode === 'de') {
        languageToSet = 'de';
        crashlytics().log('Device language is German, setting app language to de.');
      } else {
        const storedLanguage = await AsyncStorage.getItem(ASYNC_STORAGE_USER_LANG_KEY);
        if (storedLanguage && supportedLanguages.includes(storedLanguage)) {
          languageToSet = storedLanguage;
          crashlytics().log(`Stored language found and supported: ${storedLanguage}. Setting app language.`);
        } else {
          crashlytics().log(`No device German, and no supported stored language found. Using default language: ${defaultLanguage}.`);
          // languageToSet remains defaultLanguage
        }
      }
      if (i18n.language !== languageToSet) {
         await i18n.changeLanguage(languageToSet);
      }
      await AsyncStorage.setItem(ASYNC_STORAGE_USER_LANG_KEY, languageToSet);
      crashlytics().log(`Final app language set and stored: ${languageToSet}`);
    } catch (error) {
      console.error('Error initializing language:', error);
      crashlytics().recordError(error, 'RootContainer: Language Initialization Failed');
      try {
        if (!i18n.language || i18n.language !== defaultLanguage) {
             await i18n.changeLanguage(defaultLanguage);
        }
        await AsyncStorage.setItem(ASYNC_STORAGE_USER_LANG_KEY, defaultLanguage);
        crashlytics().log(`Error fallback: Language set to ${defaultLanguage}.`);
      } catch (fallbackError) {
        console.error('Error setting fallback language:', fallbackError);
        crashlytics().recordError(fallbackError, 'RootContainer: Fallback Language Set Failed');
      }
    }
  };

  useEffect(() => {
    const initializeAppSpecifics = async () => {
      if (loggedUser?.uid) {
        if (!IAP || !IAP.initConnection) {
          crashlytics().log('IAP module is not available for logged in user.');
          dispatch(restorePurchasesFailure({ message: 'IAP module not available.' }));
          console.log('TT1905:IAP restorePurchasesFailure');
          return;
        }
        try {
          await IAP.initConnection();
          crashlytics().log('IAP Connection Initialized for logged in user.');
          dispatch(fetchProductsRequest());
          dispatch(restorePurchasesRequest({ userId: loggedUser.uid }));
        } catch (error) {
          crashlytics().recordError(error, 'Unhandled IAP.initConnection error for logged in user');
          dispatch(restorePurchasesFailure(error?.message || 'Failed to initialize IAP.'));
        }
      } else {
        if (IAP && IAP.initConnection) {
            try {
                await IAP.initConnection();
                crashlytics().log('IAP Connection Initialized for guest user.');
                dispatch(fetchProductsRequest());
            } catch (guestIapError) {
                crashlytics().recordError(guestIapError, 'Guest IAP.initConnection error');
            }
        }
      }
    };

    initializeAppSpecifics();

    if (loggedUser?.uid) {
      setIsAppLoading(true);
      const timer = setTimeout(() => {
        setIsAppLoading(false);
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      setIsAppLoading(false);
    }
  }, [dispatch, loggedUser?.uid]);

  useEffect(() => {
    initializeLanguage();
    (async () => {
      try {
        await analytics().logEvent('root_container_mounted', { timestamp: Date.now() });
        await registerForRemoteMessages();
        await requestPushPermission();
        dispatch(fetchExploreDataRequest());
        crashlytics().log('Explore data fetch dispatched');
      } catch (error) {
        crashlytics().recordError(error, 'RootContainer general init failed');
      }
    })();
  }, [dispatch]);

  const requestPushPermission = async () => {
    try {
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        ).catch((err) => {
          crashlytics().recordError(err, 'Permission request failed');
          return null;
        });

        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          crashlytics().log('Notification permission not granted');
        }
      }

      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      crashlytics().log(`Notification permission status: ${enabled}`);
    } catch (error) {
      crashlytics().recordError(error, 'requestPushPermission error');
    }
  };

  const registerForRemoteMessages = async () => {
    try {
      await messaging().registerDeviceForRemoteMessages();
      crashlytics().log('Device registered for remote messages');
      await getDeviceToken();
    } catch (error) {
      crashlytics().recordError(error, 'registerForRemoteMessages error');
    }
  };

  const getDeviceToken = async () => {
    try {
      const token = await messaging().getToken();
      if (token) {
        await AsyncStorage.setItem('deviceToken', token);
        crashlytics().log('Device token saved to AsyncStorage');
      }
    } catch (error) {
      crashlytics().recordError(error, 'getDeviceToken error');
    }
  };

  if (loggedUser && (iapLoading || isAppLoading)) {
    return <CustomSplashScreen />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <MainNavigation />
        <DailyDiaryReminder />
      </NavigationContainer>
    </GestureHandlerRootView>
  );
};

export default RootContainer;
