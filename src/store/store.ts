import { configureStore } from "@reduxjs/toolkit";
import createSagaMiddleware from "redux-saga";
import rootReducer from "@/store/rootReducer";
import rootSaga from "@/store/rootSaga";

// 1) Saga 미들웨어 만들기
const sagaMiddleware = createSagaMiddleware();

// 2) Store 만들기 (전역 상태 보관함)
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(sagaMiddleware),
});

// 3) Saga 시작
sagaMiddleware.run(rootSaga);

// 컴포넌트에서 useSelector / useDispatch 타입 잡기용
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
