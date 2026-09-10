# hisfrontend 컨테이너 이미지
#
# 왜 필요한가:
#   지금은 각자 자기 PC 에서 npm run dev 로 띄운다. 원격 서버에 올리려면
#   서버가 실행할 수 있는 "완성품"이 있어야 하고, 그게 이 이미지다.
#
# 만드는 법 / 실행하는 법은 맨 아래 주석 참고.


# ══════════════ 1단계: 의존성 설치 ══════════════
FROM node:22-alpine AS deps
WORKDIR /app

# package.json 과 lockfile 만 먼저 복사한다.
# 소스만 고쳤을 때 npm ci 를 다시 돌리지 않기 위해서다(레이어 캐시).
#
# 이 레포에는 package-lock.json 과 yarn.lock 이 둘 다 커밋돼 있다.
# 도구를 섞으면 서로 다른 버전이 설치될 수 있으므로 여기서는 npm 하나만 쓴다.
COPY package.json package-lock.json ./

# npm install 이 아니라 npm ci 를 쓴다.
# ci 는 lockfile 에 적힌 버전 그대로만 설치한다. install 은 상황에 따라 버전을
# 올려버릴 수 있어서, 어제 되던 빌드가 오늘 깨지는 일이 생긴다.
RUN npm ci


# ══════════════ 2단계: 빌드 ══════════════
FROM node:22-alpine AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 텔레메트리(사용 통계 전송) 끄기. 사내망이라 어차피 못 나가고 빌드만 느려진다.
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build


# ══════════════ 3단계: 실행 ══════════════
FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# root 로 돌리지 않는다. 컨테이너가 뚫렸을 때 할 수 있는 일을 줄인다.
RUN addgroup -g 1001 nodejs && adduser -u 1001 -G nodejs -S nextjs

# next.config.ts 의 output: "standalone" 이 만들어준 것만 가져온다.
# node_modules 를 통째로 넣지 않아 이미지가 훨씬 작아진다.
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static

# public/ 은 이 레포에 없어서 복사하지 않는다.
# 나중에 이미지·폰트 같은 정적 파일을 public/ 에 두게 되면 아래 줄을 살려야 한다.
# COPY --from=build --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# standalone 빌드는 server.js 를 만들어준다. next start 가 아니라 이걸 직접 실행한다.
CMD ["node", "server.js"]


# ══════════════ 사용법 ══════════════
#
# 이미지 만들기 (이 파일이 있는 폴더에서)
#   docker build -t hisfrontend:0.1.0 .
#
# 실행하기
#   MSA 주소는 이미지에 굽지 않고 실행할 때 넣는다. 주소가 바뀌어도 코드를 고치고
#   다시 빌드할 필요가 없다. next.config.ts 의 rewrite 가 서버 기동 시점에
#   이 환경변수들을 읽는다.
#
#   docker run -d --name hisfrontend --restart unless-stopped -p 3000:3000 \
#     -e ADMIN_API_ORIGIN=http://192.168.1.126:8080 \
#     -e PATIENT_API_ORIGIN=http://patient-service:8080 \
#     -e LABIMAGING_API_ORIGIN=http://lab-imaging-service:8080 \
#     -e SURGERY_API_ORIGIN=http://surgery-service:8383 \
#     -e BILLING_API_ORIGIN=http://billing-service:8989 \
#     -e EMERGENCY_API_ORIGIN=http://emergency-service:8085 \
#     -e PHARMACY_API_ORIGIN=http://pharmacy-service:8088 \
#     -e INPATIENT_API_ORIGIN=http://inpatient-service:8080 \
#     -e OUTPATIENT_API_ORIGIN=http://outpatient-service:8080 \
#     -e RECEPTION_API_ORIGIN=http://reception-service:8080 \
#     hisfrontend:0.1.0
#
#   ※ 서비스들이 아직 각자 PC 에서 돌고 있다면 컨테이너명 대신 그 PC 의 IP 를 적는다.
#     (예: -e PATIENT_API_ORIGIN=http://192.168.1.149:8080)
#     전부 컨테이너로 옮긴 뒤에는 위처럼 컨테이너명으로 부를 수 있다.
#
# 로그 보기
#   docker logs -f hisfrontend
#
# 재배포 (코드 고친 뒤)
#   docker build -t hisfrontend:0.1.0 .
#   docker rm -f hisfrontend
#   docker run ... (위와 동일)
#
#   ※ 공용 서버에서 docker-compose down 처럼 전체를 내리는 명령을 쓰지 말 것.
#     다른 팀 서비스까지 같이 멈춘다. 항상 서비스 이름을 지정한다.
