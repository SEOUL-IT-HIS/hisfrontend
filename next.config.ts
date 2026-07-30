import type { NextConfig } from "next";

/**
 * BE 주소 (Next.js 서버가 rewrite 할 때 사용, 브라우저에 노출되지 않음)
 * - 기본(팀 공용): 192.168.1.128
 * - 개인 로컬: .env.local 에 ADMIN_API_ORIGIN=http://localhost:8080
 *   (.env.local 은 git 제외 → 남들은 IP 기본값, 나만 localhost 가능)
 */
const adminApiOrigin =
  process.env.ADMIN_API_ORIGIN ?? "http://192.168.1.128:8080";

/**
 * patient-service 주소 (admin-service 와 다른 프로세스)
 * - 기본: 로컬에서 직접 실행한 patient-service
 * - .env.local 에 PATIENT_API_ORIGIN 으로 변경 가능
 */
const patientApiOrigin =
  process.env.PATIENT_API_ORIGIN ?? "http://localhost:8080";

const nextConfig: NextConfig = {
  // LAN IP(예: 192.168.1.128)로 접속할 때 /_next 정적 리소스 403 방지
  allowedDevOrigins: ["192.168.1.128"],
  async rewrites() {
    return [
      // 환자 API 는 patient-service 로 전달한다.
      // rewrites 는 위에서부터 매칭되므로 /api/:path* 보다 먼저 둔다.
      {
        source: "/api/patient",
        destination: `${patientApiOrigin}/api/patient`,
      },
      {
        source: "/api/patient/:path*",
        destination: `${patientApiOrigin}/api/patient/:path*`,
      },
      {
        // 브라우저 → http://localhost:3000/api/...
        // Next가 → BE http://...:8080/api/... 로 전달
        // 같은 출처라서 HttpSession 쿠키(JSESSIONID)가 정상 동작함
        source: "/api/:path*",
        destination: `${adminApiOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
