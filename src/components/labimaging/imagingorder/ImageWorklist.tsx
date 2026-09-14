"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { Alert, Button, DataTable, Panel } from "@/components/common";
import type { DataTableColumn } from "@/components/common";
import { usePatientNames } from "@/features/labimaging/common/hooks/usePatientNames";
import { resolveImageOrderMessage } from "@/features/labimaging/imagingorder/messages";
import {
  clearImageWorklistSelection,
  excludeImageReceptionRequest,
  fetchImageWorklistRequest,
  restoreImageReceptionRequest,
  selectImageExclusionError,
  selectImageExclusionSubmitting,
  selectImageWorklist,
  selectImageWorklistError,
  selectImageWorklistLoading,
  selectImageWorklistReception,
  selectSelectedImageWorklistReceptionNo,
} from "@/features/labimaging/imagingorder/slice";
import {
  IMAGE_WORKLIST_FILTER_OPTIONS,
  IMAGE_WORKLIST_STEP_LABELS,
  type ImageWorklistItem,
  type ImageWorklistStatusFilter,
} from "@/features/labimaging/imagingorder/types";
import { selectLastCreatedImageSchedule } from "@/features/labimaging/imagingschedule/slice";
import { selectLastCreatedConsent } from "@/features/labimaging/imagingconsent/slice";
import { selectLastUploadedImageFile } from "@/features/labimaging/imagingacquisition/slice";
import ImageWorklistProgress from "@/components/labimaging/imagingorder/ImageWorklistProgress";
import ImageWorklistReceptionHeader from "@/components/labimaging/imagingorder/ImageWorklistReceptionHeader";
import ReceptionExcludeDialog from "@/components/labimaging/common/ReceptionExcludeDialog";
import ImageScheduleRegisterForm from "@/components/labimaging/imagingschedule/ImageScheduleRegisterForm";
import ConsentWorkPanel from "@/components/labimaging/imagingconsent/ConsentWorkPanel";
import ImageAcquisitionWorkPanel from "@/components/labimaging/imagingacquisition/ImageAcquisitionWorkPanel";
import ImageReadingWorkPanel from "@/components/labimaging/imaginginterpretation/ImageReadingWorkPanel";

/**
 * 영상 워크리스트 — 왼쪽 접수 목록 + 오른쪽 작업 폼 (마스터-디테일).
 * 검사 워크리스트(laborder/LabWorklist)와 같은 구조이고, 단계 구성만 다르다.
 *
 * ── 설계 원칙 (검사와 공유)
 * 1. 목록의 행 단위는 언제나 "접수" 하나다. 하위 작업은 오른쪽에서 한다.
 * 2. 판독이 끝나기 전까지 접수는 목록에 남는다.
 * 3. 목록에서 빼는 건 담당자 판단이다. 기간으로 자동 제외하지 않는다.
 * 4. 정렬은 접수일시 오름차순 — 오래 대기한 건이 위다. (서버가 정렬)
 *
 * ── 검사와 다른 점
 * 1. 적합성 판정 단계가 없다. 그건 검체(SPECIMEN)에 붙는 판정인데 영상에는 검체가 없다.
 *    그 자리에 조영제·침습검사 동의(CONSENT)가 들어간다.
 * 2. 판독과 결과를 나누지 않는다. 영상의 결과가 곧 판독소견이다.
 *    신규 테이블에 IMAGE_READING 은 있고 IMAGE_RESULT 는 없다.
 * 3. 촬영(영상파일 등록)이 판독 앞에 있다. 판독할 대상이 있어야 판독 화면이 성립한다.
 *
 * ── 판독(Reading) 탭
 * ⚠ ZP2-23 으로 활성화됐다. IMAGE_READING 은 촬영 시점이 아니라 이 탭을 처음 열 때(또는
 *   워크리스트 조회 시점)에 findOrCreate 로 그 자리에서 만들어진다 — ImageReadingService 참고.
 *   촬영(Acquisition) 탭은 ZP2-21 로 먼저 활성화됐다 — IMAGE_FILE 등록/조회가 붙었다.
 */

type WorkTab = "schedule" | "consent" | "acquisition" | "reading";

const WORK_TABS: ReadonlyArray<{ value: WorkTab; label: string; enabled: boolean }> = [
  { value: "schedule", label: "Schedule", enabled: true },
  { value: "consent", label: "Consent", enabled: true },
  { value: "acquisition", label: "Acquisition", enabled: true },
  { value: "reading", label: "Reading", enabled: true },
];

/** 백엔드가 ISO 문자열로 준다. 초 단위는 화면에서 의미가 없어 분까지만 보여준다. */
function formatDateTime(value?: string) {
  if (!value) return "-";
  return value.replace("T", " ").slice(0, 16);
}

export default function ImageWorklist() {
  const dispatch = useDispatch<AppDispatch>();

  const worklist = useSelector(selectImageWorklist);
  const loading = useSelector(selectImageWorklistLoading);
  const error = useSelector(selectImageWorklistError);
  const exclusionSubmitting = useSelector(selectImageExclusionSubmitting);
  const exclusionError = useSelector(selectImageExclusionError);
  const selectedReceptionNo = useSelector(selectSelectedImageWorklistReceptionNo);

  const [filter, setFilter] = useState<ImageWorklistStatusFilter>("ACCEPTED");
  const [tab, setTab] = useState<WorkTab>("schedule");
  const [excludeTarget, setExcludeTarget] = useState<string | null>(null);

  /*
   * 목록을 다시 부르는 지점은 이 효과 하나로 모은다.
   *   - 필터를 바꿨을 때
   *   - 일정·동의가 저장돼 진행 상태가 달라졌을 때
   * 효과를 나눠 두면 필터를 바꿀 때 양쪽이 같이 돌아 같은 요청이 두 번 나간다.
   * (제외·복구 뒤 갱신은 saga 가 직접 하므로 여기 넣지 않는다 — 넣으면 두 번 나간다)
   */
  const lastScheduleId =
    useSelector(selectLastCreatedImageSchedule)?.imageScheduleId ?? null;
  const lastConsentId = useSelector(selectLastCreatedConsent)?.consentId ?? null;
  const lastImageFileId = useSelector(selectLastUploadedImageFile)?.imageFileId ?? null;

  useEffect(() => {
    dispatch(fetchImageWorklistRequest(filter));
  }, [dispatch, filter, lastScheduleId, lastConsentId, lastImageFileId]);

  /*
   * 목록에 보이는 환자들의 이름을 한 번에 불러온다. (POST /api/patient/batch)
   * 행마다 부르면 목록 크기만큼 요청이 나가므로, 목록이 바뀔 때 한 번만 부른다.
   */
  const { names: patientNames } = usePatientNames(worklist.map((r) => r.patientId));

  const selected =
    worklist.find((item) => item.receptionNo === selectedReceptionNo) ?? null;

  function handleExclude(exclusionReason: string) {
    if (!excludeTarget) return;
    dispatch(excludeImageReceptionRequest(excludeTarget, exclusionReason, filter));
    setExcludeTarget(null);
  }

  const columns: DataTableColumn<ImageWorklistItem>[] = [
    {
      key: "receivedAt",
      header: "Received",
      render: (r) => (
        <span className="text-slate-500">{formatDateTime(r.receivedAt)}</span>
      ),
    },
    {
      key: "receptionNo",
      header: "Reception / Patient",
      render: (r) => (
        // 행 선택은 접수번호 클릭으로 한다. (공통 DataTable 은 행 클릭을 지원하지 않는다)
        <button
          type="button"
          onClick={() => dispatch(selectImageWorklistReception(r.receptionNo))}
          className={
            r.receptionNo === selectedReceptionNo
              ? "text-left font-semibold text-sky-600 underline underline-offset-2"
              : "text-left font-semibold text-slate-700 hover:text-sky-600"
          }
        >
          {r.receptionNo}
          {/* 환자 식별은 이름으로 한다. 환자번호는 화면에서 쓰지 않기로 했다. (2026-08-25) */}
          <span className="ml-2 font-normal text-slate-500">
            {patientNames[r.patientId] ?? "Unknown patient"}
          </span>
          {r.urgencyYn === "Y" ? (
            <span className="ml-2 rounded bg-rose-50 px-1.5 py-0.5 text-xs font-medium text-rose-600">
              Urgent
            </span>
          ) : null}
        </button>
      ),
    },
    {
      key: "progress",
      header: "Progress",
      render: (r) => <ImageWorklistProgress item={r} />,
    },
    {
      key: "nextStep",
      header: "Next Step",
      render: (r) =>
        r.receptionStatusCode === "EXCLUDED" ? (
          <span className="text-slate-400" title={r.exclusionReason}>
            Excluded
          </span>
        ) : (
          <span className="font-medium text-slate-700">
            {IMAGE_WORKLIST_STEP_LABELS[r.nextStep]}
          </span>
        ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (r) =>
        r.receptionStatusCode === "EXCLUDED" ? (
          <Button
            variant="secondary"
            onClick={() =>
              dispatch(restoreImageReceptionRequest(r.receptionNo, filter))
            }
            disabled={exclusionSubmitting}
          >
            Restore
          </Button>
        ) : (
          <Button
            variant="secondary"
            onClick={() => setExcludeTarget(r.receptionNo)}
            disabled={exclusionSubmitting}
          >
            Exclude
          </Button>
        ),
    },
  ];

  return (
    <div className="flex min-h-0 flex-1 gap-4">
      {/* ================= 왼쪽: 접수 워크리스트 ================= */}
      <div className="flex min-h-0 w-[54%] min-w-[520px] flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-2">
            {IMAGE_WORKLIST_FILTER_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                variant={filter === opt.value ? "primary" : "secondary"}
                onClick={() => setFilter(opt.value)}
                disabled={loading}
              >
                {opt.label}
              </Button>
            ))}
          </div>
          <Button
            variant="secondary"
            onClick={() => dispatch(fetchImageWorklistRequest(filter))}
            disabled={loading}
          >
            Refresh
          </Button>
        </div>

        {error ? <Alert>{resolveImageOrderMessage(error)}</Alert> : null}
        {exclusionError ? (
          <Alert>{resolveImageOrderMessage(exclusionError)}</Alert>
        ) : null}

        <DataTable
          columns={columns}
          rows={worklist}
          rowKey={(r) => r.imageReceptionId}
          loading={loading}
          loadingMessage="Loading..."
          minWidthClassName="min-w-[680px]"
          emptyMessage={
            filter === "EXCLUDED"
              ? "No excluded receptions."
              : "No receptions to process."
          }
        />
      </div>

      {/* ================= 오른쪽: 작업 영역 ================= */}
      <Panel className="min-h-0 flex-1 p-5">
        {selected === null ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            Select a reception number from the list on the left.
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-4">
            <ImageWorklistReceptionHeader reception={selected} />

            {/* 작업 탭 — 담당자가 직접 고른다.
                진행 상태만 보고 자동으로 정하면 일정 재조정처럼 되돌아가는 작업을 할 수 없다. */}
            <div className="flex gap-2">
              {WORK_TABS.map((t) => (
                <Button
                  key={t.value}
                  variant={tab === t.value ? "primary" : "secondary"}
                  onClick={() => setTab(t.value)}
                  disabled={!t.enabled}
                  title={t.enabled ? undefined : "This step is not implemented yet."}
                >
                  {t.label}
                </Button>
              ))}
            </div>

            {/*
              ⚠ 작업 영역에만 스크롤을 준다.
                오른쪽 Panel 은 고정 높이(min-h-0 flex-1)라, 내용이 넘치면 스크롤바도 없이 잘린다.
                실제로 첫 판정 뒤 성공 Alert 가 한 줄 늘어나는 것만으로 아래쪽 입력 폼이
                화면 밖으로 밀려 안 보였다. (2026-09-02)
                머리말·탭은 고정해야 하므로 패널 각각이 아니라 탭 내용만 감싼다.
            */}
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
              {tab === "schedule" ? (
              /*
               * key 로 접수마다 새로 마운트시킨다.
               * defaultMode 는 useState 초기값이라 첫 렌더에만 반영되는데,
               * 같은 탭에 머문 채 다른 접수를 고르면 이전 접수의 모드·입력값이 그대로 남는다.
               * 일정이 있는 접수에 "신규 등록"이 걸린 채로 저장하면 DB 제약(latest_yn UNIQUE)에 걸린다.
               */
              /*
               * ⚠ defaultMode 를 넘기지 않는다. 일정이 항목 단위가 되면서
               *   신규/재등록은 접수가 아니라 "고른 항목에 일정이 있는가"로 정해진다. (2026-09-03)
               *   접수 기준으로 모드를 미리 정하면, 3건 중 1건만 잡힌 접수에서 나머지 2건이
               *   재등록 모드로 열려 LAB016(재등록할 일정 없음)이 난다.
               */
              <ImageScheduleRegisterForm
                key={selected.imageReceptionId}
                imageReceptionId={selected.imageReceptionId}
                receptionNo={selected.receptionNo}
                showReceptionSummary={false}
                onCancel={() => dispatch(clearImageWorklistSelection())}
              />
            ) : tab === "consent" ? (
              // key 로 접수마다 새로 마운트해 이전 오더의 입력값·검증오류가 남지 않게 한다.
              <ConsentWorkPanel key={selected.imageReceptionId} reception={selected} />
            ) : tab === "acquisition" ? (
              // key 로 접수마다 새로 마운트해 이전 접수의 선택 항목·업로드 상태가 남지 않게 한다.
              <ImageAcquisitionWorkPanel key={selected.imageReceptionId} reception={selected} />
            ) : (
              // key 로 접수마다 새로 마운트해 이전 접수의 선택 항목·펼친 상세가 남지 않게 한다.
              <ImageReadingWorkPanel key={selected.imageReceptionId} reception={selected} />
            )}
            </div>
          </div>
        )}
      </Panel>

      {/* 검사 워크리스트와 같은 다이얼로그다. 제외 규칙이 동일해 공용 컴포넌트를 쓴다. */}
      <ReceptionExcludeDialog
        open={excludeTarget !== null}
        receptionNo={excludeTarget ?? ""}
        submitting={exclusionSubmitting}
        onConfirm={handleExclude}
        onCancel={() => setExcludeTarget(null)}
      />
    </div>
  );
}
