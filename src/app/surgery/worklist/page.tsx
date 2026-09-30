import { Suspense } from "react";
import PageHeader from "@/components/common/PageHeader";
import SurgeryWorklist from "@/components/surgery/worklist/SurgeryWorklist";

/**
 * 수술 업무 화면 (동의서 SL2-42 / 체크리스트 SL2-4 / 마취 SL2-3 / 기록지 SL2-51)
 * 경로: /surgery/worklist
 *
 * <p>왼쪽 수술 목록에서 건을 고르면 오른쪽에서 기록을 이어서 작성하는 마스터-디테일
 * 구조다. 기록 종류마다 화면을 옮겨 다니며 같은 수술을 다시 고르지 않는다.
 * 검사·영상의 워크리스트와 같은 방식이다.</p>
 *
 * <p>페이지는 껍데기만 둔다 — 제목과 컴포넌트 하나. 화면 로직은 전부
 * {@code SurgeryWorklist} 안에 있다(§5.4 app/ 는 얇게).</p>
 *
 * <p>⚠ 사이드바 메뉴(admin MenuEntity.menu_url)에는 아직 이 경로가 없다.
 * 메뉴 등록은 admin 영역이라 별도 요청이 필요하다(§21.4). 반영 전까지는 주소창에
 * 직접 입력해 확인한다.</p>
 */
export default function Page() {
  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-[1800px] flex-col gap-4 p-6">
      <PageHeader
        title="Surgery worklist"
        description="Pick a surgery to handle start / end / cancel, consents, checklist, anesthesia and operative records in one place."
      />
      {/*
        Suspense 로 감싸는 이유 — SurgeryWorklist 가 useSearchParams() 로
        ?surgeryId= 를 읽는다(수술 홈에서 배정을 마치고 넘어오는 경로).
        App Router 는 그 훅을 쓰는 트리를 Suspense 로 감싸지 않으면 프로덕션
        빌드에서 막는다. 개발 서버에서는 경고 없이 넘어가 놓치기 쉽다.
      */}
      <Suspense
        fallback={<p className="text-sm text-slate-500">Loading…</p>}
      >
        <SurgeryWorklist />
      </Suspense>
    </div>
  );
}
