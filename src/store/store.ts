import { configureStore } from "@reduxjs/toolkit";
import createSagaMiddleware from "redux-saga";
import rootReducer from "@/store/rootReducer";
import rootSaga from "@/store/rootSaga";

/**
 * Store (프론트 리더 관리 영역)
 * - rootReducer / rootSaga 만 연결한다.
 * - 서비스별 상태·API 로직은 features/{service} 에 둔다.
 */
const sagaMiddleware = createSagaMiddleware();

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(sagaMiddleware),
});

sagaMiddleware.run(rootSaga);

/** useSelector 타입 */
export type RootState = ReturnType<typeof store.getState>;
/** useDispatch 타입 */
export type AppDispatch = typeof store.dispatch;
