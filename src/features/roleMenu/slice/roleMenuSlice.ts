/**
 * [역할별 메뉴 권한 Redux Slice]
 *
 * 상태: roleMenus / checkedMenuIds / loading / error / saved
 *
 * 체크 상태(checkedMenuIds)를 화면 useState 가 아니라 여기에 두는 이유:
 * 역할을 바꾸면 조회 응답이 도착하는 시점에 체크 상태도 같이 맞춰져야 하는데,
 * 화면에 두면 응답을 useEffect 로 받아야 하고 그건 set-state-in-effect 에 걸린다.
 * 조회 성공 리듀서에서 함께 세팅하면 순서 문제가 없다.
 *
 * fetchRoleMenuRequest payload = roleId (string, UUID)
 * → saga 가 그 roleId 로 목록 API 호출
 *
 * 저장은 응답에 데이터가 없어서(ApiResponse<Void>),
 * saga 가 저장 성공 후 목록을 다시 조회해서 Success 에 실어 보낸다.
 */
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RoleMenu, RoleMenuSaveRequest } from "../types/roleMenuTypes";

type RoleMenuState = {
  roleMenus: RoleMenu[];
  /** 화면에서 체크한 메뉴 ID — 저장 전 임시 상태 (저장하면 서버 값으로 다시 맞춰진다) */
  checkedMenuIds: string[];
  loading: boolean;
  error: string | null;
  saved: boolean;
};

const initialState: RoleMenuState = {
  roleMenus: [],
  checkedMenuIds: [],
  loading: false,
  error: null,
  saved: false,
};




const roleMenuSlice = createSlice({
  name: "roleMenu",
  initialState,
  reducers: {
    // ----- 목록 조회 (payload: roleId) -----
    fetchRoleMenuRequest(state, _action: PayloadAction<string>) {
      state.loading = true;
      state.error = null;
      // 역할을 바꿔 다시 조회하는 것이므로 이전 저장 안내는 지운다
      state.saved = false;
    },
    fetchRoleMenuSuccess(state, action: PayloadAction<RoleMenu[]>) {
      state.loading = false;
      state.roleMenus = action.payload;
      // 서버가 준 canRead="Y" 를 체크 상태의 출발점으로 삼는다
      state.checkedMenuIds = action.payload
        .filter((menu) => menu.canRead === "Y")
        .map((menu) => menu.menuId);
    },
    fetchRoleMenuFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },

    // ----- 저장 -----
    fetchRoleMenuSaveRequest(state, _action: PayloadAction<RoleMenuSaveRequest>) {
      state.loading = true;
      state.error = null;
      state.saved = false;
    },
    /** payload = 저장 후 다시 조회한 목록 */
    fetchRoleMenuSaveSuccess(state, action: PayloadAction<RoleMenu[]>) {
      state.loading = false;
      state.roleMenus = action.payload;
      // 저장 직후 다시 조회한 결과이므로 체크 상태도 서버 값으로 맞춘다
      state.checkedMenuIds = action.payload
        .filter((menu) => menu.canRead === "Y")
        .map((menu) => menu.menuId);
      state.saved = true;
    },
    fetchRoleMenuSaveFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },

    // ----- 체크박스 (화면 전용, API 안 감) -----
    /** 메뉴 하나의 체크를 켜고 끈다. 저장 전까지는 화면 상태만 바뀐다 */
    toggleRoleMenu(state, action: PayloadAction<string>) {
      const menuId = action.payload;
      if (state.checkedMenuIds.includes(menuId)) {
        state.checkedMenuIds = state.checkedMenuIds.filter((id) => id !== menuId);
      } else {
        state.checkedMenuIds.push(menuId);
      }
      // 다시 건드렸으니 "저장되었습니다" 안내는 지운다
      state.saved = false;
    },

    /**
     * 최상위 그룹 체크 — 자기 자신 + 하위 전체(손자까지)를 한꺼번에 켜거나 끈다.
     *
     * toggleRoleMenu 처럼 "뒤집기"가 아니라 "전부 이 상태로 맞추기" 다.
     * 하위가 일부만 체크된 상태에서 각각 뒤집으면 켜진 게 꺼지고 꺼진 게 켜져 엉망이 된다.
     * 그래서 checked 를 화면이 정해서 넘겨준다.
     */
    toggleRoleMenuGroup(
      state,
      action: PayloadAction<{ menuIds: string[]; checked: boolean }>,
    ) {
      const { menuIds, checked } = action.payload;
      if (checked) {
        for (const menuId of menuIds) {
          // 이미 체크된 건 건너뛴다 (같은 ID 가 두 번 들어가면 안 되므로)
          if (!state.checkedMenuIds.includes(menuId)) {
            state.checkedMenuIds.push(menuId);
          }
        }
      } else {
        state.checkedMenuIds = state.checkedMenuIds.filter(
          (id) => !menuIds.includes(id),
        );
      }
      state.saved = false;
    },
  },
});

export const {
  fetchRoleMenuRequest,
  fetchRoleMenuSuccess,
  fetchRoleMenuFailure,
  fetchRoleMenuSaveRequest,
  fetchRoleMenuSaveSuccess,
  fetchRoleMenuSaveFailure,
  toggleRoleMenu,
  toggleRoleMenuGroup,
} = roleMenuSlice.actions;

export default roleMenuSlice.reducer;