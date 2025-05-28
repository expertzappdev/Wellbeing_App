import AsyncStorage from '@react-native-async-storage/async-storage';
import { persistReducer, persistStore } from 'redux-persist';
import { configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import rootSaga from './sagas/rootSaga';
import authReducer from './slices/auth/authSlice';
import diaryReducer from './slices/diary/diarySlice';
import iapReducer from './slices/iap/iapSlice';
import exploreReducer from './slices/explore/exploreSlice';
import { combineReducers } from 'redux';

const sagaMiddleware = createSagaMiddleware();

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'explore', 'diary']
};

const persistedReducer = persistReducer(
  persistConfig,
  combineReducers({
    auth: authReducer,
    diary: diaryReducer,
    explore: exploreReducer,
    iap: iapReducer,
  })
);

const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      thunk: false, 
      serializableCheck: false,
    }).concat(sagaMiddleware),
});

sagaMiddleware.run(rootSaga);

const persistor = persistStore(store);

export { store, persistor };
