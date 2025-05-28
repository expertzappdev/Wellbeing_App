import { all } from 'redux-saga/effects';
import { watchAuth } from '../slices/auth/authSaga';
import { watchDiary } from '../slices/diary/diarySaga';
import { watchExplore } from '../slices/explore/exploreSaga';
import { watchIAP } from '../slices/iap/iapSaga';

export default function* rootSaga() {
  yield all([
    watchAuth(),
    watchDiary(),
    watchExplore(),
    watchIAP(),
  ]);
}
