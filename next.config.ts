import type { NextConfig } from "next";

/**
 * API 전달(/api/**, /files/**)은 Nginx 가 한다. 이 Next 서버는 화면만 담당한다.
 * - axios baseURL "" → 브라우저는 같은 주소(/api/...)로만 호출 → Nginx 가 각 서비스로 전달
 * - rewrites 가 없으므로 npm run dev 로 띄운 로컬에서는 /api 가 동작하지 않는다 (로컬 개발은 develop 브랜치)
 */

const nextConfig: NextConfig = {
  /*
   * Docker 이미지용 빌드 결과물.
   *
   * "standalone" 을 켜면 next build 가 .next/standalone 에 "실행에 필요한 것만" 모아준다.
   * 서버 파일 + 실제로 쓰이는 node_modules 만 담기기 때문에, 이미지에 node_modules 를
   * 통째로 넣는 것보다 훨씬 작아진다.
   *
   * npm run dev 에는 영향이 없다. next build 의 출력 형태만 달라진다.
   */
  output: "standalone",

  // LAN IP로 접속할 때 /_next 정적 리소스 403 방지
  // (다른 PC에서 http://192.168.1.149:3000 접속 시 필요)
  allowedDevOrigins: [
    "192.168.1.128",
    "192.168.1.126",
    "192.168.1.149",
    // .104 는 lab-imaging 담당자의 옛 주소. 지금 그 자리를 다른 PC 가 쓰고 있을 수 있어
    // 지우지 않고 .132 를 추가만 한다. (목록에 남아 있어도 해가 없다)
    "192.168.1.104",
    "192.168.1.132",
    "192.168.1.140",
    "192.168.1.112",
    // .130 은 emergency 담당자의 옛 주소. 지금 그 자리를 다른 PC 가 쓰고 있을 수 있어
    // 지우지 않고 .152 를 추가만 한다.
    "192.168.1.130",
    "192.168.1.152",
    "192.168.1.120",
    "192.168.1.105",
    "192.168.1.143",
    "192.168.1.125",
    // 원격 서버를 공인 주소/도메인으로 접속할 때 (http://seoulit.pe.kr:18080)
    "seoulit.pe.kr",
    "117.16.154.233",
  ],
};

export default nextConfig;
