"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { Alert, Button, FormField, Input } from "@/components/common";
import { useCommonCodeOptions } from "@/features/commonCode/hooks/useCommonCodeOptions";
import type { CommonCodeOption } from "@/features/commonCode/hooks/useCommonCodeOptions";
import { resolveImageFileMessage } from "@/features/labimaging/imagingacquisition/messages";
import {
  fetchImageFilesRequest,
  resetImageFileState,
  selectImageFileUploadError,
  selectImageFileUploading,
  selectImageFiles,
  selectImageFilesError,
  selectImageFilesLoading,
  selectLastUploadedImageFile,
  selectLoadedImageFileItemId,
  uploadImageFileRequest,
} from "@/features/labimaging/imagingacquisition/slice";
import {
  fetchImageScheduleItemsRequest,
  resetImageScheduleState,
  selectImageScheduleItems,
  selectImageScheduleItemsError,
  selectImageScheduleItemsLoading,
} from "@/features/labimaging/imagingschedule/slice";
import type { ImageScheduleItem } from "@/features/labimaging/imagingschedule/types";
import type { ImageWorklistItem } from "@/features/labimaging/imagingorder/types";

/**
 * 선택한 접수의 촬영항목별 영상파일을 업로드하고 목록을 확인하는 영역.
 * 대응 유스케이스: UC-IMG-03 촬영/영상판독대기등록
 *   (Jira ZP2-105 사전요건 검증, ZP2-106 상태 전이, ZP2-108 저장, ZP2-111 화면 연동)
 *
 * ⚠ 이 화면의 실제 범위는 "촬영 수행 + 영상파일 저장"이다. 판독(Reading) 자체는
 *   별도 화면(ZP2-23)이고 여기서 다루지 않는다 — 업로드 후에는 워크리스트의 다음 단계
 *   표시가 "Reading" 으로 바뀌는 것으로 끝난다.
 *
 * ⚠ 입력 단위는 "촬영항목"이라 접수보다 한 단계 아래다. 그래서 목록의 행이 되지 못하고
 *   접수를 고른 뒤 이 안에서 항목을 다시 고르는 2단 구조가 된다.
 *   (LabResultWorkPanel, ImageScheduleRegisterForm 과 같은 구조 — 오더 1건에 항목이 여러 건인 1:N)
 *
 * ⚠ 항목 목록은 이 기능 자신의 API 가 아니라 imagingschedule 기능의
 *   fetchImageScheduleItemsRequest/selectImageScheduleItems 를 그대로 재사용한다.
 *   워크리스트 응답(ImageWorklistItemDto)에는 항목 목록이 없고 개수만 있어서,
 *   같은 목적으로 이미 존재하는 조회를 새로 만들 이유가 없다. 덤으로 각 항목의
 *   schedule 유무를 알 수 있어 "일정부터 등록하라"는 안내를 화면에서 미리 보여줄 수 있다.
 *   (imagingacquisition/types.ts 상단 주석 참고)
 */

const ALLOWED_ACCEPT = ".dcm,application/dicom,image/jpeg,image/png,image/tiff";

/** 바이트 → 사람이 읽는 단위. 업로드 목록에 파일 크기를 보여줄 때 쓴다. */
function formatFileSize(bytes?: number) {
  if (bytes === undefined || bytes === null) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** 백엔드가 ISO 문자열로 준다. 초 단위는 화면에서 의미가 없어 분까지만 보여준다. */
function formatDateTime(value?: string) {
  if (!value) return "-";
  return value.replace("T", " ").slice(0, 16);
}

/** 공통코드값 → 코드명. 아직 못 불러왔거나 사전에 없는 값이면 코드값을 그대로 보여준다. */
function toCodeLabel(options: CommonCodeOption[], code?: string) {
  if (!code) return "-";
  return options.find((opt) => opt.value === code)?.label ?? code;
}

export default function ImageAcquisitionWorkPanel({
  reception,
}: {
  reception: ImageWorklistItem;
}) {
  const dispatch = useDispatch<AppDispatch>();

  const scheduleItems = useSelector(selectImageScheduleItems);
  const itemsLoading = useSelector(selectImageScheduleItemsLoading);
  const itemsError = useSelector(selectImageScheduleItemsError);

  const files = useSelector(selectImageFiles);
  const filesLoading = useSelector(selectImageFilesLoading);
  const filesError = useSelector(selectImageFilesError);
  const loadedItemId = useSelector(selectLoadedImageFileItemId);
  const uploading = useSelector(selectImageFileUploading);
  const uploadError = useSelector(selectImageFileUploadError);
  const lastUploaded = useSelector(selectLastUploadedImageFile);

  // 촬영항목코드는 admin 공통코드다. (ImageScheduleRegisterForm 과 동일 그룹)
  const imageItemTypes = useCommonCodeOptions("IMG_ITEM_CD");

  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedById, setUploadedById] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<{ file?: string; uploadedById?: string }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  /*
   * 접수가 바뀌면 이전 접수의 항목·파일 목록을 지우고 새로 불러온다.
   *
   * ⚠ imagingschedule 상태도 함께 초기화한다. Schedule 탭과 같은 slice 를 공유하는데,
   *   탭은 한 번에 하나만 마운트되므로(부모가 key 로 다시 마운트) 서로 덮어써도 문제가 없다.
   *   오히려 초기화하지 않으면 다른 접수의 항목 목록이 한 프레임 스쳐 보일 수 있다.
   */
  useEffect(() => {
    dispatch(resetImageScheduleState());
    dispatch(resetImageFileState());
    dispatch(fetchImageScheduleItemsRequest(reception.receptionNo));
  }, [dispatch, reception.receptionNo]);

  /* 항목을 고르면 그 항목의 영상파일 목록을 불러온다. */
  useEffect(() => {
    if (!selectedItemId) return;
    dispatch(fetchImageFilesRequest(selectedItemId));
  }, [dispatch, selectedItemId]);

  const selected: ImageScheduleItem | null =
    scheduleItems.find((i) => i.imageOrderItemId === selectedItemId) ?? null;

  /** 화면에 보이는 파일 목록이 정말 "이 항목의 것"인지. (ConsentWorkPanel 의 loaded 대조와 같은 방어) */
  const filesLoaded = loadedItemId === selectedItemId;

  function handleSelectItem(item: ImageScheduleItem) {
    setSelectedItemId(item.imageOrderItemId);
    setSelectedFile(null);
    setFieldErrors({});
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    setSelectedFile(e.target.files?.[0] ?? null);
    setFieldErrors((prev) => ({ ...prev, file: undefined }));
  }

  function handleUpload() {
    if (!selected) return;

    const nextErrors: { file?: string; uploadedById?: string } = {};
    if (!selectedFile) nextErrors.file = "Please choose a file to upload.";
    if (!uploadedById.trim()) nextErrors.uploadedById = "Uploaded-by staff ID is required.";
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !selectedFile) return;

    dispatch(
      uploadImageFileRequest({
        file: selectedFile,
        imageReceptionId: reception.imageReceptionId,
        imageOrderItemId: selected.imageOrderItemId,
        patientId: reception.patientId,
        uploadedById: uploadedById.trim(),
      }),
    );

    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5">
      {itemsError ? <Alert>{resolveImageFileMessage(itemsError)}</Alert> : null}
      {uploadError ? <Alert>{resolveImageFileMessage(uploadError)}</Alert> : null}
      {lastUploaded ? (
        <Alert variant="success">
          {lastUploaded.fileName} has been registered ({formatFileSize(lastUploaded.fileSize)}).
        </Alert>
      ) : null}

      {/* ---------- 촬영항목 목록 ---------- */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-slate-700">Imaging Items</p>

        {itemsLoading ? (
          <p className="text-sm text-slate-400">Loading imaging items...</p>
        ) : scheduleItems.length === 0 ? (
          <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">
            This reception has no imaging items.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
            {scheduleItems.map((item) => {
              const isSelected = item.imageOrderItemId === selectedItemId;
              const hasSchedule = Boolean(item.schedule);
              return (
                <li key={item.imageOrderItemId}>
                  <button
                    type="button"
                    onClick={() => handleSelectItem(item)}
                    disabled={uploading}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm ${
                      isSelected ? "bg-sky-50" : ""
                    }`}
                  >
                    <span
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                        isSelected ? "bg-sky-500" : "bg-slate-200"
                      }`}
                    />
                    <span className="w-40 shrink-0 font-semibold text-slate-700">
                      {toCodeLabel(imageItemTypes.options, item.imageItemCode)}
                    </span>
                    {/*
                      ⚠ 일정이 없는 항목은 업로드를 시도해도 서버가 LAB053 으로 거절한다.
                        여기서 미리 알려주는 이유는, 담당자가 왜 막혔는지 오류 문구를 읽기 전에
                        먼저 눈으로 알 수 있게 하기 위해서다.
                    */}
                    {hasSchedule ? (
                      <span className="text-xs text-slate-400">
                        Scheduled {formatDateTime(item.schedule?.scheduledAt)}
                      </span>
                    ) : (
                      <span className="rounded bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-700">
                        No schedule yet
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ---------- 업로드 + 파일 목록 ---------- */}
      {selected ? (
        <div className="flex min-h-0 flex-1 flex-col gap-4">
          <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 p-4">
            <FormField label="Image File" className="flex-1">
              {/*
                ⚠ 드래그앤드롭 등 고급 업로드 UI는 범위 밖이다. 참고할 기존 업로드 컴포넌트가
                  없어 공통 컴포넌트(FormField/Button)와 어울리는 최소한의 <input type="file"> 로 둔다.
                ⚠ accept 는 브라우저 파일 선택창의 안내일 뿐 강제가 아니다. 실제 형식 검증은
                  서버(ImageFileService.ALLOWED_CONTENT_TYPES)가 한다 — 여기서 막아도 서버가
                  다시 확인하는 이유는 이 accept 속성을 무시하고 파일을 골라 보낼 수 있기 때문이다.
              */}
              <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_ACCEPT}
                onChange={handleFileChange}
                disabled={uploading}
                className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-500"
              />
              {fieldErrors.file ? (
                <span className="text-xs text-rose-500">{fieldErrors.file}</span>
              ) : null}
            </FormField>
            <FormField label="Uploaded By" className="w-40">
              <Input
                value={uploadedById}
                onChange={(e) => setUploadedById(e.target.value)}
                maxLength={20}
                disabled={uploading}
                placeholder="e.g. STF00021"
              />
              {fieldErrors.uploadedById ? (
                <span className="text-xs text-rose-500">{fieldErrors.uploadedById}</span>
              ) : null}
            </FormField>
            <Button type="button" onClick={handleUpload} disabled={uploading}>
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-2">
            <p className="text-sm font-semibold text-slate-700">
              Registered Files{" "}
              {filesLoaded && !filesLoading ? `(${files.length})` : ""}
            </p>
            {filesError ? <Alert>{resolveImageFileMessage(filesError)}</Alert> : null}

            {filesLoading || !filesLoaded ? (
              <p className="text-sm text-slate-400">Loading...</p>
            ) : files.length === 0 ? (
              <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">
                No image files registered yet.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                <li className="flex items-center gap-3 bg-slate-50/70 px-4 py-2 text-xs font-medium text-slate-400">
                  <span className="flex-1">File Name</span>
                  <span className="w-20 shrink-0">Size</span>
                  <span className="w-36 shrink-0">Uploaded At</span>
                  <span className="w-28 shrink-0">Uploaded By</span>
                </li>
                {files.map((file) => (
                  <li
                    key={file.imageFileId}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700"
                  >
                    <span className="flex-1 truncate font-medium">{file.fileName}</span>
                    <span className="w-20 shrink-0 text-slate-500">
                      {formatFileSize(file.fileSize)}
                    </span>
                    <span className="w-36 shrink-0 text-slate-500">
                      {formatDateTime(file.uploadedAt)}
                    </span>
                    <span className="w-28 shrink-0 text-slate-500">
                      {file.uploadedById}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-400">
          Select an imaging item from the list above to upload an image file.
        </p>
      )}
    </div>
  );
}
