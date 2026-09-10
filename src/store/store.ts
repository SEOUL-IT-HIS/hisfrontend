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
    getDefaultMiddleware({
      /*
       * 직원 프로필 사진(File)이 액션을 타고 지나가는 것만 검사에서 뺀다.
       *
       * Redux Toolkit 은 액션 payload 에 JSON 으로 바꿀 수 없는 값이 있으면 개발 모드에서
       * 경고를 띄운다. File 이 그 대상이다.
       *
       * 직원 등록/수정은 사진을 multipart(FormData)로 보내야 해서, 화면이 고른 File 을
       * 액션에 실어 saga 까지 넘긴다. saga 가 그걸 FormData 에 담아 보내고 나면 끝이고,
       * reducer 는 loading/error 만 세팅할 뿐 File 을 state 에 저장하지 않는다.
       * 그래서 state 는 여전히 전부 직렬화 가능하고, 경고만 불필요하게 뜨던 상황이었다.
       *
       * 검사를 통째로 끄지(serializableCheck: false) 않는 이유는, 다른 곳에서 실수로
       * 직렬화 안 되는 값을 state 에 넣는 진짜 문제를 계속 잡아야 하기 때문이다.
       */
      serializableCheck: {
        ignoredActions: [
          "emp/fetchEmpRegisterRequest",
          "emp/fetchEmpUpdateRequest",
        ],
        ignoredActionPaths: ["payload.image"],
      },
    }).concat(sagaMiddleware),
});

sagaMiddleware.run(rootSaga);

/** useSelector 타입 */
export type RootState = ReturnType<typeof store.getState>;
/** useDispatch 타입 */
export type AppDispatch = typeof store.dispatch;
