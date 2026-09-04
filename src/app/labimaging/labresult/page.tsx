"use client";

import Link from "next/link";
import PageHeader from "@/components/common/PageHeader";
import { Alert, Panel } from "@/components/common";

/**
 * 일반검사 결과 안내 화면
 * 경로: /labimaging/labresult
 * 대응 유스케이스: UC-RST-01 일반검사결과등록 (Jira ZP2-104 / ZP2-116 화면·라우터 연동)
 *
 * ⚠ 이 라우트는 별도 화면을 만들지 않고 워크리스트 Result 탭으로 안내한다.
 *   (2026-09-02 결정 — 중복 구현 방지)
 *   결과 등록·수정·확정은 이미 검사 업무 화면의 [Result] 탭에서 전부 동작한다.
 *   같은 기능을 두 군데 두면 한쪽만 고쳐지는 순간 두 화면의 동작이 갈린다.
 *
 * ⚠ 사이드바 메뉴(LAB_RESULT "검사결과")는 2026-09-02 에 정리되어 더 이상 이 경로를 가리키지 않는다.
 *   즉 이 화면에 도달하는 경로는 예전 즐겨찾기나 공유된 링크, 주소창 직접 입력뿐이다.
 *   그래서 이 페이지의 독자는 "기능이 없어진 줄 아는 사람"이다.
 *
 * ⚠ redirect() 로 자동 이동시키지 않는다. 두 가지가 걸린다.
 *   1) 워크리스트는 접수를 고르기 전에는 오른쪽이 비어 있고 기본 탭도 Specimen 이다.
 *      그냥 보내면 담당자는 "접수를 고르고 Result 탭을 눌러야 한다"를 스스로 알아내야 한다.
 *   2) 옛 링크로 들어온 사람에게 필요한 건 이동이 아니라 "어디로 옮겨갔는지"를 아는 것이다.
 *      말없이 튕겨 보내면 다음에도 같은 링크를 누른다.
 *   그래서 왜 여기에 화면이 없는지 설명하고, 갈 곳을 링크로 준다.
 *
 * TODO(정리 후보): 옛 링크가 더는 돌지 않는 것이 확인되면 이 라우트를 통째로 지워도 된다.
 *   지금은 남겨 둔다 — 메뉴에서 막 내린 참이라 즐겨찾기가 살아 있을 수 있다.
 */

/** 실제 기능이 있는 화면. 사이드바 메뉴 LAB_WORKLIST("검사 업무")와 같은 경로다. */
const WORKLIST_PATH = "/labimaging/laborder/worklist";

export default function Page() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-6">
      <PageHeader
        title="Lab Results"
        description="Test results are recorded and confirmed inside the Lab Worklist."
      />

      <Alert variant="info">
        This page has no separate form. Open the Lab Worklist, select a reception,
        then use the <span className="font-semibold">Result</span> tab.
      </Alert>

      <Panel className="flex flex-col gap-4 p-5">
        <div className="flex flex-col gap-1 text-sm text-slate-600">
          <p className="font-semibold text-slate-800">How to record a result</p>
          <ol className="ml-4 list-decimal space-y-1 text-slate-500">
            <li>Open the Lab Worklist and select a reception number.</li>
            <li>
              Switch to the <span className="font-semibold">Result</span> tab.
            </li>
            <li>Select a test item, enter the result value and reference range.</li>
            <li>Confirm the result once it has been reviewed.</li>
          </ol>
        </div>

        {/*
          Button 이 아니라 Link 를 쓴다. 공통 Button 은 <button> 이라 새 탭 열기·주소 복사가 안 되고,
          라우팅은 next/link 가 프리페치까지 해준다.
          (WorklistReceptionHeader 의 [Full Detail] 링크와 같은 방식·같은 스타일)
        */}
        <div>
          <Link
            href={WORKLIST_PATH}
            className="inline-flex h-9 items-center justify-center rounded-xl bg-sky-600 px-4 text-sm font-semibold text-white shadow-sm shadow-sky-600/20 transition-colors hover:bg-sky-700"
          >
            Go to Lab Worklist
          </Link>
        </div>
      </Panel>
    </div>
  );
}
