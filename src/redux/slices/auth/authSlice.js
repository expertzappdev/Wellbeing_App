import { createSlice } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    userSubscriptions: [],
    isLoading: false,
    error: null,
    isWelcomeShown: false,
    language: null,
    isOtpLoading: false,
    otpError: null,
    otpSentSuccess: false,
    otpVerifiedSuccess: false,
    isLoadingReminderSave: false,
    reminderSaveError: null,
  },
  reducers: {
    loginRequest: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.isLoading = false;
      state.user = action.payload;
      state.isOtpLoading = false;
      state.otpError = null;
      state.otpSentSuccess = false;
      state.otpVerifiedSuccess = false;
    },
    loginFailure: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    signupRequest: (state) => {
      state.isLoading = true;
      state.isWelcomeShown = false;
      state.error = null;
    },
    signupSuccess: (state, action) => {
      state.isLoading = false;
      state.user = action.payload;
      state.isOtpLoading = false;
      state.otpError = null;
      state.otpSentSuccess = false;
      state.otpVerifiedSuccess = false;
    },
    signupFailure: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    googleLoginRequest: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    facebookLoginRequest: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    appleLoginRequest: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    socialLoginSuccess: (state, action) => {
      state.isLoading = false;
      state.user = action.payload;
      state.isOtpLoading = false;
      state.otpError = null;
      state.otpSentSuccess = false;
      state.otpVerifiedSuccess = false;
    },
    socialLoginFailure: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.userSubscriptions = [];
      state.error = null;
      state.language = null;
      state.isOtpLoading = false;
      state.otpError = null;
      state.otpSentSuccess = false;
      state.otpVerifiedSuccess = false;
      state.isLoadingReminderSave = false;
      state.reminderSaveError = null;
      AsyncStorage.getItem('userLanguage')
        .then((lang) => {
          return AsyncStorage.clear().then(() => {
            if (lang) {
              return AsyncStorage.setItem('userLanguage', lang);
            }
          });
        })
        .catch((error) => {
          console.error('Error preserving userLanguage during logout:', error);
        });
    },
    getUserByIdRequest: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    getUserByIdSuccess: (state, action) => {
      state.isLoading = false;
      state.user = {
        ...state.user,
        ...action.payload.user,
        reminders: { // Ensure reminders structure exists, merge fetched reminders
          morningHour: 9,
          morningMinute: 0,
          eveningHour: 20,
          eveningMinute: 0,
          isMorningEnabled: true,
          isEveningEnabled: true,
          ...(action.payload.user.reminders || {}), // Merge fetched reminders
        },
      };
      state.userSubscriptions = action.payload.userSubscriptions;
      state.language = action.payload.user.language || null;
    },
    getUserByIdFailure: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    updateUserProfileRequest: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    updateUserProfileSuccess: (state, action) => {
      state.isLoading = false;
      state.user = { ...state.user, ...action.payload };
      if (action.payload.language) {
        state.language = action.payload.language;
      }
    },
    updateUserProfileFailure: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    setIsWelcomeShown: (state) => {
      state.isWelcomeShown = true;
    },
    setLanguage: (state, action) => {
        state.language = action.payload;
    },
    sendOtpRequest: (state) => {
        state.isOtpLoading = true;
        state.otpError = null;
        state.otpSentSuccess = false;
        state.otpVerifiedSuccess = false;
    },
    sendOtpSuccess: (state) => {
        state.isOtpLoading = false;
        state.otpSentSuccess = true;
    },
    sendOtpFailure: (state, action) => {
        state.isOtpLoading = false;
        state.otpError = action.payload;
        state.otpSentSuccess = false;
    },
    verifyOtpRequest: (state) => {
        state.isOtpLoading = true;
        state.otpError = null;
        state.otpVerifiedSuccess = false;
    },
    verifyOtpSuccess: (state) => {
        state.isOtpLoading = false;
        state.otpVerifiedSuccess = true;
        state.otpError = null;
    },
    verifyOtpFailure: (state, action) => {
        state.isOtpLoading = false;
        state.otpError = action.payload;
        state.otpVerifiedSuccess = false;
    },
    resetOtpState: (state) => {
        state.isOtpLoading = false;
        state.otpError = null;
        state.otpSentSuccess = false;
        state.otpVerifiedSuccess = false;
    },
    saveReminderSettingsRequest: (state) => {
        state.isLoadingReminderSave = true;
        state.reminderSaveError = null;
    },
    saveReminderSettingsSuccess: (state, action) => {
        state.isLoadingReminderSave = false;
        state.reminderSaveError = null;
        state.user = {
            ...state.user,
            reminders: {
                ...state.user?.reminders,
                ...action.payload.settings,
            }
        };
    },
    saveReminderSettingsFailure: (state, action) => {
        state.isLoadingReminderSave = false;
        state.reminderSaveError = action.payload;
    },
  },
});

export const {
  loginRequest,
  loginSuccess,
  loginFailure,
  signupRequest,
  signupSuccess,
  signupFailure,
  googleLoginRequest,
  facebookLoginRequest,
  appleLoginRequest,
  socialLoginSuccess,
  socialLoginFailure,
  logout,
  getUserByIdRequest,
  getUserByIdSuccess,
  getUserByIdFailure,
  updateUserProfileRequest,
  updateUserProfileSuccess,
  updateUserProfileFailure,
  setIsWelcomeShown,
  setLanguage,
  sendOtpRequest,
  sendOtpSuccess,
  sendOtpFailure,
  verifyOtpRequest,
  verifyOtpSuccess,
  verifyOtpFailure,
  resetOtpState,
  saveReminderSettingsRequest,
  saveReminderSettingsSuccess,
  saveReminderSettingsFailure,
} = authSlice.actions;

export const selectUser = (state) => state.auth.user;
export const selectUserSubscriptions = (state) => state.auth.userSubscriptions;
export const selectIsLoading = (state) => state.auth.isLoading;
export const selectAuthError = (state) => state.auth.error;
export const selectAuthIsWelcome = (state) => state.auth.isWelcomeShown;
export const selectLanguage = (state) => state.auth.language;
export const selectIsOtpLoading = (state) => state.auth.isOtpLoading;
export const selectOtpError = (state) => state.auth.otpError;
export const selectOtpSentSuccess = (state) => state.auth.otpSentSuccess;
export const selectOtpVerifiedSuccess = (state) => state.auth.otpVerifiedSuccess;

// Update selectors to return numeric hours/minutes and booleans
export const selectMorningReminderTime = (state) => ({
  hour: state.auth.user?.reminders?.morningHour,
  minute: state.auth.user?.reminders?.morningMinute,
});
export const selectEveningReminderTime = (state) => ({
    hour: state.auth.user?.reminders?.eveningHour,
    minute: state.auth.user?.reminders?.eveningMinute,
});
export const selectMorningReminderEnabled = (state) => state.auth.user?.reminders?.isMorningEnabled ?? true;
export const selectEveningReminderEnabled = (state) => state.auth.user?.reminders?.isEveningEnabled ?? true;
export const selectReminderSettingsLoading = (state) => state.auth.isLoadingReminderSave || false;
export const selectReminderSettingsError = (state) => state.auth.reminderSaveError || null;


export default authSlice.reducer;