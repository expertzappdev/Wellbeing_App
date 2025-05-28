import { call, put, takeLatest, select } from 'redux-saga/effects'; 
import firestore from '@react-native-firebase/firestore';
import {
  fetchExploreDataRequest,
  fetchExploreDataSuccess,
  fetchExploreDataFailure,
  storeExploreDataRequest,
  storeExploreDataSuccess,
  storeExploreDataFailure,
  fetchUserCompletedRequest,
  fetchUserCompletedSuccess,
  fetchUserCompletedFailure,
  markCardCompletedRequest,
  markCardCompletedSuccess,
  markCardCompletedFailure,
  fetchUserFavoritesRequest,
  fetchUserFavoritesSuccess,
  fetchUserFavoritesFailure,
  toggleFavoriteRequest,
  toggleFavoriteSuccess,
  toggleFavoriteFailure,
} from './exploreSlice';
import auth from '@react-native-firebase/auth'; 

function* getUserId() {
  const user = yield select((state) => state.auth.user);
  if (!user) {
      const firebaseUser = auth().currentUser;
      return firebaseUser ? firebaseUser.uid : null;
  }
  return user.uid;
}

function* fetchExploreDataSaga(action) {
  try {
    const categories = ['Recommended', 'Grateful', 'Breathe', 'Calm'];
    const exploreData = {};
    for (const category of categories) {
      const snapshot = yield call(
        [firestore().collection('explore').where('category', '==', category), 'get']
      );
      exploreData[category.toLowerCase()] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    }
    yield put(fetchExploreDataSuccess(exploreData));

    const userId = yield call(getUserId);
    if (userId) {
       yield put(fetchUserCompletedRequest());
       yield put(fetchUserFavoritesRequest()); 
    }

  } catch (error) {
    console.error("Error fetching explore data:", error);
    yield put(fetchExploreDataFailure(error.message));
  }
}

function* storeExploreDataSaga(action) {
  try {
    const { category, data } = action.payload;
    const docRef = yield call(
      [firestore().collection('explore'), 'add'],
      { ...data, category }
    );
    yield put(storeExploreDataSuccess({ category, data: { id: docRef.id, ...data } }));
  } catch (error) {
    yield put(storeExploreDataFailure(error.message));
  }
}

function* fetchUserCompletedSaga() {
    try {
        const userId = yield call(getUserId);
        if (!userId) {
            yield put(fetchUserCompletedSuccess([]));
            return;
        }

        const snapshot = yield call(
            [firestore().collection('users').doc(userId).collection('completedCards'), 'get']
        );
        const completedCardIds = snapshot.docs.map(doc => doc.id);

        yield put(fetchUserCompletedSuccess(completedCardIds));
    } catch (error) {
        console.error("Error fetching user completed cards:", error);
        yield put(fetchUserCompletedFailure(error.message));
    }
}

function* markCardCompletedSaga(action) {
    try {
        const userId = yield call(getUserId);
        if (!userId) {
            console.warn("Attempted to mark card completed without logged in user.");
            return;
        }

        const { cardId } = action.payload;

        yield call(
            [firestore().collection('users').doc(userId).collection('completedCards').doc(cardId), 'set'],
            { completedAt: firestore.FieldValue.serverTimestamp() }
        );

        yield put(markCardCompletedSuccess(cardId));
    } catch (error) {
        console.error("Error marking card completed:", error);
        yield put(markCardCompletedFailure(error.message));
    }
}

function* fetchUserFavoritesSaga() {
    try {
        const userId = yield call(getUserId);
        if (!userId) {
            yield put(fetchUserFavoritesSuccess([]));
            return;
        }

        const snapshot = yield call(
            [firestore().collection('users').doc(userId).collection('favoriteCards'), 'get']
        );
        const favoriteCardIds = snapshot.docs.map(doc => doc.id); 

        yield put(fetchUserFavoritesSuccess(favoriteCardIds));
    } catch (error) {
        console.error("Error fetching user favorite cards:", error);
        yield put(fetchUserFavoritesFailure(error.message));
    }
}

function* toggleFavoriteSaga(action) {
    try {
        const userId = yield call(getUserId);
        if (!userId) {
            console.warn("Attempted to toggle favorite without logged in user.");
            return;
        }

        const { cardId, isFavorite } = action.payload;

        const favoriteDocRef = firestore().collection('users').doc(userId).collection('favoriteCards').doc(cardId);

        if (isFavorite) {
            yield call([favoriteDocRef, 'set'], { favoritedAt: firestore.FieldValue.serverTimestamp() });
        } else {
            yield call([favoriteDocRef, 'delete']);
        }

        yield put(toggleFavoriteSuccess({ cardId, isFavorite }));
    } catch (error) {
        console.error("Error toggling favorite:", error);
        yield put(toggleFavoriteFailure(error.message));
    }
}
export function* watchExplore() {
  yield takeLatest(fetchExploreDataRequest.type, fetchExploreDataSaga);
  yield takeLatest(storeExploreDataRequest.type, storeExploreDataSaga);
  yield takeLatest(fetchUserCompletedRequest.type, fetchUserCompletedSaga);
  yield takeLatest(markCardCompletedRequest.type, markCardCompletedSaga);
  yield takeLatest(fetchUserFavoritesRequest.type, fetchUserFavoritesSaga);
  yield takeLatest(toggleFavoriteRequest.type, toggleFavoriteSaga);
}