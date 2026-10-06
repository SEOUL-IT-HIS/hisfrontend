import type { NextConfig } from "next";

/**
 * Plan B — Next.js rewrite (path-based proxy)
 * - axios baseURL "" → 브라우저는 /api/... 만 호출
 * - Next 서버가 경로별로 MSA origin 으로 전달
 * - 같은 출처라 CORS / 세션 쿠키 유지
 *
 * 개인 로컬: .env.local 에서 ORIGIN 수정 (.env.local 은 git 제외)
 */
// MSA 를 전부 원격 서버 한 대에서 같이 띄운다. 그래서 기본값이 전부 localhost 다.
// 포트만 서비스마다 다르다. admin 만 9191 이고 나머지는 808x 다.
// 내 PC 에서 다른 사람 백엔드를 부르려면 .env.local 에 그 주소를 적는다. (.env.local 은 git 제외)
const adminApiOrigin =
  process.env.ADMIN_API_ORIGIN ?? "http://localhost:9191";
const patientApiOrigin =
  process.env.PATIENT_API_ORIGIN ?? "http://localhost:8087";
const labImagingApiOrigin =
  process.env.LABIMAGING_API_ORIGIN ?? "http://localhost:8085";
const inpatientApiOrigin =
  process.env.INPATIENT_API_ORIGIN ?? "http://localhost:8086";
const outpatientApiOrigin =
  process.env.OUTPATIENT_API_ORIGIN ?? "http://localhost:8088";
const emergencyApiOrigin =
  process.env.EMERGENCY_API_ORIGIN ?? "http://localhost:8089";
const surgeryApiOrigin =
  process.env.SURGERY_API_ORIGIN ?? "http://localhost:8084";
const receptionApiOrigin =
  process.env.RECEPTION_API_ORIGIN ?? "http://localhost:8083";
const billingApiOrigin =
  process.env.BILLING_API_ORIGIN ?? "http://localhost:8081";
const pharmacyApiOrigin =
  process.env.PHARMACY_API_ORIGIN ?? "http://localhost:8082";

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
  ],
  async rewrites() {
    return [
      // ---------- outpatient-service (구체 경로 먼저) ----------
      {
        source: "/api/outpatient",
        destination: `${outpatientApiOrigin}/api/outpatient`,
      },
      {
        source: "/api/outpatient/:path*",
        destination: `${outpatientApiOrigin}/api/outpatient/:path*`,
      },

      // ---------- emergency-service (구체 경로 먼저) ----------
      {
        source: "/api/emergency",
        destination: `${emergencyApiOrigin}/api/emergency`,
      },
      {
        source: "/api/emergency/:path*",
        destination: `${emergencyApiOrigin}/api/emergency/:path*`,
      },

      // ---------- patient-service (구체 경로 먼저) ----------
      {
        source: "/api/patient",
        destination: `${patientApiOrigin}/api/patient`,
      },
      {
        source: "/api/patient/:path*",
        destination: `${patientApiOrigin}/api/patient/:path*`,
      },

      // ---------- lab-imaging-service (구체 경로 먼저) ----------
      {
        source: "/api/lab-imaging",
        destination: `${labImagingApiOrigin}/api/lab-imaging`,
      },
      {
        source: "/api/lab-imaging/:path*",
        destination: `${labImagingApiOrigin}/api/lab-imaging/:path*`,
      },
      // ---------- surgery-service (구체 경로 먼저) ----------
      {
        source: "/api/surgery",
        destination: `${surgeryApiOrigin}/api/surgery`,
      },
      {
        source: "/api/surgery/:path*",
        destination: `${surgeryApiOrigin}/api/surgery/:path*`,
      },
      // ---------- billing-service (구체 경로 먼저) ----------
      {
        source: "/api/billing",
        destination: `${billingApiOrigin}/api/billing`,
      },
      {
        source: "/api/billing/:path*",
        destination: `${billingApiOrigin}/api/billing/:path*`,
      },
      // ----------- reception-service (구체 경로 먼저) ----------
      {
        source: "/api/reception",
        destination: `${receptionApiOrigin}/api/reception`,
      },
      {
        source: "/api/reception/:path*",
        destination: `${receptionApiOrigin}/api/reception/:path*`,
      },
      // ---------- inpatient-service (구체 경로 먼저) ----------
      {
        source: "/api/inpatient",
        destination: `${inpatientApiOrigin}/api/inpatient`,
      },
      {
        source: "/api/inpatient/:path*",
        destination: `${inpatientApiOrigin}/api/inpatient/:path*`,
      },

      // ---------- pharmacy-service (구체 경로 먼저) ----------
      {
        source: "/api/pharmacy",
        destination: `${pharmacyApiOrigin}/api/pharmacy`,
      },
      {
        source: "/api/pharmacy/:path*",
        destination: `${pharmacyApiOrigin}/api/pharmacy/:path*`,
      },

      // ---------- admin-service (나머지 /api) ----------
      {
        source: "/api/:path*",
        destination: `${adminApiOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
