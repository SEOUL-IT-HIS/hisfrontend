import Link from "next/link";
import { Alert, PageHeader, Panel } from "@/components/common";

type Props = {
  /** 이 화면이 다루려는 업무 */
  title: string;
  /** 관련 Jira 키 */
  jira: string;
  /** 백엔드가 이미 제공하는 API 경로 */
  apis: string[];
  /** 아직 만들지 못한 이유 */
  reason: string;
};

/**
 * 아직 화면이 없는 메뉴용 안내
 *
 * <p>사이드바 메뉴는 admin-service 가 관리한다(§21.4). 메뉴가 먼저 등록되고 화면이
 * 나중에 만들어지는 구간이 생기는데, 그때 404 가 뜨면 "고장난 것"으로 보인다.
 * 무엇이 남았는지 알려주는 편이 낫다.</p>
 *
 * <p>백엔드 API 경로를 적어두는 이유 — 화면이 없을 뿐 서버는 이미 동작하므로,
 * Swagger 나 curl 로 먼저 확인할 수 있다는 걸 알리기 위해서다.</p>
 *
 * <p>헤더·안내문·카드는 components/common 을 쓴다(§12.1). 안내 상자가 amber 에서
 * Alert 의 info(하늘색)로 바뀐다 — Alert 에 amber 변형이 없고, 색을 추가하려면
 * 공통 컴포넌트를 고쳐야 하는데 그건 리더 승인 사항이다(§5.5).</p>
 */
export default function NotReadyNotice({ title, jira, apis, reason }: Props) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
      <PageHeader title={title} description={jira} />

      <Alert variant="info">
        <span className="font-medium">화면 준비 중입니다</span> — {reason}
      </Alert>

      <Panel className="p-4">
        <h2 className="mb-2 text-sm font-medium text-slate-700">
          백엔드는 이미 동작합니다
        </h2>
        <p className="mb-3 text-xs text-slate-500">
          아래 API 는 구현돼 있어 Swagger 에서 바로 호출해볼 수 있습니다.
        </p>
        <ul className="flex flex-col gap-1">
          {apis.map((api) => (
            <li
              key={api}
              className="rounded-md bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700"
            >
              {api}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-slate-500">
          <a
            href="http://localhost:8383/swagger-ui/index.html"
            target="_blank"
            rel="noreferrer"
            className="text-sky-600 underline"
          >
            Swagger UI 열기
          </a>{" "}
          (백엔드 실행 중일 때)
        </p>
      </Panel>

      <p className="text-xs text-slate-500">
        <Link href="/surgery" className="text-sky-600 underline">
          수술관리 홈
        </Link>
      </p>
    </div>
  );
}
