"use client";

import { useSearchParams } from "next/navigation";
import ImageReadingDetail from "@/components/labimaging/imaginginterpretation/ImageReadingDetail";

/**
 * 판독 상세 단독 화면의 진입점.
 * 경로: /labimaging/imaginginterpretation?imageOrderItemId=...
 *
 * ⚠ 워크리스트(ImageWorklist)의 Reading 탭(ImageReadingWorkPanel)을 거치지 않고 바로
 *   들어오는 경로(예: 알림 링크)를 위한 것이다. 라우트 파라미터를 동적 세그먼트
 *   ([imageOrderItemId])가 아니라 쿼리스트링으로 받는 이유는, 이 페이지가 이미 고정 경로
 *   (app/labimaging/imaginginterpretation/page.tsx)였기 때문이다 — 동적 세그먼트로 바꾸면
 *   경로 자체가 바뀌어 버린다.
 *
 * ⚠ imageReadingId 가 아니라 imageOrderItemId 를 받는다. ImageReadingDetail 이 상세 조회에
 *   쓰는 백엔드 API(GET /image-readings/{imageOrderItemId})가 촬영항목ID 기준
 *   findOrCreate 라, 판독 행이 아직 없는 항목도 이 값 하나로 들어올 수 있다.
 *   imageReadingId 는 판독 행이 생긴 뒤에야 존재해 이 경로의 열쇠로 쓸 수 없다.
 */
export default function ImageReadingPage() {
  const searchParams = useSearchParams();
  const imageOrderItemId = searchParams.get("imageOrderItemId");

  if (!imageOrderItemId) {
    return (
      <p className="text-sm text-slate-400">
        No imaging item specified. Open this page with{" "}
        <code className="rounded bg-slate-100 px-1 py-0.5">
          ?imageOrderItemId=&lt;id&gt;
        </code>
        , or use the Reading tab in the imaging worklist instead.
      </p>
    );
  }

  return (
    <ImageReadingDetail key={imageOrderItemId} imageOrderItemId={imageOrderItemId} />
  );
}
