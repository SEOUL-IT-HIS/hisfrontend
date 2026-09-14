"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { Alert, Button, ConfirmDialog, FormField, Input } from "@/components/common";
import { useCommonCodeOptions } from "@/features/commonCode/hooks/useCommonCodeOptions";
import type { CommonCodeOption } from "@/features/commonCode/hooks/useCommonCodeOptions";
import { usePatientNames } from "@/features/labimaging/common/hooks/usePatientNames";
import { resolveImageReadingMessage } from "@/features/labimaging/imaginginterpretation/messages";
import {
  assignReadingRequest,
  confirmReadingRequest,
  fetchReadingDetailRequest,
  resetImageReadingDetail,
  selectLastSubmittedReading,
  selectLoadedReadingItemId,
  selectReadingDetail,
  selectReadingDetailError,
  selectReadingDetailLoading,
  selectReadingSubmitError,
  selectReadingSubmitting,
  updateFindingsRequest,
} from "@/features/labimaging/imaginginterpretation/slice";
import {
  READING_STATUS,
  READING_STATUS_LABELS,
} from "@/features/labimaging/imaginginterpretation/types";
import {
  fetchImageFilesRequest,
  resetImageFileState,
  selectImageFiles,
  selectImageFilesError,
  selectImageFilesLoading,
  selectLoadedImageFileItemId,
} from "@/features/labimaging/imagingacquisition/slice";
import { resolveImageFileMessage } from "@/features/labimaging/imagingacquisition/messages";

/**
 * 판독 상세 — 영상 확인 + 소견 입력 + 배정/확정.
 * 대응 유스케이스: UC-IMG-04 영상판독처리 (Jira ZP2-23)
 *
 * ⚠ DICOM 뷰어·윈도잉 등 전문 판독 기능은 만들지 않는다(2026-08-31 결정). 이미지 계열
 *   파일(jpeg/png/tiff)만 <img> 로 미리보기하고, 그 외(application/dicom)는 파일명과
 *   다운로드 링크만 보여준다.
 *
 * ⚠ 영상은 기존 imagingacquisition 다운로드 엔드포인트
 *   (GET /api/lab-imaging/image-files/{imageFileId}/download) 를 <img src>/<a href> 에
 *   그대로 쓴다. 인증은 세션 쿠키(withCredentials, lib/axios.ts 참고)라 별도 토큰을 붙일
 *   필요가 없고, next.config.ts rewrite 로 같은 출처에서 lab-imaging-service 로 프록시되므로
 *   브라우저가 별도 헤더 없이 쿠키를 그대로 실어 보낸다.
 *
 * ⚠ 소견(findings)은 이 컴포넌트가 처음 로딩됐을 때 딱 한 번만 서버 값으로 채운다
 *   (syncedReadingId). 배정 등 다른 저장이 상세를 다시 불러올 때마다 입력 중이던
 *   글자를 지우면 안 되기 때문이다.
 */

/** 공통코드값 → 코드명. 아직 못 불러왔거나 사전에 없는 값이면 코드값을 그대로 보여준다. */
function toCodeLabel(options: CommonCodeOption[], code?: string) {
  if (!code) return "-";
  return options.find((opt) => opt.value === code)?.label ?? code;
}

/** 백엔드가 ISO 문자열로 준다. 초 단위는 화면에서 의미가 없어 분까지만 보여준다. */
function formatDateTime(value?: string) {
  if (!value) return "-";
  return value.replace("T", " ").slice(0, 16);
}

function imageFileUrl(imageFileId: string) {
  return `/api/lab-imaging/image-files/${encodeURIComponent(imageFileId)}/download`;
}

type FieldErrors = {
  assignedToId?: string;
  findings?: string;
  signedById?: string;
};

export default function ImageReadingDetail({
  imageOrderItemId,
}: {
  imageOrderItemId: string;
}) {
  const dispatch = useDispatch<AppDispatch>();

  const detail = useSelector(selectReadingDetail);
  const detailLoading = useSelector(selectReadingDetailLoading);
  const detailError = useSelector(selectReadingDetailError);
  const loadedReadingItemId = useSelector(selectLoadedReadingItemId);

  const submitting = useSelector(selectReadingSubmitting);
  const submitError = useSelector(selectReadingSubmitError);
  const lastSubmitted = useSelector(selectLastSubmittedReading);

  const files = useSelector(selectImageFiles);
  const filesLoading = useSelector(selectImageFilesLoading);
  const filesError = useSelector(selectImageFilesError);
  const loadedFileItemId = useSelector(selectLoadedImageFileItemId);

  const imageItemTypes = useCommonCodeOptions("IMG_ITEM_CD");

  const [findingsText, setFindingsText] = useState("");
  /** 소견 입력칸을 서버 값으로 채운 판독ID. 아직 안 채웠으면 null. (아래 렌더 중 동기화 참고) */
  const [syncedReadingId, setSyncedReadingId] = useState<string | null>(null);
  const [assignedToId, setAssignedToId] = useState("");
  const [signedById, setSignedById] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [confirmOpen, setConfirmOpen] = useState(false);

  /* 촬영항목이 바뀌면 이전 항목의 상세·영상파일·오류를 지우고 새로 불러온다. */
  useEffect(() => {
    dispatch(resetImageReadingDetail());
    dispatch(resetImageFileState());
    dispatch(fetchReadingDetailRequest(imageOrderItemId));
    dispatch(fetchImageFilesRequest(imageOrderItemId));
  }, [dispatch, imageOrderItemId]);

  /*
   * 상세가 처음 도착했을 때 딱 한 번만 소견 입력칸을 서버 값으로 채운다. (위 주석 참고)
   *
   * ⚠ useEffect + setState 대신 렌더 중 조건부 setState 로 "state 조정"한다(React 공식 권장
   *   패턴). effect 안에서 매번 setState 하면 커밋 후 추가 렌더가 한 번 더 발생하고,
   *   이 판독ID 를 이미 동기화했는지 여부로 막지 않으면 매 렌더마다 실행된다.
   *   syncedReadingId 로 "이 판독ID 는 이미 채웠다"를 표시해 두 번 이상 실행되지 않게 한다.
   */
  if (detail && loadedReadingItemId === imageOrderItemId && detail.imageReadingId !== syncedReadingId) {
    setSyncedReadingId(detail.imageReadingId);
    setFindingsText(detail.findings ?? "");
  }

  const detailLoaded = loadedReadingItemId === imageOrderItemId && detail !== null;
  const filesLoaded = loadedFileItemId === imageOrderItemId;
  const { names: patientNames } = usePatientNames(detail ? [detail.patientId] : []);

  const isConfirmed = detail?.readingStatusCode === READING_STATUS.CONFIRMED;

  function handleAssign() {
    if (!detail) return;
    if (!assignedToId.trim()) {
      setErrors((prev) => ({ ...prev, assignedToId: "Reader staff ID is required." }));
      return;
    }
    setErrors((prev) => ({ ...prev, assignedToId: undefined }));
    dispatch(
      assignReadingRequest(
        detail.imageReadingId,
        { assignedToId: assignedToId.trim() },
        imageOrderItemId,
      ),
    );
    setAssignedToId("");
  }

  function handleSaveFindings() {
    if (!detail) return;
    if (!findingsText.trim()) {
      setErrors((prev) => ({ ...prev, findings: "Findings cannot be empty." }));
      return;
    }
    setErrors((prev) => ({ ...prev, findings: undefined }));
    dispatch(
      updateFindingsRequest(
        detail.imageReadingId,
        { findings: findingsText.trim() },
        imageOrderItemId,
      ),
    );
  }

  function handleConfirmClick() {
    if (!detail) return;
    const nextErrors: FieldErrors = {};
    if (!signedById.trim()) nextErrors.signedById = "Signer staff ID is required.";
    if (!detail.findings?.trim()) nextErrors.findings = "Save findings before confirming.";
    setErrors((prev) => ({ ...prev, ...nextErrors }));
    if (Object.values(nextErrors).some(Boolean)) return;
    setConfirmOpen(true);
  }

  function handleConfirm() {
    if (!detail) return;
    dispatch(
      confirmReadingRequest(
        detail.imageReadingId,
        { signedById: signedById.trim() },
        imageOrderItemId,
      ),
    );
    setConfirmOpen(false);
  }

  if (detailLoading && !detailLoaded) {
    return <p className="text-sm text-slate-400">Loading reading detail...</p>;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 rounded-xl border border-slate-200 p-4">
      {detailError ? <Alert>{resolveImageReadingMessage(detailError)}</Alert> : null}
      {submitError ? <Alert>{resolveImageReadingMessage(submitError)}</Alert> : null}
      {lastSubmitted && lastSubmitted.imageOrderItemId === imageOrderItemId ? (
        <Alert variant="success">
          Reading updated — status:{" "}
          {READING_STATUS_LABELS[lastSubmitted.readingStatusCode] ??
            lastSubmitted.readingStatusCode}
        </Alert>
      ) : null}

      {detail ? (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-semibold text-slate-800">
            {toCodeLabel(imageItemTypes.options, detail.imageItemCode)}
          </span>
          <span className="text-slate-500">
            {patientNames[detail.patientId] ?? "Unknown patient"}
          </span>
          {detail.urgencyYn === "Y" ? (
            <span className="rounded bg-rose-50 px-1.5 py-0.5 text-xs font-medium text-rose-600">
              Urgent
            </span>
          ) : null}
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600">
            {READING_STATUS_LABELS[detail.readingStatusCode] ?? detail.readingStatusCode}
          </span>
        </div>
      ) : null}

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
        {/* ---------- 영상 미리보기 ---------- */}
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-slate-700">Images</p>
          {filesError ? <Alert>{resolveImageFileMessage(filesError)}</Alert> : null}

          {filesLoading || !filesLoaded ? (
            <p className="text-sm text-slate-400">Loading images...</p>
          ) : files.length === 0 ? (
            <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">
              No image files registered for this item yet.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {files.map((file) => {
                const isPreviewable = file.contentType.startsWith("image/");
                return (
                  <div
                    key={file.imageFileId}
                    className="rounded-xl border border-slate-200 p-2"
                  >
                    {isPreviewable ? (
                      // eslint-disable-next-line @next/next/no-img-element -- lab-imaging-service 는 next/image 의 외부 이미지 도메인 설정 대상이 아니다. 원본 그대로 보여주면 되는 화면이라 <img> 로 충분하다.
                      <img
                        src={imageFileUrl(file.imageFileId)}
                        alt={file.fileName}
                        className="h-40 w-full rounded-lg bg-slate-50 object-contain"
                      />
                    ) : (
                      <div className="flex h-40 w-full items-center justify-center rounded-lg bg-slate-50 text-center text-xs text-slate-400">
                        {file.contentType}
                        <br />
                        preview not available
                      </div>
                    )}
                    <p
                      className="mt-1 truncate text-xs text-slate-500"
                      title={file.fileName}
                    >
                      {file.fileName}
                    </p>
                    <a
                      href={imageFileUrl(file.imageFileId)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-sky-600 hover:underline"
                    >
                      Download
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ---------- 소견 / 배정 / 확정 ---------- */}
        <div className="flex flex-col gap-4">
          <FormField label="Findings" required>
            <textarea
              value={findingsText}
              onChange={(e) => {
                setFindingsText(e.target.value);
                setErrors((prev) => ({ ...prev, findings: undefined }));
              }}
              disabled={isConfirmed || submitting}
              rows={8}
              placeholder="Describe the imaging findings..."
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 disabled:bg-slate-50 disabled:text-slate-500"
            />
            {errors.findings ? (
              <span className="text-xs text-rose-500">{errors.findings}</span>
            ) : null}
          </FormField>
          <div className="flex justify-end">
            <Button
              variant="secondary"
              onClick={handleSaveFindings}
              disabled={isConfirmed || submitting}
            >
              {submitting ? "Saving..." : "Save Findings"}
            </Button>
          </div>

          <div className="flex flex-wrap items-end gap-3 border-t border-slate-100 pt-3">
            <FormField label="Assign To (Staff ID)" className="w-48">
              <Input
                value={assignedToId}
                onChange={(e) => {
                  setAssignedToId(e.target.value);
                  setErrors((prev) => ({ ...prev, assignedToId: undefined }));
                }}
                maxLength={20}
                disabled={isConfirmed || submitting}
                placeholder="e.g. STF00099"
              />
              {errors.assignedToId ? (
                <span className="text-xs text-rose-500">{errors.assignedToId}</span>
              ) : null}
            </FormField>
            <Button
              variant="secondary"
              onClick={handleAssign}
              disabled={isConfirmed || submitting}
            >
              Assign
            </Button>
            {detail?.assignedToId ? (
              <span className="text-xs text-slate-400">
                Currently assigned to {detail.assignedToId}
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap items-end gap-3 border-t border-slate-100 pt-3">
            <FormField label="Signed By (Staff ID)" className="w-48">
              <Input
                value={signedById}
                onChange={(e) => {
                  setSignedById(e.target.value);
                  setErrors((prev) => ({ ...prev, signedById: undefined }));
                }}
                maxLength={20}
                disabled={isConfirmed || submitting}
                placeholder="e.g. STF00099"
              />
              {errors.signedById ? (
                <span className="text-xs text-rose-500">{errors.signedById}</span>
              ) : null}
            </FormField>
            <Button onClick={handleConfirmClick} disabled={isConfirmed || submitting}>
              {isConfirmed ? "Confirmed" : "Confirm Reading"}
            </Button>
          </div>

          {isConfirmed ? (
            <p className="text-xs text-slate-400">
              Confirmed by {detail?.signedById} at {formatDateTime(detail?.signedAt)}
            </p>
          ) : null}
        </div>
      </div>

      {/*
        ⚠ 확정은 되돌릴 수 없다. 무엇을 확정하는지(서명자)와 그 사실을 문구로 함께 밝힌다.
          (LabResultWorkPanel 의 확정 다이얼로그와 같은 이유)
      */}
      <ConfirmDialog
        open={confirmOpen}
        title="Confirm Reading"
        message={`Confirm this reading as ${signedById.trim()}? A confirmed reading can no longer be edited.`}
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        danger
        submitting={submitting}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
