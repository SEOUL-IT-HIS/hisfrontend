# IH2-14 계정 활성/비활성 전환 — 설계

작성일: 2026-09-11
관련 티켓: IH2-14 (스토리) / IH2-96, IH2-97, IH2-98, IH2-99 (하위작업)
범위: admin-service(BE) + hisfrontend(FE) 동시 작업

---

## 1. 무엇을 만드는가

관리자가 직원의 로그인 계정을 활성/비활성으로 전환할 수 있게 한다.
비활성 계정은 로그인이 막힌다.

화면은 **새로 만들지 않고 기존 직원관리(`/admin/emp`) 안에** 넣는다.

---

## 2. 배경 — 착수 전 확인된 현재 상태

### 2.1 로그인 검증이 계정 상태를 보지 않는다 (이 티켓의 핵심)

`auth/service/impl/AuthServiceImpl.java`의 `login()`은 세 가지만 검사한다.

1. `lockedAt != null` → 잠긴 계정 차단
2. `password == pwHash` → 비밀번호 일치
3. `emp.empStatus == '01'` → 재직 중인지

`accountStatus`는 어디서도 검사하지 않는다. 따라서 **화면에서 계정을 비활성으로 바꿔도
그 사용자는 그대로 로그인된다.** 상태 전환 UI만 만들면 기능이 아무 효과가 없으므로,
로그인 검증 수정이 이 티켓에 반드시 포함되어야 한다.

### 2.2 ACCOUNT 테이블과 공통코드는 이미 준비되어 있다

`ACCOUNT` 테이블은 `auth/entity/AuthEntity.java`에 매핑되어 있고 필요한 컬럼이 모두 있다.

| 컬럼 | 쓰이는 티켓 |
|---|---|
| `ACCOUNT_STATUS` | IH2-14 (이번) |
| `FAIL_COUNT`, `LOCKED_AT` | IH2-9 계정 잠금 해제 |
| `PW_HASH`, `PW_CHANGE_AT` | IH2-7 비밀번호 변경 |
| `LAST_LOGIN_AT` | IH2-10 로그인 이력 조회 |

공통코드 `ACCOUNT_STATUS_CD` 그룹에 `01` / `02` / `03` 세 값이 등록되어 있다.
`01`이 활성이며 직원 등록 시 이 값으로 생성된다
(`emp/service/impl/EmpServiceImpl.java`의 `ACCOUNT_STATUS_ACTIVE` 상수).

### 2.3 계정은 직원과 1:1이다

직원 등록 시 계정이 자동 생성된다(IH2-5). 현재 직원 16명 / 계정 16개로 정확히 일치한다.
계정만 따로 만들거나 지우는 흐름은 없다.

### 2.4 계정 조회·변경 API가 하나도 없다

`AuthController`에 `login` / `me` / `logout` 세 개뿐이고 `AccountController`는 없다.
FE에도 계정 화면이 없다. 즉 BE부터 새로 만들어야 한다.

---

## 3. 결정사항

### 3.1 화면을 직원관리 안에 둔다 (독립 메뉴를 만들지 않는다)

- **계정이 직원과 1:1**이므로 독립 메뉴를 만들면 같은 16행을 보여주는 목록이 두 개가 된다.
  작업할 때 어느 메뉴로 갈지 매번 헷갈린다.
- **권한 분리 실익이 없다.** `ROLE_MENU`를 조회한 결과 `ADM_USER`, `ADM_PERMISSION`,
  `ADM_COMMONCODE` 세 메뉴가 전부 같은 역할(`01`, `02`, `10`)에게 열려 있다.
  계정 메뉴를 새로 만들어도 결국 같은 사람들이 본다.
- **업무가 사람 이름에서 시작한다.** "퇴직한 OOO 계정 막기", "비밀번호 잊은 OOO 초기화"
  모두 직원 검색이 출발점이다. 특히 IH2-15(직원 퇴직 처리)는 재직상태 변경과 계정 비활성을
  같이 해야 하므로 한 패널에 있어야 한 번에 끝난다.
- 메뉴·라우트·`ROLE_MENU` 매핑 추가가 필요 없어 작업량도 적다.

**나중에 독립 메뉴로 분리해야 하는 시점:** 직원이 아닌 계정(외부 협력업체, 배치용 시스템 계정,
퇴직자 보존 계정 등)이 생겨 1:1이 깨질 때. 그때는 계정 목록이 직원 목록과 달라지므로
목록 화면만 새로 만들고 상세 영역 컴포넌트는 재사용한다.

### 3.2 이미 로그인한 사용자는 끊지 않는다 (다음 로그인부터 차단)

세션이 Redis에 살아 있으면 비활성으로 바꿔도 그 사용자는 로그아웃할 때까지 계속 쓸 수 있다.

즉시 끊으려면 Redis에서 해당 사용자의 세션을 찾아 지워야 하는데, 세션 키가 사용자 기준으로
인덱싱되어 있지 않아 전수 조회가 필요하다. IH2-14 범위를 크게 넘어선다.

→ **다음 로그인부터 차단**하고, 화면에 그 사실을 안내한다.

### 3.3 FE는 Redux(slice + saga)를 쓴다

`empSlice` / `empSaga` 패턴을 그대로 복제한다.

---

## 4. BE 설계

### 4.1 새 패키지를 만들지 않고 `auth` 패키지에 넣는다

`ACCOUNT` 테이블이 이미 `auth/entity/AuthEntity.java`에 매핑되어 있다. 별도 `account`
패키지를 만들면 같은 테이블을 두 번 매핑하거나 패키지를 가로질러 엔티티를 참조하게 된다.
이번에 수정할 로그인 검증도 `auth` 안에 있고, 뒤에 올 IH2-9·IH2-7도 같은 테이블을 쓴다.
ACCOUNT를 다루는 코드는 한 패키지에 모은다.

### 4.2 신규 파일

| 파일 | 역할 |
|---|---|
| `auth/controller/AccountController.java` | `@RequestMapping("/api/admin/account")` |
| `auth/service/AccountService.java` | 인터페이스 |
| `auth/service/impl/AccountServiceImpl.java` | 조회 + 상태 변경 |
| `auth/dto/AccountDto.java` | 응답 DTO |

`AccountDto`에 담는 필드는 여섯 개다.

```
accountId, empId, loginId, accountStatus, lockedAt, lastLoginAt
```

**`pwHash`는 절대 넣지 않는다.** 현재 비밀번호가 평문으로 저장되어 있어 엔티티를 그대로
내보내면 평문 비밀번호가 화면까지 내려간다. `EmpController`는 `ApiResponse<List<EmpEntity>>`로
엔티티를 그대로 응답하고 있으나, 계정은 이 이유로 DTO를 쓴다.

### 4.3 수정 파일

| 파일 | 내용 |
|---|---|
| `auth/repository/AuthRepository.java` | `findByEmpId(String)` 추가 |
| `auth/service/impl/AuthServiceImpl.java` | 로그인에 계정 상태 검증 추가 (4.5) |
| `common/exception/ErrorCode.java` | `ADM018`, `ADM019` 추가 |
| `emp/entity/EmpEntity.java` | `@Transient accountStatus` 추가 (4.6) |
| `emp/service/impl/EmpServiceImpl.java` | 목록에 계정 상태 싣기 (4.6) |

에러코드는 기존 마지막 번호가 `ADM017`이므로 `ADM018`부터 이어 붙인다.
`ACCOUNT_NOT_FOUND`, `ACCOUNT_STATUS_INVALID` 두 개를 추가한다.

### 4.4 API 명세

```
GET  /api/admin/account/detail/{empId}
     → ApiResponse<AccountDto>

PUT  /api/admin/account/status/{accountId}
     body: { "accountStatus": "02" }
     → ApiResponse<AccountDto>
```

상세는 `empId`로 찾는다. 화면이 직원을 먼저 선택하는 구조라 `accountId`를 알 방법이 없다.
변경은 `accountId`로 한다. 이미 조회해서 알고 있고, 바꿀 대상을 정확히 가리키는 편이 안전하다.

상태 변경 시 전달된 값이 `ACCOUNT_STATUS_CD`에 있는 값인지 검증하고,
없으면 `ACCOUNT_STATUS_INVALID`를 던진다.

### 4.5 로그인 차단 (IH2-99의 실체)

`AuthServiceImpl.login()`의 재직상태 검사 옆에 추가한다.

```java
if (!ACCOUNT_STATUS_ACTIVE.equals(account.getAccountStatus())) {
    throw new BusinessException(ErrorCode.AUTH_INVALID_CREDENTIALS);
}
```

전용 에러 메시지를 쓰지 않고 "아이디 또는 비밀번호가 올바르지 않습니다"로 뭉뚱그린다.
바로 위 재직상태 검사에 같은 취지의 주석이 이미 달려 있다 — 메시지를 구분하면
"이 아이디는 존재하는데 상태가 다르구나"를 공격자에게 흘리게 된다. 기존 정책과 맞춘다.

### 4.6 직원 목록에 계정 상태 싣기

`EmpEntity`에는 이미 같은 패턴이 있다.

```java
@Transient
private List<String> roleIds;
```

`roleIds`는 `EMP_ROLE`에서 따로 읽어와 채우는 필드다. 계정 상태도 똑같이 한다.

```java
@Transient
private String accountStatus;
```

`EmpServiceImpl.selectEmpList()`에서 `roleIds`를 채우는 코드 바로 아래에, 같은 방식으로
`ACCOUNT`를 한 번에 읽어 `empId`로 묶어 채운다. 직원마다 계정을 따로 조회하면 쿼리가
직원 수만큼 나가므로 `roleIds`와 동일하게 한 번만 읽는다.

이 방식이면 목록 API를 새로 만들거나 응답 형태를 바꿀 필요가 없다. 필드 하나가 더 붙을 뿐이다.

---

## 5. FE 설계

### 5.1 신규 파일

```
src/features/account/api/accountApi.ts       — API 2개 호출
src/features/account/types/accountTypes.ts   — Account 타입
src/features/account/slice/accountSlice.ts   — 액션 6개
src/features/account/saga/accountSaga.ts     — takeLatest 2개
```

### 5.2 수정 파일

| 파일 | 내용 |
|---|---|
| `src/store/rootReducer.ts` | `account: accountReducer` 한 줄 추가 (`emp` 아래) |
| `src/store/rootSaga.ts` | `fork(watchAccountSaga)` 한 줄 추가 (`watchEmpSaga` 아래) |
| `src/features/emp/types/empTypes.ts` | `Emp`에 `accountStatus: string \| null` 추가 |
| `src/components/emp/EmpList.tsx` | Account 컬럼 + 필터 추가 |
| `src/components/emp/EmpDetailPanel.tsx` | Account 영역 추가 |

`rootReducer.ts`는 `combineReducers` 항목 추가만 하고 그 외에는 손대지 않는다.

### 5.3 state

```ts
type AccountState = {
  /** 선택된 직원의 계정. 직원 미선택이거나 조회 전이면 null */
  account: Account | null;
  loading: boolean;    // 조회 중
  updating: boolean;   // 상태 변경 중 (버튼 비활성화용)
  error: string | null;
};
```

`empSlice`가 `loading` / `detailLoading`을 나눠 쓰는 것과 같은 이유로 조회와 변경을 따로 둔다.
변경 중에 버튼을 잠가야 같은 요청이 두 번 나가지 않는다.

### 5.4 액션

```
fetchAccountDetailRequest(empId)   → Success(Account) / Failure(string)
fetchAccountStatusRequest(payload) → Success(Account) / Failure(string)
```

`empSlice`의 `fetchEmpUpdateRequest` 명명 규칙을 따른다.

**주의:** `fetchAccountDetailRequest`에서 `state.account = null`로 비운다.
비우지 않으면 직원을 바꿔 클릭했을 때 새 계정 정보가 도착하기 전까지 이전 직원의 계정 정보가
잠깐 보인다. `empSlice`에 `clearEmpDetail`이 따로 있는 것도 같은 문제 때문인데,
여기서는 Request에서 비우는 편이 간단하다.

### 5.5 목록 컬럼 갱신은 saga가 처리한다

상태를 바꾸면 왼쪽 목록의 Account 컬럼도 같이 바뀌어야 한다.
`accountSaga`에서 성공 직후 직원 목록을 다시 부른다.

```ts
function* fetchAccountStatusSaga(action) {
  try {
    const account = yield call(fetchAccountStatusApi, action.payload);
    yield put(fetchAccountStatusSuccess(account));
    // 왼쪽 목록의 Account 컬럼도 같이 갱신
    yield put(fetchEmpRequest());
  } catch (error) { ... }
}
```

`empSlice`를 건드려 계정 상태만 끼워 넣는 방법도 있으나, slice 두 개가 서로를 알게 되면
나중에 읽기 어려워진다. 목록이 16행이라 다시 부르는 비용은 사실상 없다.

### 5.6 화면

직원관리 화면은 영문 UI이므로 새 문구도 영어로 맞춘다.

**왼쪽 목록** — `Status` 컬럼 옆에 `Account` 컬럼, 검색 영역의 `Status` 필터 옆에
`Account` 필터를 추가한다.

```
Emp No. │ Name │ Department │ Role │ Hire Date │ Status │ Account
────────┼──────┼────────────┼──────┼───────────┼────────┼───────────
2601001 │ ...  │ ...        │ ...  │ 2026-01-02│ 재직   │ ● Active
2601002 │ ...  │ ...        │ ...  │ 2026-01-02│ 재직   │ ○ Inactive
```

라벨은 `toCodeLabel(accountStatusCodes, row.accountStatus)`로 뽑는다.
`EmpList`의 `loadCodes()` 안 `Promise.all`에 `fetchCommonCodeItemsByGroupCode("ACCOUNT_STATUS_CD")`
를 하나 더 넣어 공통코드를 받아온다.

**오른쪽 상세 패널** — 기존 `<dl>` 아래에 Account 영역을 둔다.

```
┌── Account ──────────────────────────────────┐
│  Login ID      2601001                      │
│  Status        ● Active      [Deactivate]   │
│  Last Login    2026-09-10 09:14             │
│                                             │
│  ⓘ Deactivating blocks the next login.      │
│    Users already signed in stay active      │
│    until they sign out.                     │
└─────────────────────────────────────────────┘
```

`EmpDetailPanel`은 이미 `useDispatch` / `useSelector`를 쓰고 있어 구조가 바뀌지 않는다.
기존 `useEffect`에 한 줄만 추가한다.

```ts
useEffect(() => {
  if (empId != null) {
    dispatch(fetchEmpDetailRequest(empId));
    dispatch(fetchAccountDetailRequest(empId));   // 추가
  }
}, [dispatch, empId]);
```

`EmpList`가 `key={selectedEmpId}`로 패널을 다시 마운트하므로 모달 열림 상태 등은
자동으로 초기화된다.

버튼을 누르면 `@/components/common`의 `Modal`로 확인을 받고, 확인 시
`fetchAccountStatusRequest`를 dispatch한다.

---

## 6. 하위작업 매핑

| 하위작업 | 해당 범위 |
|---|---|
| IH2-98 계정 상태 조회 및 현재 활성 여부 표시 로직 | 4.2 GET API + 4.6 목록에 상태 싣기 |
| IH2-97 계정 활성/비활성 전환 화면 구성 | 5.6 Account 영역 + 목록 컬럼 |
| IH2-96 계정 활성/비활성 전환 처리 및 저장 | 4.4 PUT API + 확인 모달 + 5.5 |
| IH2-99 계정 상태 변경 후 안내 및 반영 처리 | 4.5 로그인 차단 + 안내 문구 |

Jira 보드상 하위작업은 5개이나 4개만 확인되었다. 나머지 1개는 확인 후 이 표에 반영한다.

**작업 순서:** IH2-98 → IH2-97 → IH2-96 → IH2-99.
BE 조회 API가 없으면 화면을 붙일 수 없으므로 IH2-98이 먼저다.

---

## 7. 검증

계정 16건이 전부 활성(`01`)이고 잠긴 계정도 없어 비활성 상태를 볼 데이터가 없다.
다만 이 기능 자체가 비활성을 만드는 기능이므로 화면에서 직접 만들어 확인한다.
DB를 직접 UPDATE할 필요가 없다.

1. 직원 하나를 골라 `Deactivate` → 목록 Account 컬럼이 `Inactive`로 바뀌는지
2. **그 계정으로 로그인 시도 → 차단되는지** ← 진짜 통과 기준
3. 다시 `Activate` → 로그인되는지
4. 이미 로그인 중인 세션은 유지되는지 (3.2 결정사항대로 동작하는지)

---

## 8. 브랜치와 배포 순서

BE는 두 홉, FE는 한 홉이다. **BE를 develop에 먼저 올린 뒤 FE**를 올린다
(API가 먼저 존재해야 FE 연동이 된다).

```
BE:  feature/auth/IH2-98-account-status → IH2-1-auth → develop
FE:  feature/employee/ih2-98-account-status → develop
```

착수 전과 푸시 직전에 양쪽 `develop`을 최신화하고, BE는 `IH2-1-auth` 도메인 브랜치가
develop보다 뒤처져 있지 않은지 확인한다.

---

## 9. 이번 범위에서 제외한 것

| 항목 | 이유 |
|---|---|
| 비밀번호 평문 저장 | IH2-7에서 다룬다. 지금 해시로 바꾸면 기존 계정 로그인이 전부 깨진다 |
| 계정 잠금 해제 | IH2-9 |
| 세션 즉시 종료 | 3.2 참고 |
| 상태 `03`의 의미 | 공통코드에 있으나 용도 미확인. 우선 코드명 그대로 드롭다운에 노출한다 |
