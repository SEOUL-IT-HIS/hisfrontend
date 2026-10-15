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
# 기본값은 쿠버네티스 안에서의 Service 주소다 (http://서비스이름:포트).
# 프론트 Pod 가 같은 클러스터 안의 서비스들을 부르기 때문에, 바깥 포트가 아니라 이 주소를 쓴다.
# 그래서 각 백엔드의 Service 이름과 port 를 아래 값과 똑같이 만들어야 한다.
#   admin 9191 · billing 8081 · pharmacy 8082 · reception 8083 · surgery 8084
#   labimaging 8085 · inpatient 8086 · patient 8087 · outpatient 8088 · emergency 8089
# 기본값을 넣어두는 이유: 값이 비면 next.config.ts 가 빈 주소로 rewrite 를 만들어 전부 깨진다.
#
# 다른 주소로 만들고 싶으면 빌드할 때 덮어쓴다.
#   docker build --build-arg PATIENT_API_ORIGIN=http://192.168.1.149:8087 -t kwonsugeun/hisfrontend:v2.3 .
ARG ADMIN_API_ORIGIN=http://admin:9191
ARG BILLING_API_ORIGIN=http://billing:8081
ARG PHARMACY_API_ORIGIN=http://pharmacy:8082
ARG RECEPTION_API_ORIGIN=http://reception:8083
ARG SURGERY_API_ORIGIN=http://surgery:8084
ARG LABIMAGING_API_ORIGIN=http://labimaging:8085
ARG INPATIENT_API_ORIGIN=http://inpatient:8086
ARG PATIENT_API_ORIGIN=http://patient:8087
ARG OUTPATIENT_API_ORIGIN=http://outpatient:8088
ARG EMERGENCY_API_ORIGIN=http://emergency:8089

# 직원 프로필 사진 저장소(SeaweedFS S3) 주소.
# 이 ARG 가 없으면 next.config.ts 의 기본값 http://localhost:8333 이 굳는다.
# 컨테이너 안의 localhost 는 SeaweedFS 가 아니라서 사진이 안 나온다.
# 그래서 터미널 SeaweedFS 로 연결되는 주소(192.168.49.1:18891)로 박는다. (브라우저의 /files/** 요청을 Next 서버가 여기로 넘긴다)
# 터미널 화면과 같은 저장소를 보게 하려고 쿠버네티스 안의 seaweedfs 대신 이 주소를 쓴다.
ARG SEAWEED_ORIGIN=http://192.168.49.1:18891

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
# 이미지 만들기 (이 파일이 있는 폴더에서)
#   docker build -t kwonsugeun/hisfrontend:v2.3 .
#   서비스 주소는 2단계의 ARG 기본값(쿠버네티스 Service 주소)으로 들어간다.
#   태그는 배포 버전 하나만 붙인다 (v2.0, v2.1, v2.2, v2.3 …). latest 는 쓰지 않는다.
#   같은 태그를 덮어쓰지 말고 새 태그로 올린다. 쿠버네티스는 같은 태그면 바뀐 줄 모른다.
#
# 서버로 옮기기 (Docker Hub)
#   docker login -u kwonsugeun        (Password 칸에는 Read & Write 액세스 토큰)
#   docker push kwonsugeun/hisfrontend:v2.3
#   서버의 쿠버네티스가 YAML 의 image 이름으로 Docker Hub 에서 직접 받아간다. 서버에서 따로 pull 하지 않는다.
#
# 실행하기 (서버의 쿠버네티스)
#   kubectl apply -f 30-hisfrontend.yaml
#   브라우저: http://seoulit.pe.kr:18090   (실제 서버는 192.168.1.126)
#
#   ※ 실행할 때 환경변수로 서비스 주소를 넣어도 반영되지 않는다. rewrite 주소는 빌드할 때 굳는다.
#     주소를 바꾸려면 --build-arg 로 다시 빌드해야 한다.
#   ※ 접속 주소(seoulit.pe.kr:18090)를 바꾸면 admin-service 의 CORS 허용 목록(AppConfig)도 같이 바꿔야 한다.
#     브라우저가 보내는 Origin 이 이 주소라서, 목록에 없으면 로그인부터 403 이 난다.
#
# 로그 보기 (서버)
#   kubectl -n his logs deploy/hisfrontend -f
#
#   ※ 공용 서버에서는 kubectl 명령에 항상 -n his 를 붙인다. 다른 팀 자원을 건드리지 않기 위해서다.
