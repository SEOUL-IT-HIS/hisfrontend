# hisfrontend 컨테이너 이미지
#
# 왜 필요한가:
#   지금은 각자 자기 PC 에서 npm run dev 로 띄운다. 원격 서버에 올리려면
#   서버가 실행할 수 있는 "완성품"이 있어야 하고, 그게 이 이미지다.
#
# 만드는 법 / 실행하는 법은 맨 아래 주석 참고.


# ══════════════ 1단계: 의존성 설치 ══════════════
FROM node:24-alpine AS deps
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
FROM node:24-alpine AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 텔레메트리(사용 통계 전송) 끄기. 사내망이라 어차피 못 나가고 빌드만 느려진다.
ENV NEXT_TELEMETRY_DISABLED=1

# 프론트가 API 를 넘겨줄 서비스 주소들.
#
# next.config.ts 의 rewrite 는 "npm run build 할 때" 이 값들을 읽어서 결과물(.next)에 박아 넣는다.
# 그래서 실행할 때(docker run -e ...) 넣으면 이미 굳은 뒤라 아무 효과가 없다. 여기 빌드 단계에서 넣는다.
#
# ARG 로 적은 값은 바로 아래 RUN npm run build 안에서 환경변수로 보인다.
# 기본값은 원격 서버(192.168.1.126) 도커에 떠 있는 각 서비스의 바깥 포트다.
# 기본값을 넣어두는 이유: 값이 비면 next.config.ts 가 빈 주소로 rewrite 를 만들어 전부 깨진다.
#
# 다른 주소로 만들고 싶으면 빌드할 때 덮어쓴다.
#   docker build --build-arg PATIENT_API_ORIGIN=http://192.168.1.149:8080 -t kwonsugeun/hisfrontend:latest .
ARG ADMIN_API_ORIGIN=http://192.168.1.126:18080
ARG BILLING_API_ORIGIN=http://192.168.1.126:18081
ARG PHARMACY_API_ORIGIN=http://192.168.1.126:18082
ARG RECEPTION_API_ORIGIN=http://192.168.1.126:18083
ARG SURGERY_API_ORIGIN=http://192.168.1.126:18084
ARG LABIMAGING_API_ORIGIN=http://192.168.1.126:18085
ARG INPATIENT_API_ORIGIN=http://192.168.1.126:18087
ARG PATIENT_API_ORIGIN=http://192.168.1.126:18088
ARG OUTPATIENT_API_ORIGIN=http://192.168.1.126:18089
ARG EMERGENCY_API_ORIGIN=http://192.168.1.126:18090

RUN npm run build


# ══════════════ 3단계: 실행 ══════════════
FROM node:24-alpine AS runtime
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
# 이미지 만들기 (내 PC, 이 파일이 있는 폴더에서)
#   docker build -t kwonsugeun/hisfrontend:latest .
#   서비스 주소는 2단계의 ARG 기본값(원격 서버 포트)으로 들어간다.
#
# 올리기 (내 PC, Docker Hub. 처음 한 번 docker login 필요)
#   docker push kwonsugeun/hisfrontend:latest
#
# 실행하기 (원격 서버)
#   docker pull kwonsugeun/hisfrontend:latest
#   docker run -d --name hisfrontend --restart unless-stopped -p 28080:3000 kwonsugeun/hisfrontend:latest
#   브라우저: http://192.168.1.126:28080
#
#   ※ 실행할 때 -e 로 서비스 주소를 넣어도 반영되지 않는다. rewrite 주소는 빌드할 때 굳는다.
#     주소를 바꾸려면 --build-arg 로 다시 빌드해야 한다.
#   ※ 바깥 포트 28080 을 바꾸면 admin-service 의 CORS 허용 목록(AppConfig)도 같이 바꿔야 한다.
#     브라우저가 보내는 Origin 이 이 주소라서, 목록에 없으면 로그인부터 403 이 난다.
#
# 로그 보기 (원격 서버)
#   docker logs -f hisfrontend
#
# 재배포 (코드 고친 뒤)
#   내 PC  : docker build -t kwonsugeun/hisfrontend:latest .
#            docker push kwonsugeun/hisfrontend:latest
#   서버   : docker pull kwonsugeun/hisfrontend:latest
#            docker rm -f hisfrontend
#            docker run ... (위와 동일)
#
#   ※ 공용 서버에서 docker-compose down 처럼 전체를 내리는 명령을 쓰지 말 것.
#     다른 팀 서비스까지 같이 멈춘다. 항상 서비스 이름을 지정한다.
