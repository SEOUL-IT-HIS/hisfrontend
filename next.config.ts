import type { NextConfig } from "next";

/**
 * Plan B — Next.js rewrite (path-based proxy)
 * - axios baseURL "" → 브라우저는 /api/... 만 호출
 * - Next 서버가 경로별로 MSA origin 으로 전달
 * - 같은 출처라 CORS / 세션 쿠키 유지
 *
 * 개인 로컬: .env.local 에서 ORIGIN 수정 (.env.local 은 git 제외)
 */
const adminApiOrigin =
  process.env.ADMIN_API_ORIGIN ?? "http://192.168.1.128:8080";
const patientApiOrigin =
  process.env.PATIENT_API_ORIGIN ?? "http://192.168.1.149:8080";
// lab-imaging 담당자 PC. 2026-08-24 기준 .104 → .132 (DHCP 로 주소가 바뀌었음)
const labImagingApiOrigin =
  process.env.LABIMAGING_API_ORIGIN ?? "http://192.168.1.132:8080";
const inpatientApiOrigin =
  process.env.INPATIENT_API_ORIGIN ?? "http://192.168.1.140:8080";
const outpatientApiOrigin =
  process.env.OUTPATIENT_API_ORIGIN ?? "http://192.168.1.112:8080";
const emergencyApiOrigin =
  process.env.EMERGENCY_API_ORIGIN ?? "http://192.168.1.130:8080";
// surgery-service 만 8080 이 아니라 8383 을 쓴다
const surgeryApiOrigin =
  process.env.SURGERY_API_ORIGIN ?? "http://192.168.1.120:8383";
const receptionApiOrigin =
  process.env.RECEPTION_API_ORIGIN ?? "http://192.168.1.105:8080";
const billingApiOrigin =
  process.env.BILLING_API_ORIGIN ?? "http://192.168.1.143:8989";

const nextConfig: NextConfig = {
  // LAN IP로 접속할 때 /_next 정적 리소스 403 방지
  // (다른 PC에서 http://192.168.1.149:3000 접속 시 필요)
  allowedDevOrigins: [
    "192.168.1.128",
    "192.168.1.149",
    // .104 는 lab-imaging 담당자의 옛 주소. 지금 그 자리를 다른 PC 가 쓰고 있을 수 있어
    // 지우지 않고 .132 를 추가만 한다. (목록에 남아 있어도 해가 없다)
    "192.168.1.104",
    "192.168.1.132",
    "192.168.1.140",
    "192.168.1.112",
    "192.168.1.130",
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

      // ---------- admin-service (나머지 /api) ----------
      {
        source: "/api/:path*",
        destination: `${adminApiOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
