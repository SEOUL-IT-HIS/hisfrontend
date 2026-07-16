import type { NextConfig } from "next";

/**
 * BE 주소 (Next.js 서버가 rewrite 할 때 사용, 브라우저에 노출되지 않음)
 * - 기본: 팀 MSA PC
 * - 로컬 BE: ADMIN_API_ORIGIN=http://localhost:8080
 */
const adminApiOrigin =
  process.env.ADMIN_API_ORIGIN ?? "http://192.168.1.128:8080";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
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
