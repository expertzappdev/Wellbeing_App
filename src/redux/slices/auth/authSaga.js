import { call, put, takeLatest, all, select } from 'redux-saga/effects';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from 'i18next';

import {
  signupRequest,
  signupSuccess,
  signupFailure,
  loginRequest,
  loginSuccess,
  loginFailure,
  googleLoginRequest,
  facebookLoginRequest,
  appleLoginRequest,
  socialLoginSuccess,
  socialLoginFailure,
  getUserByIdRequest,
  getUserByIdSuccess,
  getUserByIdFailure,
  updateUserProfileRequest,
  updateUserProfileSuccess,
  updateUserProfileFailure,
  setLanguage,
  sendOtpRequest,
  sendOtpSuccess,
  sendOtpFailure,
  verifyOtpRequest,
  verifyOtpSuccess,
  verifyOtpFailure,
  saveReminderSettingsRequest,
  saveReminderSettingsSuccess,
  saveReminderSettingsFailure,
  selectUser,
} from './authSlice';

function* apiCall(url, method, body) {
    const response = yield call(fetch, url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorBody = yield response.text();
        throw new Error(errorBody || `HTTP error! status: ${response.status}`);
    }
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        return yield response.json();
    } else {
         return response;
    }
}

function* signupSaga(action) {
  try {
    const { email, password, name } = action.payload;

    const userCredential = yield call(
      [auth(), 'createUserWithEmailAndPassword'],
      email,
      password
    );

    yield call([userCredential.user, 'updateProfile'], { displayName: name });

    const userRef = firestore().collection('users').doc(userCredential.user.uid);
    yield call([userRef, 'set'], {
      uid: userCredential.user.uid,
      email,
      name,
      provider: 'email',
      createdAt: firestore.FieldValue.serverTimestamp(),
      language: 'en',
      reminders: { // Initialize with numeric hour/minute
        morningHour: 9,
        morningMinute: 0,
        eveningHour: 20,
        eveningMinute: 0,
        isMorningEnabled: true,
        isEveningEnabled: true,
      }
    });

    const serializedUser = {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      displayName: userCredential.user.displayName,
      emailVerified: userCredential.user.emailVerified,
      language: 'en',
      reminders: { // Include in Redux state payload
        morningHour: 9,
        morningMinute: 0,
        eveningHour: 20,
        eveningMinute: 0,
        isMorningEnabled: true,
        isEveningEnabled: true,
      }
    };

    yield put(signupSuccess(serializedUser));
    yield put(setLanguage('en'));
  } catch (error) {
    yield put(signupFailure(error.message));
  }
}

function* loginSaga(action) {
  try {
    const userCredential = yield call(
      [auth(), 'signInWithEmailAndPassword'],
      action.payload.email,
      action.payload.password
    );

    const user = userCredential.user;

    yield put(loginSuccess(user));
    yield put(getUserByIdRequest(user.uid));
  } catch (error) {
    yield put(loginFailure(error.message));
  }
}

function* googleLoginSaga(action) {
  try {
    const userCredential = action.payload;
    const { user } = userCredential;

    const userRef = firestore().collection('users').doc(user.uid);
    const userSnapshot = yield call([userRef, 'get']);

    if (!userSnapshot.exists) {
      yield call([userRef, 'set'], {
        uid: user.uid,
        email: user.email,
        name: user.displayName,
        photoBase64: user.photoURL,
        provider: 'google',
        createdAt: firestore.FieldValue.serverTimestamp(),
        reminders: { // Initialize with numeric hour/minute
          morningHour: 9,
          morningMinute: 0,
          eveningHour: 20,
          eveningMinute: 0,
          isMorningEnabled: true,
          isEveningEnabled: true,
        }
      });
    }

    const serializedUser = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoBase64: user.photoURL,
      emailVerified: user.emailVerified,
    };

    yield put(socialLoginSuccess(serializedUser));
    yield put(getUserByIdRequest(user.uid));
  } catch (error) {
    yield put(socialLoginFailure(error.message));
  }
}
function* facebookLoginSaga(action) {
  try {
    const userCredential = action.payload;
    const { user } = userCredential;

    const userRef = firestore().collection('users').doc(user.uid);
    const userSnapshot = yield call([userRef, 'get']);

    if (!userSnapshot.exists) {
      yield call([userRef, 'set'], {
        uid: user.uid,
        email: user.email,
        name: user.displayName,
        photoBase64: user.photoURL,
        provider: 'facebook',
        createdAt: firestore.FieldValue.serverTimestamp(),
        reminders: { // Initialize with numeric hour/minute
          morningHour: 9,
          morningMinute: 0,
          eveningHour: 20,
          eveningMinute: 0,
          isMorningEnabled: true,
          isEveningEnabled: true,
        }
      });
    }

    const serializedUser = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoBase64: user.photoURL,
      emailVerified: user.emailVerified,
    };

    yield put(socialLoginSuccess(serializedUser));
    yield put(getUserByIdRequest(user.uid));
  } catch (error) {
    yield put(socialLoginFailure(error.message));
  }
}
function* appleLoginSaga(action) {
  try {
    const userCredential = action.payload;
    const { user } = userCredential;

    const userRef = firestore().collection('users').doc(user.uid);
    const userSnapshot = yield call([userRef, 'get']);

    if (!userSnapshot.exists) {
      yield call([userRef, 'set'], {
        uid: user.uid,
        email: user.email,
        name: user.displayName,
        photoBase64: user.photoURL,
        provider: 'apple',
        createdAt: firestore.FieldValue.serverTimestamp(),
        reminders: { // Initialize with numeric hour/minute
          morningHour: 9,
          morningMinute: 0,
          eveningHour: 20,
          eveningMinute: 0,
          isMorningEnabled: true,
          isEveningEnabled: true,
        }
      });
    }

    const serializedUser = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoBase64: user.photoURL,
      emailVerified: user.emailVerified,
    };

    yield put(socialLoginSuccess(serializedUser));
    yield put(getUserByIdRequest(user.uid));
  } catch (error) {
    yield put(socialLoginFailure(error.message));
  }
}

function* getUserByIdSaga(action) {
  try {
    const userRef = firestore().collection('users').doc(action.payload);
    const userSnapshot = yield call([userRef, 'get']);

    if (!userSnapshot.exists) {
      throw new Error('User not found');
    }

    const user = userSnapshot.data();
    const fetchedUserWithReminders = {
        ...user,
        reminders: {
            morningHour: user.reminders?.morningHour ?? 9,
            morningMinute: user.reminders?.morningMinute ?? 0,
            eveningHour: user.reminders?.eveningHour ?? 20,
            eveningMinute: user.reminders?.eveningMinute ?? 0,
            isMorningEnabled: user.reminders?.isMorningEnabled ?? true,
            isEveningEnabled: user.reminders?.isEveningEnabled ?? true,
        }
    };


    const subscriptionRef = firestore()
      .collection('users')
      .doc(action.payload)
      .collection('userSubscription');

    const subscriptionSnapshot = yield call([subscriptionRef, 'get']);
    const userSubscriptions = subscriptionSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    yield put(getUserByIdSuccess({ user: fetchedUserWithReminders, userSubscriptions }));
  } catch (error) {
    yield put(getUserByIdFailure(error.message));
  }
}

function* updateUserProfileSaga(action) {
  try {
    const { uid, name, image, language } = action.payload;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (image !== undefined) updateData.photoBase64 = image;
    if (language !== undefined) updateData.language = language;

    const userRef = firestore().collection('users').doc(uid);
    if (Object.keys(updateData).length > 0) {
        yield call([userRef, 'update'], updateData);
    }


    if (name !== undefined) {
        yield call([auth().currentUser, 'updateProfile'], { displayName: name });
    }


    if (language !== undefined) {
      yield call([i18n, 'changeLanguage'], language);
      yield call([AsyncStorage, 'setItem'], 'userLanguage', language);
      yield put(setLanguage(language));
    }
    yield put(updateUserProfileSuccess(updateData));
  } catch (error) {
    yield put(updateUserProfileFailure(error.message));
  }
}

function* saveReminderSettingsSaga(action) {
    try {
        const { uid, settings } = action.payload;
        if (!uid) {
            throw new Error("User UID is required to save reminders.");
        }

        const userRef = firestore().collection('users').doc(uid);
        yield call([userRef, 'update'], {
            reminders: settings
        });

        yield put(saveReminderSettingsSuccess(action.payload));
    } catch (error) {
        yield put(saveReminderSettingsFailure(error.message || 'Failed to save reminder settings.'));
    }
}


const SEND_OTP_URL = 'https://sendotpbyemail-3pkmzoynfa-uc.a.run.app';
const VERIFY_OTP_URL = 'https://verifyotp-3pkmzoynfa-uc.a.run.app';

function* sendOtpSaga(action) {
    try {
        const { email } = action.payload;
        if (!email) {
            throw new Error("Email is required to send OTP.");
        }
        yield call(apiCall, SEND_OTP_URL, 'POST', { email });
        yield put(sendOtpSuccess());
    } catch (error) {
        yield put(sendOtpFailure(error.message || 'Failed to send OTP.'));
    }
}

function* verifyOtpSaga(action) {
    try {
        const { email, otp } = action.payload;
         if (!email || !otp) {
            throw new Error("Email and OTP are required to verify.");
        }
        yield call(apiCall, VERIFY_OTP_URL, 'POST', { email, otp });
        yield put(verifyOtpSuccess());
    } catch (error) {
         yield put(verifyOtpFailure(error.message || 'Failed to verify OTP.'));
  }
}


export function* watchAuth() {
  yield all([
    takeLatest(signupRequest, signupSaga),
    takeLatest(loginRequest.type, loginSaga),
    takeLatest(googleLoginRequest.type, googleLoginSaga),
    takeLatest(facebookLoginRequest.type, facebookLoginSaga),
    takeLatest(appleLoginRequest.type, appleLoginSaga),
    takeLatest(getUserByIdRequest.type, getUserByIdSaga),
    takeLatest(updateUserProfileRequest.type, updateUserProfileSaga),
    takeLatest(sendOtpRequest.type, sendOtpSaga),
    takeLatest(verifyOtpRequest.type, verifyOtpSaga),
    takeLatest(saveReminderSettingsRequest.type, saveReminderSettingsSaga),
  ]);
}

export default watchAuth;