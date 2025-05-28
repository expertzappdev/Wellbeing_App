import React, { useEffect, useState } from 'react';
import { View, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector } from 'react-redux';
import { selectUser, selectAuthIsWelcome } from '../redux/slices/auth/authSlice';
import { selectIsPremium } from '../redux/slices/iap/iapSlice';
import { styleConstants } from '../utils/styleConstants';

// Import screens
import SignupScreen from '../screens/SignupScreen';
import LoginScreen from '../screens/LoginScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import HomeScreen from '../screens/HomeScreen';
import Explore from '../screens/Explore';
import CardDetail from '../screens/CardDetail';
import ProfileScreen from '../screens/ProfileScreen';
import TermsAndServices from '../components/TermsServices';
import PrivacyPolicy from '../components/PrivacyPolicy';
import Welcome from '../components/Swiper';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import AuthOptionsScreen from '../components/AuthOptions';
import OTPVerificationScreen from '../screens/OTPVerificationScreen';
import { useTranslation } from 'react-i18next';
import ReminderSettings from '../components/ReminderSettings';
import UserSubscriptionScreen from '../components/UserSubscription';
import SupportInfo from '../components/SupportInfo';
import CustomSplashScreen from '../components/CustomSplashScreen';

// Create navigators
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function BottomTabs() {
    const { t } = useTranslation();
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={{ flex: 1 }}>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;
              if (route.name === 'Home') {
                iconName = focused ? 'home' : 'home-outline';
              } else if (route.name === 'Explore') {
                iconName = focused ? 'ellipse-outline' : 'ellipse-outline';
              } else if (route.name === 'Profile') {
                iconName = focused ? 'person' : 'person-outline';
              }
              return <Ionicons name={iconName} size={styleConstants.typography.fontSizes.lg} color={color} />;
            },
            tabBarActiveTintColor: 'tomato',
            tabBarInactiveTintColor: 'gray',
            tabBarStyle: {
              display: keyboardVisible ? 'none' : 'flex',
            },
          })}
        >
          <Tab.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
          <Tab.Screen name="Explore" component={Explore} options={{ headerShown: false }} />
          <Tab.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
        </Tab.Navigator>
      </View>
    </KeyboardAvoidingView>
  );
}

export default function MainNavigation() {
  const user = useSelector(selectUser);
  const isWelcome = useSelector(selectAuthIsWelcome);
  const isPremiumUser = useSelector(selectIsPremium);
  const [initializing, setInitializing] = useState(true);

  
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);

  useEffect(() => {
    const checkWelcomeStatus = async () => {
      try {
        const seenWelcome = await AsyncStorage.getItem('hasSeenWelcome');
        setHasSeenWelcome(!!seenWelcome);
      } catch (error) {
        console.error('Failed to load welcome status:', error);
      } finally {
        setInitializing(false); 
      }
    };

    checkWelcomeStatus();
  }, []);

  useEffect(() => {
    if (user && !hasSeenWelcome) {
      AsyncStorage.setItem('hasSeenWelcome', 'true').catch(error => {
        console.error('Failed to set welcome status:', error);
      });
    }
  }, [user, hasSeenWelcome]);

  if (initializing && !user) {
    return <CustomSplashScreen />;
  }

  return (
    <Stack.Navigator>
      {!user ? (
        <>
          <Stack.Screen name="Swiper" component={Welcome} options={{ headerShown: false }} />
          <Stack.Screen name="Signup" component={SignupScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: false }} />
          <Stack.Screen name="OTPVerify" component={OTPVerificationScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AuthOptions" component={AuthOptionsScreen} options={{ headerShown: false }} />
        </>
      ) : (
        <>
          {!isWelcome && (
            <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
          )}
          <Stack.Screen name="Main" component={BottomTabs} options={{ headerShown: false }} initialParams={{ reset: true }} />
          <Stack.Screen name="TermsAndServices" component={TermsAndServices} options={{ headerShown: false }} />
          <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicy} options={{ headerShown: false }} />
          <Stack.Screen name="CardDetail" component={CardDetail} options={{ headerShown: false }} />
          <Stack.Screen name="ReminderSettings" component={ReminderSettings} options={{ headerShown: false }} />
          <Stack.Screen name="UserSubscription" component={UserSubscriptionScreen} options={{ headerShown: false }} />
          <Stack.Screen name="SupportInfo" component={SupportInfo} options={{ headerShown: false }} />
        </>
      )}
    </Stack.Navigator>
  );
}
