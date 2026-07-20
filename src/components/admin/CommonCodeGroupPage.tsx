"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Button,
  DataTable,
  FormField,
  Input,
  Modal,
  Select,
  type DataTableColumn,
} from "@/components/common";
import {
  clearGroupSaveStatus,
  clearItemSaveStatus,
  clearManageCodes,
  createCommonCodeGroupRequest,
  createCommonCodeRequest,
  deleteCommonCodeGroupRequest,
  deleteCommonCodeRequest,
  fetchCommonCodeGroupsRequest,
  fetchManageCodesRequest,
  selectCommonCodeGroups,
  selectCommonCodeGroupsError,
  selectCommonCodeGroupsLoading,
  selectGroupSaveError,
  selectGroupSaveStatus,
  selectItemSaveError,
  selectItemSaveStatus,
  selectManageCodes,
  selectManageCodesError,
  selectManageCodesLoading,
  updateCommonCodeGroupRequest,
  updateCommonCodeRequest,
} from "@/features/commoncode/slice";
import type { CommonCodeGroup, CommonCodeItem } from "@/features/commoncode/types";
import type { AppDispatch } from "@/store/store";

export default function CommonCodeGroupPage() {
  const dispatch = useDispatch<AppDispatch>();

  const groups = useSelector(selectCommonCodeGroups);
  const groupsLoading = useSelector(selectCommonCodeGroupsLoading);
  const groupsError = useSelector(selectCommonCodeGroupsError);
  const groupSaveStatus = useSelector(selectGroupSaveStatus);
  const groupSaveError = useSelector(selectGroupSaveError);
  const groupSaving = groupSaveStatus === "saving";

  const items = useSelector(selectManageCodes);
  const itemsLoading = useSelector(selectManageCodesLoading);
  const itemsError = useSelector(selectManageCodesError);
  const itemSaveStatus = useSelector(selectItemSaveStatus);
  const itemSaveError = useSelector(selectItemSaveError);
  const itemSaving = itemSaveStatus === "saving";

  const [selectedGroup, setSelectedGroup] = useState<CommonCodeGroup | null>(null);
  const [itemKeyword, setItemKeyword] = useState("");
  const [itemUseYn, setItemUseYn] = useState("");

  const [groupRegisterOpen, setGroupRegisterOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<CommonCodeGroup | null>(null);
  const [groupForm, setGroupForm] = useState({
    groupCode: "",
    groupName: "",
    useYn: "Y",
  });

  const [itemRegisterOpen, setItemRegisterOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CommonCodeItem | null>(null);
  const [itemForm, setItemForm] = useState({
    codeValue: "",
    codeName: "",
    sortOrder: "",
    useYn: "Y",
  });

  useEffect(() => {
    dispatch(fetchCommonCodeGroupsRequest());
  }, [dispatch]);

  useEffect(() => {
    if (groupSaveStatus !== "success") {
      return;
    }
    setGroupRegisterOpen(false);
    setEditingGroup(null);
    dispatch(clearGroupSaveStatus());
  }, [groupSaveStatus, dispatch]);

  useEffect(() => {
    if (itemSaveStatus !== "success") {
      return;
    }
    setItemRegisterOpen(false);
    setEditingItem(null);
    dispatch(clearItemSaveStatus());
  }, [itemSaveStatus, dispatch]);

  function loadItems(group: CommonCodeGroup, keyword?: string, useYn?: string) {
    dispatch(
      fetchManageCodesRequest({
        groupCode: group.groupCode,
        keyword: keyword || undefined,
        useYn: useYn || undefined,
      }),
    );
  }

  function selectGroup(group: CommonCodeGroup) {
    setSelectedGroup(group);
    setItemKeyword("");
    setItemUseYn("");
    loadItems(group);
  }

  function openGroupRegister() {
    dispatch(clearGroupSaveStatus());
    setGroupForm({ groupCode: "", groupName: "", useYn: "Y" });
    setGroupRegisterOpen(true);
  }

  function openGroupEdit(group: CommonCodeGroup) {
    dispatch(clearGroupSaveStatus());
    setGroupForm({
      groupCode: group.groupCode,
      groupName: group.groupName,
      useYn: group.useYn || "Y",
    });
    setEditingGroup(group);
  }

  function closeGroupModal() {
    if (groupSaving) return;
    setGroupRegisterOpen(false);
    setEditingGroup(null);
    dispatch(clearGroupSaveStatus());
  }

  function handleGroupChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setGroupForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleGroupSubmit(e: FormEvent) {
    e.preventDefault();
    if (editingGroup) {
      dispatch(
        updateCommonCodeGroupRequest({
          groupId: editingGroup.groupId,
          payload: {
            groupName: groupForm.groupName,
            useYn: groupForm.useYn,
          },
        }),
      );
      return;
    }
    dispatch(
      createCommonCodeGroupRequest({
        groupCode: groupForm.groupCode,
        groupName: groupForm.groupName,
        useYn: groupForm.useYn,
      }),
    );
  }

  function handleGroupDelete(group: CommonCodeGroup) {
    if (!window.confirm(`그룹 "${group.groupCode}" 을(를) 삭제할까요?`)) {
      return;
    }
    if (selectedGroup?.groupId === group.groupId) {
      setSelectedGroup(null);
      dispatch(clearManageCodes());
    }
    dispatch(deleteCommonCodeGroupRequest(group.groupId));
  }

  function openItemRegister() {
    if (!selectedGroup) return;
    dispatch(clearItemSaveStatus());
    setItemForm({ codeValue: "", codeName: "", sortOrder: "", useYn: "Y" });
    setItemRegisterOpen(true);
  }

  function openItemEdit(item: CommonCodeItem) {
    dispatch(clearItemSaveStatus());
    setItemForm({
      codeValue: item.codeValue,
      codeName: item.codeName,
      sortOrder: item.sortOrder == null ? "" : String(item.sortOrder),
      useYn: item.useYn || "Y",
    });
    setEditingItem(item);
  }

  function closeItemModal() {
    if (itemSaving) return;
    setItemRegisterOpen(false);
    setEditingItem(null);
    dispatch(clearItemSaveStatus());
  }

  function handleItemChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setItemForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleItemSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedGroup) return;

    const sortOrder =
      itemForm.sortOrder.trim() === "" ? null : Number(itemForm.sortOrder);

    if (editingItem) {
      dispatch(
        updateCommonCodeRequest({
          codeId: editingItem.codeId,
          payload: {
            codeValue: itemForm.codeValue,
            codeName: itemForm.codeName,
            sortOrder,
            useYn: itemForm.useYn,
          },
        }),
      );
      return;
    }

    dispatch(
      createCommonCodeRequest({
        groupId: selectedGroup.groupId,
        codeValue: itemForm.codeValue,
        codeName: itemForm.codeName,
        sortOrder,
        useYn: itemForm.useYn,
      }),
    );
  }

  function handleItemDelete(item: CommonCodeItem) {
    if (!window.confirm(`코드 "${item.codeValue}" 을(를) 삭제할까요?`)) {
      return;
    }
    dispatch(deleteCommonCodeRequest(item.codeId));
  }

  function handleItemSearch() {
    if (!selectedGroup) return;
    loadItems(selectedGroup, itemKeyword, itemUseYn);
  }

  const groupColumns: DataTableColumn<CommonCodeGroup>[] = [
    {
      key: "groupCode",
      header: "그룹코드",
      render: (row) => (
        <span
          className={
            selectedGroup?.groupId === row.groupId
              ? "font-semibold text-sky-700"
              : undefined
          }
        >
          {row.groupCode}
        </span>
      ),
    },
    {
      key: "groupName",
      header: "그룹명",
      render: (row) => row.groupName,
    },
    {
      key: "useYn",
      header: "사용여부",
      render: (row) => row.useYn,
    },
    {
      key: "actions",
      header: "관리",
      render: (row) => (
        <div className="flex gap-2">
          <Button
            variant={selectedGroup?.groupId === row.groupId ? "primary" : "secondary"}
            className="h-8 px-3 text-xs"
            onClick={() => selectGroup(row)}
          >
            항목
          </Button>
          <Button
            variant="secondary"
            className="h-8 px-3 text-xs"
            onClick={() => openGroupEdit(row)}
          >
            수정
          </Button>
          <Button
            variant="secondary"
            className="h-8 px-3 text-xs"
            onClick={() => handleGroupDelete(row)}
          >
            삭제
          </Button>
        </div>
      ),
    },
  ];

  const itemColumns: DataTableColumn<CommonCodeItem>[] = [
    {
      key: "codeValue",
      header: "코드값",
      render: (row) => row.codeValue,
    },
    {
      key: "codeName",
      header: "코드명",
      render: (row) => row.codeName,
    },
    {
      key: "sortOrder",
      header: "정렬",
      render: (row) => row.sortOrder ?? "-",
    },
    {
      key: "useYn",
      header: "사용여부",
      render: (row) => row.useYn,
    },
    {
      key: "actions",
      header: "관리",
      render: (row) => (
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="h-8 px-3 text-xs"
            onClick={() => openItemEdit(row)}
          >
            수정
          </Button>
          <Button
            variant="secondary"
            className="h-8 px-3 text-xs"
            onClick={() => handleItemDelete(row)}
          >
            삭제
          </Button>
        </div>
      ),
    },
  ];

  const groupModalOpen = groupRegisterOpen || editingGroup !== null;
  const itemModalOpen = itemRegisterOpen || editingItem !== null;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {groupsError ? <Alert variant="error">{groupsError}</Alert> : null}
      {groupSaveError && !groupModalOpen ? (
        <Alert variant="error">{groupSaveError}</Alert>
      ) : null}
      {itemsError ? <Alert variant="error">{itemsError}</Alert> : null}
      {itemSaveError && !itemModalOpen ? (
        <Alert variant="error">{itemSaveError}</Alert>
      ) : null}

      {/* 좌: 그룹 / 우: 항목 — 직원 화면과 동일하게 칸 맞춤 */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-2">
        <section className="flex min-h-0 flex-col gap-2">
          <div className="flex h-[52px] shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4">
            <h2 className="shrink-0 text-sm font-semibold text-slate-800">그룹</h2>
            <div className="flex-1" />
            <Button
              variant="primary"
              className="h-8 shrink-0 px-3 text-xs"
              onClick={openGroupRegister}
            >
              그룹등록
            </Button>
          </div>
          <DataTable
            className="!flex-1"
            columns={groupColumns}
            rows={groups}
            rowKey={(row) => row.groupId}
            loading={groupsLoading}
            loadingMessage="그룹 목록을 불러오는 중입니다..."
            emptyMessage="등록된 그룹이 없습니다."
            minWidthClassName="min-w-0"
            equalColumns
          />
        </section>

        <section className="flex min-h-0 flex-col gap-2">
          <div className="flex h-[52px] shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4">
            <h2 className="shrink-0 text-sm font-semibold text-slate-800">
              항목
              {selectedGroup ? ` · ${selectedGroup.groupCode}` : ""}
            </h2>
            <Input
              value={itemKeyword}
              onChange={(e) => setItemKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleItemSearch();
                }
              }}
              placeholder="코드값/코드명"
              disabled={!selectedGroup}
              className="h-8 w-40 shrink-0"
            />
            <Select
              value={itemUseYn}
              onChange={(e) => setItemUseYn(e.target.value)}
              disabled={!selectedGroup}
              className="h-8 w-24 shrink-0"
              options={[
                { value: "", label: "전체" },
                { value: "Y", label: "Y" },
                { value: "N", label: "N" },
              ]}
            />
            <Button
              variant="secondary"
              className="h-8 shrink-0 px-3 text-xs"
              onClick={handleItemSearch}
              disabled={!selectedGroup}
            >
              조회
            </Button>
            <div className="flex-1" />
            <Button
              variant="primary"
              className="h-8 shrink-0 px-3 text-xs"
              onClick={openItemRegister}
              disabled={!selectedGroup}
            >
              항목등록
            </Button>
          </div>

          <DataTable
            className="!flex-1"
            columns={itemColumns}
            rows={selectedGroup ? items : []}
            rowKey={(row) => row.codeId}
            loading={itemsLoading}
            loadingMessage="항목 목록을 불러오는 중입니다..."
            emptyMessage={
              selectedGroup
                ? "등록된 항목이 없습니다."
                : "그룹을 선택하면 항목이 표시됩니다."
            }
            minWidthClassName="min-w-0"
            equalColumns
          />
        </section>
      </div>

      <Modal
        open={groupModalOpen}
        title={editingGroup ? "그룹 수정" : "그룹 등록"}
        onClose={closeGroupModal}
      >
        <form className="flex flex-col gap-3" onSubmit={handleGroupSubmit}>
          {groupSaveError ? <Alert variant="error">{groupSaveError}</Alert> : null}

          <FormField label="그룹코드">
            <Input
              name="groupCode"
              value={groupForm.groupCode}
              onChange={handleGroupChange}
              disabled={editingGroup !== null || groupSaving}
            />
          </FormField>

          <FormField label="그룹명">
            <Input
              name="groupName"
              value={groupForm.groupName}
              onChange={handleGroupChange}
              disabled={groupSaving}
            />
          </FormField>

          <FormField label="사용여부">
            <Select
              name="useYn"
              value={groupForm.useYn}
              onChange={handleGroupChange}
              disabled={groupSaving}
              options={[
                { value: "Y", label: "Y" },
                { value: "N", label: "N" },
              ]}
            />
          </FormField>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={closeGroupModal}
              disabled={groupSaving}
            >
              취소
            </Button>
            <Button type="submit" variant="primary" disabled={groupSaving}>
              {groupSaving ? "저장 중..." : "저장"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={itemModalOpen}
        title={editingItem ? "항목 수정" : "항목 등록"}
        onClose={closeItemModal}
      >
        <form className="flex flex-col gap-3" onSubmit={handleItemSubmit}>
          {itemSaveError ? <Alert variant="error">{itemSaveError}</Alert> : null}

          <FormField label="코드값">
            <Input
              name="codeValue"
              value={itemForm.codeValue}
              onChange={handleItemChange}
              disabled={itemSaving}
            />
          </FormField>

          <FormField label="코드명">
            <Input
              name="codeName"
              value={itemForm.codeName}
              onChange={handleItemChange}
              disabled={itemSaving}
            />
          </FormField>

          <FormField label="정렬순서">
            <Input
              name="sortOrder"
              value={itemForm.sortOrder}
              onChange={handleItemChange}
              disabled={itemSaving}
            />
          </FormField>

          <FormField label="사용여부">
            <Select
              name="useYn"
              value={itemForm.useYn}
              onChange={handleItemChange}
              disabled={itemSaving}
              options={[
                { value: "Y", label: "Y" },
                { value: "N", label: "N" },
              ]}
            />
          </FormField>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={closeItemModal}
              disabled={itemSaving}
            >
              취소
            </Button>
            <Button type="submit" variant="primary" disabled={itemSaving}>
              {itemSaving ? "저장 중..." : "저장"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
