"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { Alert, FormField, Select } from "@/components/common";
import { resolveSurgeryMessage } from "@/features/surgery/messages";
import {
  fetchSurgeriesRequest,
  selectScheduleError,
  selectScheduleLoading,
  selectSurgeries,
} from "@/features/surgery/schedule/slice";

type Props = {
  /** 화면 아래에 붙일 안내 문구 */
  description?: string;
  /** 수술을 고르면 그 ID 로 패널을 그린다 */
  children: (surgeryId: string) => ReactNode;
};

/**
 * 수술 선택 → 해당 수술의 기록 패널을 여는 공용 껍데기
 *
 * <p>동의서·마취기록·수술기록지는 모두 <b>특정 수술에 종속된 기록</b>이라 surgeryId 가
 * 있어야 조회할 수 있다. 그런데 사이드바 메뉴({@code /surgery/consent} 등)는 수술이
 * 정해지지 않은 상태로 들어온다. 그래서 이 컴포넌트가 먼저 수술을 고르게 하고,
 * 고른 뒤에 패널을 넘겨준다.</p>
 *
 * <p>세 화면이 같은 구조라 껍데기를 하나로 묶었다. 각 페이지는 패널만 넘기면 된다.</p>
 *
 * <p>수술 상세 화면({@code /surgery/schedule/detail/{id}})은 셋을 한 번에 보여준다.
 * 이쪽은 메뉴에서 바로 들어올 때 쓰는 경로이고, 실제 기록 작업은 상세 화면이 더 편하다.</p>
 *
 * <p><b>여기서 수술을 반드시 고르게 하는 것이 중요해졌다</b> — 백엔드가 없는 수술의
 * 하위 목록에 404 를 돌려주도록 바뀌었기 때문이다(SL2-223). 빈 surgeryId 로는
 * 조회 자체를 하지 않으므로 그 404 를 사용자가 볼 일이 없다.</p>
 *
 * <p>라벨·셀렉트·오류문구는 components/common 을 쓴다(§12.1).</p>
 */
export default function SurgeryScopedPanel({ description, children }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const surgeries = useSelector(selectSurgeries);
  const loading = useSelector(selectScheduleLoading);
  const error = useSelector(selectScheduleError);

  const [surgeryId, setSurgeryId] = useState("");

  useEffect(() => {
    dispatch(fetchSurgeriesRequest());
  }, [dispatch]);

  const surgeryOptions = surgeries.map((surgery) => ({
    value: surgery.surgeryId,
    label: `${surgery.surgeryDt} · ${surgery.surgeryName ?? "수술명 미입력"} · 환자 ${
      surgery.patientId
    }${surgery.emergencyYn === "Y" ? " · 응급" : ""}`,
  }));

  return (
    <div className="flex flex-col gap-6">
      {description ? (
        <p className="text-sm text-slate-600">{description}</p>
      ) : null}

      <FormField label="수술 선택" htmlFor="surgeryId">
        <Select
          id="surgeryId"
          placeholder={loading ? "불러오는 중…" : "수술을 선택하세요"}
          options={surgeryOptions}
          value={surgeryId}
          onChange={(e) => setSurgeryId(e.target.value)}
          disabled={loading}
        />
      </FormField>

      {error ? <Alert>{resolveSurgeryMessage(error)}</Alert> : null}

      {/* 수술이 없으면 고를 것도 없으므로 어디서 만드는지 알려준다 */}
      {!loading && surgeries.length === 0 ? (
        <p className="text-sm text-slate-500">
          등록된 수술이 없습니다. 진료·응급실이 수술을 요청하면{" "}
          <Link
            href="/surgery/schedule/requests"
            className="text-sky-600 underline"
          >
            수술 요청 대기
          </Link>{" "}
          에서 배정할 수 있습니다.
        </p>
      ) : null}

      {surgeryId ? (
        <div className="border-t border-slate-200 pt-6">
          {children(surgeryId)}
          <p className="mt-6 text-xs text-slate-500">
            동의서·마취기록·수술기록지를 한 화면에서 보려면{" "}
            <Link
              href={`/surgery/schedule/detail/${surgeryId}`}
              className="text-sky-600 underline"
            >
              수술 상세
            </Link>{" "}
            로 이동하세요.
          </p>
        </div>
      ) : (
        surgeries.length > 0 && (
          <p className="text-sm text-slate-500">
            위에서 수술을 선택하면 기록이 표시됩니다.
          </p>
        )
      )}
    </div>
  );
}
