"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { Alert, Button, ConfirmDialog, FormField, Input } from "@/components/common";
import ActorField from "@/components/emergency/common/ActorField";
import DownSelect from "@/components/emergency/common/DownSelect";
import StaffName from "@/components/emergency/common/StaffName";
import { useActorId } from "@/features/emergency/common/staff";
import { resolveEmergencyMessage } from "@/features/emergency/messages";
import { referenceDocumentFileUrl } from "@/features/emergency/reference/api";
import {
  deleteReferenceDocumentRequest,
  fetchReferenceDocumentsRequest,
  selectReferenceDocumentDeleteError,
  selectReferenceDocumentDeletingId,
  selectReferenceDocuments,
  selectReferenceDocumentsError,
  selectReferenceDocumentsLoading,
  selectReferenceDocumentUploadError,
  selectReferenceDocumentUploading,
  uploadReferenceDocumentRequest,
} from "@/features/emergency/reference/slice";
import {
  REFERENCE_DOCUMENT_ACCEPT,
  REFERENCE_DOCUMENT_CATEGORY_MAX,
  REFERENCE_DOCUMENT_TITLE_MAX,
  type ReferenceDocument,
} from "@/features/emergency/reference/types";
import { holdUploadFile } from "@/features/emergency/reference/uploadHold";
import {
  categoriesOf,
  filterReferenceDocuments,
  formatFileSize,
  opensInBrowser,
  validateReferenceFile,
} from "@/features/emergency/reference/utils";
import { formatDateTime } from "@/features/emergency/utils";

const initialForm = { title: "", category: "", uploadedById: "" };

/** 분류 선택 목록의 "새 분류" 항목 값(실제 분류 이름과 겹치지 않는 값) */
const NEW_CATEGORY_VALUE = "__new_category__";

/**
 * 응급 참고 문서 라이브러리 — 프로토콜·지침·서식 파일을 찾아 보고, 올리고, 목록에서 뺀다.
 * - 환자·접수와 무관한 자료라 환자를 고르지 않아도 쓴다(그래서 환자 탭이 아니라 별도 화면이다).
 * - 파일 본문은 서버가 SeaweedFS 에서 읽어 준다. pdf·이미지는 새 탭에서 바로 열리고 나머지는 내려받는다.
 * - 올린 사람·삭제한 사람은 "Staff" 칸에서 고른 직원이고, 안 골랐으면 로그인한 사람이다(PC 를 같이 쓰는 병원 환경).
 */
export default function ReferenceDocumentPanel() {
  const dispatch = useDispatch<AppDispatch>();
  const items = useSelector(selectReferenceDocuments);
  const loading = useSelector(selectReferenceDocumentsLoading);
  const error = useSelector(selectReferenceDocumentsError);
  const uploading = useSelector(selectReferenceDocumentUploading);
  const uploadError = useSelector(selectReferenceDocumentUploadError);
  const deletingId = useSelector(selectReferenceDocumentDeletingId);
  const deleteError = useSelector(selectReferenceDocumentDeleteError);

  const [keyword, setKeyword] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [form, setForm] = useState(initialForm);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  // 파일 선택창은 값을 코드로 비울 수 없어서 key 를 바꿔 새로 그린다
  const [fileInputKey, setFileInputKey] = useState(0);
  const [pendingDelete, setPendingDelete] = useState<ReferenceDocument | null>(null);
  const [wasUploading, setWasUploading] = useState(false);
  // 분류를 목록에서 고르지 않고 직접 입력하는 중인지
  const [newCategory, setNewCategory] = useState(false);
  const actorId = useActorId(form.uploadedById, "STAFF");
  const loadedOnce = useRef(false);

  useEffect(() => {
    if (!loadedOnce.current) {
      loadedOnce.current = true;
      dispatch(fetchReferenceDocumentsRequest());
    }
  }, [dispatch]);

  // 업로드가 오류 없이 끝나면 입력을 비운다
  if (uploading !== wasUploading) {
    setWasUploading(uploading);
    if (wasUploading && !uploading && !uploadError) {
      setForm((prev) => ({ ...initialForm, uploadedById: prev.uploadedById }));
      setFile(null);
      setFileError("");
      setFileInputKey((key) => key + 1);
      setNewCategory(false);
    }
  }

  const categories = useMemo(() => categoriesOf(items), [items]);
  const visible = useMemo(() => filterReferenceDocuments(items, keyword, categoryFilter), [items, keyword, categoryFilter]);
  const categoryOptions = categories.map((category) => ({ value: category, label: category }));
  // 있던 분류가 없으면 목록 대신 바로 입력칸을 보여 준다
  const typingCategory = categories.length === 0 || newCategory;
  const filtering = keyword.trim() !== "" || categoryFilter !== "";

  const canUpload = !!file && !fileError && !!actorId && !uploading;

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0] ?? null;
    setFile(picked);
    setFileError(picked ? validateReferenceFile(picked) : "");
  }

  function handleUpload() {
    if (!file || !canUpload) return;
    dispatch(
      uploadReferenceDocumentRequest({
        fileKey: holdUploadFile(file),
        title: form.title.trim() || undefined,
        category: form.category.trim() || undefined,
        uploadedById: actorId,
      }),
    );
  }

  function handleConfirmDelete() {
    if (!pendingDelete || !actorId) return;
    dispatch(deleteReferenceDocumentRequest({ id: pendingDelete.id, deletedById: actorId }));
    setPendingDelete(null);
  }

  return (
    <div className="grid min-h-[38rem] flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)] lg:grid-rows-[minmax(0,1fr)]">
      {/* 문서 목록 */}
      <section className="flex min-h-0 min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-4">
        {/* 문서 목록 */}
        <h2 className="mb-1 text-sm font-semibold text-slate-800">Documents</h2>
        {/* 프로토콜·지침·서식을 찾아 봅니다. 환자와 무관한 자료입니다. */}
        <p className="mb-3 text-xs text-slate-400">
          Protocols, guidelines and forms for the emergency department. Not linked to any patient.
        </p>

        <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_200px]">
          <FormField label="Search">
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Title, category or file name"
            />
          </FormField>
          <DownSelect
            label="Category"
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={categoryOptions}
            placeholder="All categories"
            allowClear
            disabled={categories.length === 0}
          />
        </div>

        {deleteError ? <Alert className="mb-3">{resolveEmergencyMessage(deleteError)}</Alert> : null}

        {loading ? (
          // 문서 목록을 불러오는 중입니다...
          <p className="py-6 text-center text-sm text-slate-400">Loading documents...</p>
        ) : error ? (
          <Alert>{resolveEmergencyMessage(error)}</Alert>
        ) : visible.length === 0 ? (
          <p className="rounded-lg bg-slate-50 px-3 py-6 text-center text-sm text-slate-400">
            {/* 조건에 맞는 문서가 없습니다. / 등록된 문서가 없습니다. */}
            {filtering ? "No documents match your search." : "No reference documents yet."}
          </p>
        ) : (
          <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto">
            {visible.map((item) => {
              const deleting = deletingId === item.id;
              return (
                <li key={item.id} className="flex flex-wrap items-center gap-3 rounded-lg bg-slate-50 p-3 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2">
                      {item.category ? (
                        <span className="rounded bg-sky-50 px-1.5 py-0.5 text-[11px] font-medium text-sky-700">
                          {item.category}
                        </span>
                      ) : null}
                      <span className="break-words font-medium text-slate-800">{item.title}</span>
                    </p>
                    <p className="mt-1 break-all text-xs text-slate-400">
                      {/* 파일 이름 · 크기 · 올린 사람 · 올린 일시 */}
                      {item.fileName} · {formatFileSize(item.fileSize)} · Uploaded by <StaffName empId={item.uploadedById} /> ·{" "}
                      {formatDateTime(item.uploadedAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <a
                      href={referenceDocumentFileUrl(item.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                    >
                      {/* 열기 / 내려받기 */}
                      {opensInBrowser(item) ? "Open" : "Download"}
                    </a>
                    <Button
                      variant="ghost"
                      onClick={() => setPendingDelete(item)}
                      disabled={deleting || !actorId}
                      title={actorId ? undefined : "Select the staff member first."}
                    >
                      {deleting ? "Deleting..." : "Delete"}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* 업로드 */}
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        {/* 문서 올리기 */}
        <h2 className="mb-1 text-sm font-semibold text-slate-800">Upload Document</h2>
        {/* 10MB 이하 pdf·이미지·Office·한글 파일 */}
        <p className="mb-3 text-xs text-slate-400">PDF, images, Office and Hangul files up to 10 MB.</p>

        {uploadError ? <Alert className="mb-3">{resolveEmergencyMessage(uploadError)}</Alert> : null}

        <div className="space-y-3">
          {/* 파일 */}
          <FormField label="File" required>
            <input
              key={fileInputKey}
              type="file"
              accept={REFERENCE_DOCUMENT_ACCEPT}
              onChange={handleFileChange}
              disabled={uploading}
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-sky-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-sky-700 hover:file:bg-sky-100"
            />
          </FormField>
          {fileError ? <p className="-mt-2 text-xs text-rose-600">{fileError}</p> : null}

          {/* 올린 사람·삭제한 사람 */}
          <ActorField
            label="Staff"
            role="STAFF"
            required
            value={form.uploadedById}
            onChange={(empId) => setForm((prev) => ({ ...prev, uploadedById: empId }))}
            disabled={uploading}
          />

          {/* 제목 (비우면 파일 이름) */}
          <FormField label="Title" hint="Leave empty to use the file name.">
            <Input
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              maxLength={REFERENCE_DOCUMENT_TITLE_MAX}
              disabled={uploading}
            />
          </FormField>

          {/* 분류: 있던 분류에서 고르거나 "새 분류"로 직접 입력(분류가 아직 없으면 바로 입력) */}
          {typingCategory ? (
            <div>
              <FormField label="Category" hint="New category, up to 50 characters.">
                <Input
                  value={form.category}
                  onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                  maxLength={REFERENCE_DOCUMENT_CATEGORY_MAX}
                  disabled={uploading}
                />
              </FormField>
              {categories.length > 0 ? (
                <button
                  type="button"
                  className="mt-1 text-xs font-medium text-sky-700 hover:underline disabled:opacity-50"
                  disabled={uploading}
                  onClick={() => {
                    setNewCategory(false);
                    setForm((prev) => ({ ...prev, category: "" }));
                  }}
                >
                  {/* 있던 분류에서 고르기 */}
                  Choose from existing categories
                </button>
              ) : null}
            </div>
          ) : (
            <DownSelect
              label="Category"
              value={form.category}
              onChange={(value) => {
                if (value === NEW_CATEGORY_VALUE) {
                  setNewCategory(true);
                  setForm((prev) => ({ ...prev, category: "" }));
                } else {
                  setForm((prev) => ({ ...prev, category: value }));
                }
              }}
              options={[...categories.map((category) => ({ value: category, label: category })), { value: NEW_CATEGORY_VALUE, label: "+ New category..." }]}
              placeholder="(optional)"
              allowClear
              disabled={uploading}
            />
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <Button onClick={handleUpload} disabled={!canUpload}>
            {/* 올리는 중... / 올리기 */}
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        </div>
      </section>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete document"
        message={`Remove "${pendingDelete?.title ?? ""}" from the list? The file will be deleted from the server.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        danger
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
