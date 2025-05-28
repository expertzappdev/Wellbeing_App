import { call, put, takeLatest } from 'redux-saga/effects';
import firestore from '@react-native-firebase/firestore';
import {
  fetchDiaryRequest,
  fetchDiarySuccess,
  fetchDiaryFailure,
  addDiaryEntryRequest,
  addDiaryEntrySuccess,
  addDiaryEntryFailure,
  fetchAllDiaryEntriesRequest,
  fetchAllDiaryEntriesSuccess,
  fetchAllDiaryEntriesFailure,
  fetchQuoteRequest,
  fetchQuoteSuccess,
  fetchQuoteFailure,
} from './diarySlice';

// Fetch a specific diary entry by date
function* fetchDiarySaga(action) {
  const { userId, selectedDate } = action.payload;

  try {
    if (!userId || !selectedDate) throw new Error('Missing userId or selectedDate');

    const docRef = firestore()
      .collection('users')
      .doc(userId)
      .collection('dailyEntries')
      .doc(selectedDate);

    const snapshot = yield call([docRef, 'get']);

    const entryData = snapshot.exists ? snapshot.data() || {} : {};

    yield put(fetchDiarySuccess({ selectedDate, entryData }));
  } catch (error) {
    yield put(fetchDiaryFailure(error?.message || 'Failed to fetch diary entry.'));
  }
}

// Add or update a diary entry
function* addDiaryEntrySaga(action) {
  const { userId, selectedDate, entryData } = action.payload;

  try {
    if (!userId || !selectedDate || !entryData) throw new Error('Invalid diary entry data');

    const docRef = firestore()
      .collection('users')
      .doc(userId)
      .collection('dailyEntries')
      .doc(selectedDate);

    const payload = {
      ...entryData,
      timestamp: firestore.FieldValue.serverTimestamp(),
    };

    yield call([docRef, 'set'], payload, { merge: true });

    yield put(addDiaryEntrySuccess({ selectedDate, entryData: payload }));
  } catch (error) {
    yield put(addDiaryEntryFailure(error?.message || 'Failed to add diary entry.'));
  }
}

// Fetch all diary entries for a user
function* fetchAllDiaryEntriesSaga(action) {
  const { userId } = action.payload;

  try {
    if (!userId) throw new Error('User ID is required');

    const entriesRef = firestore()
      .collection('users')
      .doc(userId)
      .collection('dailyEntries');

    const snapshot = yield call([entriesRef, 'get']);
    const entries = {};

    snapshot?.forEach?.((doc) => {
      if (doc?.id && doc?.data) {
        entries[doc.id] = doc.data() || {};
      }
    });

    yield put(fetchAllDiaryEntriesSuccess({ entries }));
  } catch (error) {
    yield put(fetchAllDiaryEntriesFailure(error?.message || 'Failed to fetch all diary entries.'));
  }
}

// Fetch a random quote
function* fetchQuoteSaga() {
  try {
    const quotesRef = firestore().collection('quotes');
    const snapshot = yield call([quotesRef, 'get']);

    const quotes = [];

    snapshot?.forEach?.((doc) => {
      const data = doc?.data?.();
      if (data) {
        quotes.push(data);
      }
    });

    if (quotes.length === 0) {
      yield put(fetchQuoteFailure('No quotes available.'));
    } else {
      const randomIndex = Math.floor(Math.random() * quotes.length);
      const randomQuote = quotes[randomIndex];
      yield put(fetchQuoteSuccess(randomQuote));
    }
  } catch (error) {
    yield put(fetchQuoteFailure(error?.message || 'Failed to fetch quote.'));
  }
}

export function* watchDiary() {
  yield takeLatest(fetchDiaryRequest.type, fetchDiarySaga);
  yield takeLatest(addDiaryEntryRequest.type, addDiaryEntrySaga);
  yield takeLatest(fetchAllDiaryEntriesRequest.type, fetchAllDiaryEntriesSaga);
  yield takeLatest(fetchQuoteRequest.type, fetchQuoteSaga);
}
