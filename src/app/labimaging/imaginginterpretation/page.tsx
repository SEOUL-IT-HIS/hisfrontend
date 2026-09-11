import { Suspense } from "react";
import PageHeader from "@/components/common/PageHeader";
import ImageReadingPage from "@/components/labimaging/imaginginterpretation/ImageReadingPage";

/**
 * 영상판독 상세 화면 (단독 진입)
 * 경로: /labimaging/imaginginterpretation?imageOrderItemId=...
 *
 * 보통은 /labimaging/imagingorder/worklist 의 Reading 탭에서 촬영항목을 펼쳐 판독한다
 * (ImageWorklist → ImageReadingWorkPanel). 이 페이지는 그 워크리스트를 거치지 않고 특정
 * 촬영항목의 판독으로 바로 들어오는 경로(예: 알림 링크)를 위한 것이다.
 *
 * ⚠ 사이드바 메뉴(admin MenuEntity.menu_url)에는 아직 등록돼 있지 않다.
 *   메뉴 등록은 admin 영역이라 별도 요청이 필요하다. (다른 labimaging 페이지와 동일)
 */
export default function Page() {
  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-5xl flex-col gap-4 p-6">
      <PageHeader
        title="Imaging Reading"
        description="Review the images, record findings, assign a reader, and confirm the reading."
      />
      {/*
        Suspense 로 감싸는 이유 — ImageReadingPage 가 useSearchParams() 로
        ?imageOrderItemId= 를 읽는다. App Router 는 그 훅을 쓰는 트리를 Suspense 로 감싸지
        않으면 프로덕션 빌드에서 막는다. (surgery/worklist, login 페이지와 같은 이유)
      */}
      <Suspense fallback={<p className="text-sm text-slate-500">Loading…</p>}>
        <ImageReadingPage />
      </Suspense>
    </div>
  );
}
