"use client";

import { useState, type ChangeEvent } from "react";
import { Button, FormField, Input } from "@/components/common";
import KtasPanel from "@/components/emergency/ktas/KtasPanel";

/**
 * KtasPanel 미리보기 하네스 (UC-TRI-02/03 / Jira UD2-9, UD2-43)
 *
 * 접수/환자 선택 화면이 아직 없어 접수 건 컨텍스트를 실제로 넘겨받을 수 없다.
 * 그 전까지 개발/QA 가 receptionNo 를 직접 입력해 패널 동작을 확인할 수 있도록 제공한다.
 */
export default function KtasPanelPreview() {
  const [receptionNo, setReceptionNo] = useState("");
  const [queried, setQueried] = useState("");

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    setReceptionNo(e.target.value);
  }

  return (
    <div className="space-y-4">
      <FormField label="접수번호" hint="분류 화면 연동 전 미리보기용 입력입니다.">
        <div className="flex gap-2">
          <Input
            value={receptionNo}
            onChange={handleChange}
            maxLength={20}
            placeholder="예: ER-20260716-001"
            className="max-w-xs"
          />
          <Button
            type="button"
            onClick={() => setQueried(receptionNo.trim())}
            disabled={!receptionNo.trim()}
          >
            조회
          </Button>
        </div>
      </FormField>

      {queried ? <KtasPanel receptionNo={queried} /> : null}
    </div>
  );
}
