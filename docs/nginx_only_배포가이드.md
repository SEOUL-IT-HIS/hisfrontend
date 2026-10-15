# 18090을 "Nginx 전용"으로 올리기 가이드 (rewrites 없는 새 이미지 + CORS 없이 동작 확인)

- 작성일: 2026-10-15 (개정: 새 이미지 빌드 절차 구체화, CORS 없이 동작 확인 장 추가)
- 대상 브랜치: `nginx` (`origin/develop` 기준, 커밋 `c0a3d00`에서 시작)
- 방식: **"rewrites만 없는 Next"** — Next 서버는 화면만 담당하고, `/api`·`/files`는 Nginx가 처리합니다. (Next 서버 자체를 없애는 정적 export 방식은 하지 않습니다. 이 프로젝트에는 `/inpatient/.../[admissionId]` 같은 **실행 중에 값이 정해지는 동적 경로**가 많아 사전 생성이 안 되기 때문입니다.)
- 목표 상태:

```
브라우저 → :18090 → [minikube NodePort 30080] → Nginx ─┬─ /api/**   → 각 백엔드 (admin, inpatient …)   ← Origin 헤더 제거
                                                      ├─ /files/** → SeaweedFS
                                                      └─ 그 외(화면) → 새 프론트 이미지(rewrites 없음)
```

- 표시: **[확인 필요]** = 제가 서버에서 직접 확인하지 못한 값. **[시험 안 됨]** = 이 문서의 명령·설정은 아직 실제 클러스터에서 돌려 보지 않았습니다.
- 먼저 읽기: 18090은 지금 팀원이 쓰는 주소입니다. 아래 "작업 방식"을 지켜 주세요.

---

## 0. 먼저 알아둘 것

### 0-1. "내렸다 올린다"가 아니라 "옆에서 완성해 놓고 자리를 바꾼다"

| | 18090을 먼저 내리면 | 이 문서의 방식 |
|---|---|---|
| 팀원 화면 | 내려가 있는 동안 전부 안 열림 | 몇 초만 끊김 |
| 새 프론트에 문제가 있으면 | 복구가 오래 걸림 | **번호만 되돌려 즉시 복구** |
| 기존 프론트 | 지움 | **지우지 않고** 남겨 둠 |

18090은 minikube 컨테이너에 `30080/tcp -> 18090`으로 고정된 **방식 B**입니다. 이 연결은 건드리지 않고, 30080을 쓰는 **서비스만** 바꿉니다.

### 0-2. 포트별 역할

| 포트 | 지금 | 작업 후 |
|---|---|---|
| 18090 | 기존 프론트(Next가 `/api` 전달) | **Nginx + 새 프론트** |
| 18091 | Nginx 연습용(포트포워드) | 검증용으로 쓰다가 **내림** (10장) |

### 0-3. 이 작업이 바꾸는 것 / 안 바꾸는 것

| 대상 | 바뀌는가 |
|---|---|
| 프론트 소스 (`nginx` 브랜치만) | **바뀜**: `next.config.ts`의 `rewrites()`, `Dockerfile`의 서비스 주소 `ARG` 제거 |
| 프론트 이미지 | **새 태그로 새로 만듦** (기존 태그는 그대로) |
| Nginx 설정 | **바뀜**: 화면 요청 대상을 새 프론트로, `Origin` 헤더 제거 |
| **백엔드 10개 (코드, CORS 설정, 재배포)** | **바뀌지 않음** |
| 기존 `hisfrontend` 배포 | 바뀌지 않음 (옆에 남겨 둠) |
| `develop` 브랜치 | 바뀌지 않음 |

### 0-4. 부작용 (꼭 읽기)

1. **`nginx` 브랜치의 프론트는 Nginx 없이는 `/api`가 동작하지 않습니다.** `rewrites()`가 없어서 `npm run dev`로는 API가 안 닿습니다. 로컬 개발은 `develop`을 쓰세요.
2. 이 브랜치를 `develop`에 **합치지 마세요.** 팀원 로컬 개발이 깨집니다. (정식안은 13장)
3. 새 서비스나 경로가 생기면 **Nginx의 `map` 표에 줄을 추가**해야 합니다.

---

## 1. 시작 전 결정과 준비

| # | 항목 | 확인/결정 |
|---|---|---|
| 1 | **단톡방 공지** | "18090을 Nginx 전용으로 바꿉니다. 화면이 몇 초 끊길 수 있고, 문제가 생기면 바로 원복합니다." 한가한 시간대에 |
| 2 | **이미지를 어디서 빌드하나** | 내 PC(Docker Desktop)에서 빌드해 Docker Hub에 올림 |
| 3 | **Docker Hub 계정과 이미지 이름** | 기존은 `kwonsugeun/hisfrontend:v2.x` 형식. 서버의 실제 값은 2장 ②에서 확인 **[확인 필요]** |
| 4 | **Docker Hub 푸시 권한** | 그 계정의 Read & Write 액세스 토큰. 계정이 다른 팀원 소유면 그분께 요청 |
| 5 | **새 이미지 태그** | 기존 태그를 덮어쓰지 않는 **새 태그** (예: 지금이 `v2.3`이면 `v2.3-nginx`). `latest` 금지 |
| 6 | **롤백 담당과 연락 수단** | 문제 시 누가 원복하는지 |

---

## 2. 현재 상태 기록 (서버, 읽기만, 5분)

```bash
mkdir -p ~/his-k8s/nginx/backup-1015 && cd ~/his-k8s/nginx
```

**① 지금 프론트와 Nginx의 모습**

```bash
kubectl -n his get svc hisfrontend nginx
kubectl -n his get pods -l app=hisfrontend
```

기대: `hisfrontend 3000:30080`, `nginx 8080:30090`.

**② 지금 프론트가 쓰는 이미지 이름과 태그 (중요)**

```bash
kubectl -n his get deploy hisfrontend -o jsonpath='{.spec.template.spec.containers[0].image}{"\n"}'
```

나온 `계정/이름:태그`가 **지금 기준 이미지**입니다. 새 이미지는 같은 계정/이름에 **다른 태그**로 만듭니다.

**③ 원복용 백업 (저장만, 적용하지 않음)**

```bash
kubectl -n his get deploy hisfrontend -o yaml > backup-1015/hisfrontend-deploy.yaml
kubectl -n his get svc hisfrontend -o yaml > backup-1015/hisfrontend-svc.yaml
kubectl -n his get cm nginx-config -o yaml > backup-1015/nginx-config.yaml
kubectl -n his get svc nginx -o yaml > backup-1015/nginx-svc.yaml
cp nginx-step2.yaml backup-1015/nginx-step2.yaml.bak
ls -l backup-1015
```

**④ 18090 연결 방식 재확인**

```bash
docker port minikube | grep 30080
```

`30080/tcp -> 0.0.0.0:18090`이 보여야 합니다. 보이지 않으면 **여기서 멈추고** 문의하세요(방식이 달라집니다).

**⑤ 18091 포트포워드의 PID 파일 (나중에 내 것만 끄기 위해)**

```bash
cat ~/his-k8s/nginx/pf.pid
ss -ltn | grep :18091
```

---

## 3. 코드 수정 (`nginx` 브랜치, 내 PC)

```powershell
cd C:\HIS\hisfrontend
git switch nginx
git status --short          # docs/ 의 추적 안 되는 파일 외에 변경이 없어야 함
```

> `AGENTS.md`에 "이 프로젝트의 Next.js는 기존과 다를 수 있다"고 적혀 있습니다. **지우는 작업뿐**이지만 빌드 통과는 꼭 확인하세요(3-4).

### 3-1. `next.config.ts` (현재 180줄) — `rewrites()`만 제거, 파일은 지우지 않음

| 위치 | 처리 |
|---|---|
| **3~10줄** 맨 위 주석 ("Plan B — Next.js rewrite …") | 현재 구조에 맞게 고침 (아래 예시) |
| **11~37줄** `adminApiOrigin` … `seaweedOrigin` 상수 11개와 그 주석 | **삭제** |
| 39줄 `const nextConfig: NextConfig = {` | 유지 |
| **49줄 `output: "standalone"`** | **유지 (필수)**. 없으면 Dockerfile이 가져가는 `.next/standalone`이 생기지 않아 빌드 실패 |
| 53~74줄 `allowedDevOrigins: [...]` | 유지 |
| **75~176줄** `async rewrites() { ... },` 전체 | **삭제** |
| 177줄 `};` 와 `export default nextConfig;` | 유지 |

맨 위 주석 예시:

```ts
/**
 * API 전달(/api/**, /files/**)은 Nginx가 한다. 이 Next 서버는 화면만 담당한다.
 * - axios baseURL "" → 브라우저는 같은 주소(/api/...)로만 호출 → Nginx가 각 서비스로 전달
 * - rewrites 가 없으므로 npm run dev 로 띄운 로컬에서는 /api 가 동작하지 않는다 (로컬 개발은 develop 브랜치)
 */
```

### 3-2. `Dockerfile` — 서비스 주소 `ARG` 제거

| 위치 | 처리 |
|---|---|
| **52~61줄** `ARG ADMIN_API_ORIGIN=…` ~ `ARG EMERGENCY_API_ORIGIN=…` (10줄) | **삭제** |
| **67줄** `ARG SEAWEED_ORIGIN=…` | **삭제** |
| 위쪽 설명 주석 중 "rewrite 가 build 할 때 굳는다 …" 같은 설명 | 지운 ARG와 관련된 것만 정리 (남겨도 빌드에는 영향 없음) |
| `RUN npm run build`, `COPY …standalone`, `USER nextjs`, `EXPOSE 3000`, `CMD ["node","server.js"]` | **그대로** |

### 3-3. 그 외 (선택)

| 파일 | 처리 |
|---|---|
| `src/lib/axios.ts` | `baseURL: ""`, `withCredentials: true` **그대로** (같은 출처로 `/api/...` 호출) |
| `env.local.sample`, `README.md`의 `*_API_ORIGIN` 안내 | 이 브랜치에서는 의미가 없으나 급하지 않으면 그대로 |

### 3-4. 로컬 빌드 확인 (이미지 만들기 전에)

```powershell
npm ci
npm run build
dir .next\standalone
```

- 오류 없이 끝나야 합니다. 빌드 마지막 라우트 표에 `/api`로 시작하는 rewrite 항목이 없어야 정상입니다.
- `.next\standalone` 폴더가 있어야 합니다.

---

## 4. 새 이미지 빌드·확인·푸시 (내 PC)

### 4-1. 빌드

Docker Desktop을 켠 뒤:

```powershell
cd C:\HIS\hisfrontend
docker build -t <계정>/hisfrontend:<새태그> .
```

- `<계정>/hisfrontend`는 2장 ②에서 확인한 이름과 같게, `<새태그>`는 **기존에 없는 태그**로 씁니다.

### 4-2. 푸시 전에 이미지가 "rewrites 없는 Next"인지 로컬에서 확인 (권장)

`/api`를 전달하는 기능이 **정말 없는지**를 눈으로 확인합니다.

```powershell
docker run --rm -d --name fe-test -p 3999:3000 <계정>/hisfrontend:<새태그>
curl.exe -s -o NUL -w "login: %{http_code}`n" http://localhost:3999/login
curl.exe -s -o NUL -w "api:   %{http_code}`n" http://localhost:3999/api/admin/auth/me
docker stop fe-test
```

| 확인 | 정상 |
|---|---|
| `/login` | `200` (화면은 Next가 서비스함) |
| `/api/admin/auth/me` | **`404`** (Next에 전달 기능이 없으므로 "없는 경로") |

기존 이미지에서는 이 `/api` 요청을 백엔드로 전달하려다 `500`/`502` 등이 나옵니다(컨테이너 안에서 백엔드 이름을 못 찾아서). **`404`가 나오면 rewrites가 없는 이미지가 맞습니다.**

### 4-3. 푸시

```powershell
docker login -u <계정>        # Password 칸에는 Read & Write 액세스 토큰
docker push <계정>/hisfrontend:<새태그>
```

Docker Hub 웹에서 새 태그가 보이면 됩니다. **기존 태그를 덮어쓰지 않았는지** 확인하세요.

### 4-4. 커밋과 푸시 (깃)

```powershell
git add next.config.ts Dockerfile
git commit -m "nginx 전용 배포: next.config.ts의 rewrites와 Dockerfile의 서비스 주소 ARG 제거"
git push
```

---

## 5. 새 프론트를 "옆에" 올리기 (서버, 외부 영향 없음)

기존 `hisfrontend`는 **그대로 두고**, 이름이 다른 새 배포를 만듭니다. 외부 포트가 없는 ClusterIP라 팀원에게 영향이 없습니다.

### 5-1. 파일 (`~/his-k8s/nginx/hisfrontend-nginx.yaml`)

2장 ③의 `backup-1015/hisfrontend-deploy.yaml`을 **참고용**으로 열어 두고, 아래 최소 형태를 기준으로 합니다.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hisfrontend-nginx
  namespace: his
  labels:
    app: hisfrontend-nginx
spec:
  replicas: 1
  selector:
    matchLabels:
      app: hisfrontend-nginx
  template:
    metadata:
      labels:
        app: hisfrontend-nginx
    spec:
      containers:
        - name: hisfrontend
          image: <계정>/hisfrontend:<새태그>
          ports:
            - name: http
              containerPort: 3000
---
apiVersion: v1
kind: Service
metadata:
  name: hisfrontend-nginx
  namespace: his
spec:
  type: ClusterIP
  selector:
    app: hisfrontend-nginx
  ports:
    - name: http
      port: 3000
      targetPort: http
```

기존 배포에서 가져와 맞출 것(백업 파일에서 확인) **[확인 필요]**: `imagePullPolicy`, `imagePullSecrets`(비공개 이미지일 때), `resources`, `env`, 컨테이너 포트 이름이 `http`인지.

### 5-2. 적용과 확인

```bash
cd ~/his-k8s/nginx
kubectl apply -f hisfrontend-nginx.yaml
kubectl -n his get pods -l app=hisfrontend-nginx -w         # 1/1 Running 이 될 때까지
kubectl -n his get svc hisfrontend-nginx
```

- `ImagePullBackOff`: 이미지 이름·태그가 틀렸거나, 서버가 Docker Hub에서 받지 못함(비공개 이미지면 pull secret 필요) → `kubectl -n his describe pod -l app=hisfrontend-nginx`
- `CrashLoopBackOff`: `kubectl -n his logs deploy/hisfrontend-nginx`

이 단계에서 **18090, 18091은 변화가 없어야** 합니다.

---

## 6. Nginx를 새 프론트로 연결하고 18091로 검증 (18090은 그대로)

### 6-1. 설정 파일 만들기

```bash
cd ~/his-k8s/nginx
cp nginx-step2.yaml nginx-final.yaml
```

`nginx-final.yaml`의 `his.conf` 안에서 **두 군데**를 바꿉니다.

**① 화면 요청의 대상 (`location /`)**

```nginx
            set $front http://hisfrontend.his.svc.cluster.local:3000;          # 수정 전
            set $front http://hisfrontend-nginx.his.svc.cluster.local:3000;    # 수정 후
```

**② `location /api/` 의 Origin 줄 — 백엔드로 Origin을 보내지 않음 (CORS 없이 동작시키는 핵심)**

```nginx
            proxy_set_header Origin            "http://seoulit.pe.kr:18090";   # 수정 전 (18090 값으로 바꿔치기)
            proxy_set_header Origin            "";                              # 수정 후 (백엔드로 아예 전달하지 않음)
```

> 값이 빈 문자열이면 Nginx는 그 헤더를 **백엔드로 보내지 않습니다.** 백엔드(Spring)는 `Origin`이 없으면 CORS 요청으로 보지 않아 허용 목록 검사 자체를 하지 않습니다. 브라우저 입장에서는 화면과 `/api`가 같은 주소에서 오므로 **CORS 응답 헤더가 필요 없습니다.** 자세한 확인은 7장입니다.

### 6-2. 적용

```bash
kubectl apply -f nginx-final.yaml
kubectl -n his rollout restart deployment/nginx
kubectl -n his rollout status deployment/nginx
```

> 주의: `nginx-final.yaml`의 Service에는 `nodePort: 30090`이 들어 있습니다. 지금은 30090이라 변화가 없지만, 9장에서 30080으로 바꾼 뒤에는 이 파일을 다시 `apply`하면 30090으로 되돌아갑니다. 9-3을 꼭 하세요.

### 6-3. 18091에서 화면 확인 (18090 화면은 닫아 두기 — 쿠키는 포트를 구분하지 않음)

`http://seoulit.pe.kr:18091`

| # | 확인 | 정상 |
|---|---|---|
| 1 | 로그인 화면 | 표시 |
| 2 | 로그인 | 성공 (`/api/admin/...`) |
| 3 | 입원 목록, 병상 현황 | 데이터 표시 (`/api/inpatient/...`) |
| 4 | 외래, 응급 등 다른 서비스 메뉴 | 정상 |
| 5 | 직원 사진이 있는 화면 | 이미지 표시 (`/files/...`) |
| 6 | 저장·수정(POST/PUT) | 정상 |
| 7 | 로그아웃 | 정상 |

서버 로그:

```bash
kubectl -n his logs deploy/nginx -f
kubectl -n his logs deploy/nginx | grep 'status=5'          # 비어 있어야 함
kubectl -n his logs deploy/hisfrontend-nginx --tail=30     # 새 프론트 오류 확인
```

`/api/...` 줄의 `upstream=`이 서비스별 포트(8086, 9191, 8088 …)로 갈라져야 합니다.

### 6-4. 문제가 생기면 (18090은 영향 없음)

- Nginx 설정을 이전으로: `kubectl apply -f ~/his-k8s/nginx/backup-1015/nginx-step2.yaml.bak` 후 `kubectl -n his rollout restart deployment/nginx`
- 새 프론트 정리(이 두 개만): `kubectl -n his delete deployment hisfrontend-nginx` / `kubectl -n his delete service hisfrontend-nginx`

---

## 7. CORS 없이 동작하는지 확인하기

**목표:** 각 백엔드의 CORS 허용 목록에 18091(또는 18090 외 어떤 주소)이 **없어도** 정상 동작함을 눈으로 확인합니다.

### 7-1. 왜 CORS 없이 동작하나 (원리)

| 단계 | 일어나는 일 |
|---|---|
| 브라우저 | 화면과 API가 **같은 주소**(`…:18091`)이므로 CORS 응답 헤더가 필요 없는 **같은 출처 요청**. 단, POST에는 `Origin: …:18091`이 자동으로 붙음 |
| Nginx | `Origin`을 `""`로 바꿔 **백엔드로 전달하지 않음** |
| 백엔드(Spring) | `Origin`이 없으니 CORS 요청이 아니라고 보고 **허용 목록 검사를 하지 않음** |

기준 사실: admin(`AppConfig`)에는 허용 목록이 있고, 목록에는 `…:18080`, `…:18090`은 있지만 **`…:18091`은 없습니다.** 따라서 18091에서 로그인이 되면 "목록에 없는 주소에서 CORS 없이 동작"한 증거입니다. 또한 inpatient-service에는 CORS 설정이 아예 없습니다(코드 검색 결과).

### 7-2. 비교 실험 (서버 터미널, 한 줄씩)

**① Nginx를 거치는 요청 — 허용 목록에 없는 Origin을 넣어도 CORS 오류가 없어야 함**

```bash
N=http://$(minikube ip):30090
curl -s -i -X POST $N/api/admin/auth/login -H 'Content-Type: application/json' -H 'Origin: http://seoulit.pe.kr:18091' -d '{}' | head -3
```

```bash
curl -s -i -X POST $N/api/admin/auth/login -H 'Content-Type: application/json' -H 'Origin: http://전혀-모르는-사이트.example' -d '{}' | head -3
```

| 결과 | 의미 |
|---|---|
| `HTTP/1.1 400` 또는 `401` 등 (본문에 `Invalid CORS request` 없음) | CORS 검사가 일어나지 않음 ✅ |
| `HTTP/1.1 403` + `Invalid CORS request` | Nginx가 Origin을 지우지 못한 것. 6-1 ② 확인 |

**② 대조군: Nginx를 우회해 백엔드에 직접 보냄 — CORS 검사가 일어나 `403`이 나와야 함** **[시험 안 됨]**

```bash
kubectl -n his exec deploy/nginx -- wget -S -O- --post-data '{}' --header 'Content-Type: application/json' --header 'Origin: http://seoulit.pe.kr:18091' http://admin.his.svc.cluster.local:9191/api/admin/auth/login 2>&1 | head -5
```

- 백엔드에 직접 보낸 요청은 `403`, Nginx를 거친 요청은 `400`이면 **"Nginx가 Origin을 지워서 CORS를 피했다"** 가 증명됩니다.
- `wget` 옵션이 이미지의 busybox에서 안 되면 오류 메시지를 알려 주세요(대안이 있습니다).

### 7-3. 서비스 전체 확인 (허용 목록 유무와 무관하게 CORS 오류가 없어야 함)

```bash
N=http://$(minikube ip):30090
for s in outpatient emergency patient lab-imaging surgery billing reception inpatient pharmacy; do
  printf '%-14s ' $s
  curl -s -X POST $N/api/$s/__cors_check__ -H 'Content-Type: application/json' -H 'Origin: http://seoulit.pe.kr:18091' -d '{}' -o /tmp/cors_body.txt -w '%{http_code} '
  grep -q 'Invalid CORS' /tmp/cors_body.txt && echo 'CORS-403 ❌' || echo 'ok(CORS 아님)'
done
rm -f /tmp/cors_body.txt
```

모든 줄이 `ok(CORS 아님)`이면 성공입니다. (코드 자체는 404/401/500 등 서비스마다 다를 수 있으며, 여기서는 `Invalid CORS request`가 **없는지**만 봅니다.)

### 7-4. 브라우저에서 확인

`http://seoulit.pe.kr:18091`에서 로그인(POST), 저장(POST/PUT), 조회를 해 봅니다. F12 → Network에서 요청의 **Request Headers에는 `Origin`이 보이지만**, 서버가 받은 값은 비어 있습니다(브라우저 화면에서는 구별되지 않고, 7-2 실험이 증거입니다).

### 7-5. "CORS 설정을 백엔드에서 실제로 지워도 되나?"에 대한 답

**지금은 지우지 마세요.** 이번 실험이 증명하는 것은 "Nginx 경로에서는 CORS 설정이 필요 없다"일 뿐입니다.

| 이유 | 설명 |
|---|---|
| 다른 경로가 남아 있음 | 18080(터미널 실행), 로컬 `npm run dev`(`localhost:3000`)는 **Next의 `rewrites()`**를 거치고, 이때 Next는 브라우저의 `Origin`을 그대로 백엔드로 전달합니다. 이 경로에서는 허용 목록이 필요합니다 |
| 서비스 담당자의 코드 | admin, pharmacy 등 다른 사람의 서비스입니다 |
| 보안 | `Origin`을 지우는 방식은 백엔드의 출처 검사를 건너뛰는 것입니다. 학습·내부망 시험용으로는 괜찮지만, 정식으로 쓰려면 Nginx에서 허용할 Origin을 명시하는 방식을 검토하세요 |

백엔드의 CORS 설정을 정리하는 것은 모든 접속 경로가 Nginx로 통일된 **뒤에**, 각 담당자와 합의해서 하는 일입니다.

---

## 8. 18090 전환 전 마지막 확인

- [ ] 6-3 체크리스트 7개 모두 통과
- [ ] 7-2 ① 결과가 `403`이 아님, 7-3의 모든 줄이 `ok(CORS 아님)`
- [ ] `grep 'status=5'` 결과 없음
- [ ] 단톡방 공지 후 팀원 응답/시간 확인
- [ ] 원복 명령(10장 9-1)을 메모장에 복사해 둠
- [ ] 2장 ③ 백업 파일이 서버에 있음 (`ls ~/his-k8s/nginx/backup-1015`)

---

## 9. 18090 전환 (몇 초, NodePort 맞바꾸기)

### 9-1. 사전 확인 (읽기만)

```bash
kubectl -n his get svc hisfrontend nginx
```

`hisfrontend 3000:30080`, `nginx 8080:30090`이어야 합니다. 다르면 중단.

### 9-2. 전환 (한 줄씩, 연달아)

```bash
# (1) 기존 프론트를 30081로 옮겨 30080을 비움 — 이 순간부터 18090이 잠깐 안 열림
kubectl -n his patch svc hisfrontend --type=json -p='[{"op":"replace","path":"/spec/ports/0/nodePort","value":30081}]'
```

```bash
# (2) Nginx가 30080을 가져감
kubectl -n his patch svc nginx --type=json -p='[{"op":"replace","path":"/spec/ports/0/nodePort","value":30080}]'
```

```bash
# (3) 확인
kubectl -n his get svc hisfrontend nginx
curl -s -o /dev/null -w '%{http_code}\n' http://$(minikube ip):30080/nginx-health
```

기대: `hisfrontend 3000:30081`, `nginx 8080:30080`, curl `200`. (1)이 실패하면 (2)를 하지 말고 중단하세요.

### 9-3. YAML에도 같은 값 반영 (되돌아가기 방지)

| 파일 | 수정 |
|---|---|
| `nginx-final.yaml` (Service) | `nodePort: 30090` → `30080` |
| 기존 프론트 Service YAML(`30-hisfrontend.yaml`) | 팀 관리 파일이므로 **임의로 고치지 말고** 팀에 "프론트 Service nodePort가 30081로 바뀌었다"고 알림. 프론트를 재배포하면 30080을 다시 쓰려 해서 Nginx와 충돌함 |

### 9-4. 18090 브라우저 확인

6-3과 같은 7개 항목 + 7장의 CORS 확인(7-2 ①의 Origin을 `…:18090`으로 바꿔서). 로그:

```bash
kubectl -n his logs deploy/nginx --tail=20
kubectl -n his logs deploy/nginx | grep 'status=5'
```

---

## 10. 원복과 정리

### 10-1. 문제가 생기면 즉시 원복 (18090만, 몇 초)

**Nginx를 먼저 비우고, 프론트를 되돌립니다.**

```bash
kubectl -n his patch svc nginx --type=json -p='[{"op":"replace","path":"/spec/ports/0/nodePort","value":30090}]'
kubectl -n his patch svc hisfrontend --type=json -p='[{"op":"replace","path":"/spec/ports/0/nodePort","value":30080}]'
kubectl -n his get svc hisfrontend nginx
curl -I http://$(minikube ip):30080/
```

기대: `hisfrontend 3000:30080`, `nginx 8080:30090`. 기존 프론트를 지우지 않았으므로 **즉시 복구**됩니다.

### 10-2. Nginx 설정까지 원복

```bash
kubectl apply -f ~/his-k8s/nginx/backup-1015/nginx-step2.yaml.bak
kubectl -n his rollout restart deployment/nginx
```

### 10-3. 새 프론트 정리 (필요할 때만, 이 두 개만)

```bash
kubectl -n his delete deployment hisfrontend-nginx
kubectl -n his delete service hisfrontend-nginx
```

### 10-4. 18091 내리기 (18090이 안정된 뒤, 내가 만든 것만)

```bash
kill -0 "$(cat ~/his-k8s/nginx/pf.pid)" && { pkill -P "$(cat ~/his-k8s/nginx/pf.pid)"; kill "$(cat ~/his-k8s/nginx/pf.pid)"; }
ss -ltn | grep :18091          # 아무것도 안 나와야 함
```

다른 사람의 포트포워드(`pkill -u guest4 …`)는 절대 끄지 않습니다.

### 10-5. 며칠 지켜본 뒤

| 시점 | 할 일 |
|---|---|
| 전환 당일~며칠 | 기존 `hisfrontend`는 **그대로 둠** (롤백용, 외부 노출 없음 30081) |
| 팀 합의 후 | `kubectl -n his scale deployment hisfrontend --replicas=0` (삭제 아님) |
| 완전 정리 | 팀이 Nginx를 정식 경로로 쓰기로 합의한 뒤에만 기존 프론트 삭제 |
| 브랜치 | `nginx` 브랜치는 `develop`에 합치지 않음 (0-4) |

---

## 11. 문제 해결 표

| 증상 | 의심 | 확인 |
|---|---|---|
| 새 프론트 Pod `ImagePullBackOff` | 이미지 이름·태그 오타, 비공개 이미지에 pull secret 없음 | `kubectl -n his describe pod -l app=hisfrontend-nginx` |
| 4-2에서 `/api`가 404가 아님 | rewrites가 남아 있는 이미지 | `next.config.ts`에 `rewrites`가 남았는지, 빌드가 새 코드로 되었는지 |
| 화면은 뜨는데 모든 `/api`가 404 | Nginx가 `/api`를 화면 쪽으로 보냄 | Nginx 로그의 `upstream=` |
| 화면이 안 뜨고 `502` | Nginx → 새 프론트 연결 실패 (이름 오타 `hisfrontend-nginx`, Pod 미기동) | `kubectl -n his get pods`, Nginx 로그 `error` |
| 로그인 `403` + `Invalid CORS request` | Nginx에서 Origin이 제거되지 않음 | 6-1 ②가 적용됐는지 `grep -n Origin nginx-final.yaml`, `rollout restart` 했는지 |
| 로그인은 되는데 새로고침하면 풀림 | 세션 쿠키 | F12 → Application → Cookies |
| `/files` 이미지가 안 뜸 | `/files/` 블록 Host 헤더 (가이드에서 미확인 항목) | Nginx 로그의 `/files/` 줄 |
| 18090이 열리지 않음 | NodePort 맞바꾸기 도중 | 9-1의 `get svc`, 안 되면 10-1 즉시 |
| `kubectl patch` 오류 | 포트 경로 오류 | Service에 포트가 하나인지 `-o yaml` |

---

## 12. 확인된 것 / 확인되지 않은 것

**확인된 것 (이전 단계에서 실제 클러스터로 해 본 것)**

- Nginx 라우팅(`/api` → 서비스별 `upstream`), `status=5xx` 없음
- 18090이 minikube `30080` 고정(방식 B), `kubectl patch`로 NodePort를 맞바꾸는 전환과 원복이 정상 동작
- 18091 + `Origin` 처리로 로그인 가능. admin 허용 목록에는 18091이 없음 (코드 확인)
- inpatient-service에는 CORS 설정이 없음 (코드 검색 결과)

**확인되지 않은 것 [시험 안 됨]**

- `Origin ""` 방식이 이 환경의 모든 서비스에서 CORS 오류 없이 동작하는지 (7장에서 확인)
- 7-2 ②의 `kubectl exec … wget` 명령
- `rewrites()` 없는 새 이미지가 이 클러스터에서 실제로 뜨는지, 모든 화면이 정상인지
- 서버가 Docker Hub에서 새 태그를 받는지(비공개 여부, pull secret)
- 기존 `hisfrontend` 배포의 `resources`/`env`/probe 설정 (5-1에서 맞춰야 함)
- `/files`가 새 구성에서 이미지를 정상 반환하는지
- 프론트 재배포 시 NodePort 충돌 (9-3의 팀 공유)

**처음 실행하는 순서입니다.** 6장(18091 검증)과 7장(CORS 확인)까지 통과한 뒤에만 9장으로 넘어가세요.

---

## 13. 나중에 정식으로 쓰려면 (참고, 이번에는 하지 않음)

| 방식 | 내용 | 비고 |
|---|---|---|
| 환경변수로 켜고 끔 | `next.config.ts`에서 `process.env.NEXT_PROXY === "on"`일 때만 `rewrites()`를 반환. Docker 빌드에서는 끔 | 한 브랜치로 로컬(켬)/배포(끔) 모두 가능. **가장 현실적인 정식안** |
| 브랜치 분리 유지 | `develop`은 로컬용, `nginx`는 배포용으로 따로 관리 | 두 브랜치가 어긋나지 않게 주기적으로 `develop`을 합쳐 와야 함 |
| CORS | Nginx에서 허용할 Origin만 명시하는 방식 검토 | 지금의 `Origin ""`은 학습/내부 시험용 |

---

## 부록: 한눈에 보는 순서

| 단계 | 내용 | 18090 영향 |
|---|---|---|
| 1~2 | 공지, 현재 상태 기록과 백업 | 없음 |
| 3 | `nginx` 브랜치에서 `rewrites()`와 `ARG` 제거, 로컬 빌드 | 없음 |
| 4 | 이미지 빌드 → 로컬에서 `/api`가 404인지 확인 → 푸시 | 없음 |
| 5 | 새 프론트를 `hisfrontend-nginx`로 옆에 올림 (ClusterIP) | 없음 |
| 6 | Nginx가 새 프론트를 보게 바꾸고 `Origin ""` 적용, **18091로 검증** | 없음 |
| 7 | **CORS 없이 동작하는지 확인** | 없음 |
| 9 | **NodePort 맞바꾸기로 18090 전환** | **몇 초 끊김** |
| 10 | 문제 시 즉시 원복, 안정되면 18091 끄기 | — |
