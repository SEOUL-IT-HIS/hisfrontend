# 18090을 "Nginx 전용"으로 올리기 가이드 (next.config.ts의 rewrites 없이)

- 작성일: 2026-10-15
- 대상 브랜치: `nginx` (`origin/develop` 기준, 커밋 `c0a3d00`에서 시작)
- 목표 상태:

```
브라우저 → :18090 → [minikube NodePort 30080] → Nginx ─┬─ /api/**   → 각 백엔드 (admin, inpatient …)
                                                      ├─ /files/** → SeaweedFS
                                                      └─ 그 외(화면) → 새 프론트(rewrites 없음, 화면만)
```

- 표시: **[확인 필요]** = 이 문서를 쓰는 시점에 제가 서버에서 직접 확인하지 못한 값. **[시험 안 됨]** = 이 문서의 명령과 설정은 아직 실제 클러스터에서 돌려 보지 않았습니다.
- 먼저 읽기: 이 문서는 **공유 서버(`guest4`, 10명 공용)** 의 18090을 바꾸는 작업입니다. 18090은 지금 팀원이 쓰는 주소이므로, 아래 "작업 방식"을 반드시 지켜 주세요.

---

## 0. 먼저 알아둘 것 (이 문서의 방식과 이유)

### 0-1. "18090을 내리고 다시 올린다"를 그대로 하지 않는 이유

| | 그대로 하면 | 이 문서의 방식 |
|---|---|---|
| 18090 | 내려가 있는 동안 팀원 화면이 전부 안 열림. 새 프론트가 잘못되면 복구가 오래 걸림 | **새 프론트를 옆에 먼저 올려 18091로 검증**한 뒤, 18090은 포트 번호(NodePort)만 몇 초 만에 바꿈 |
| 18090 연결 방식 | — | 18090은 minikube 컨테이너에 `30080/tcp -> 18090`으로 고정(방식 B). **이 연결은 건드리지 않고** 30080을 쓰는 서비스만 바꿈 |
| 기존 프론트 | 지워 버림 | **지우지 않고** 남겨 둠. 문제가 생기면 번호만 되돌려 바로 복구 |

즉 "내렸다 올린다"가 아니라 **"새것을 옆에서 완성해 놓고 자리를 바꾼다"** 입니다. 화면이 끊기는 시간은 몇 초입니다.

### 0-2. 18090과 18091의 역할

| 포트 | 지금 | 이 작업 후 |
|---|---|---|
| 18090 | 기존 프론트(Next가 `/api`를 전달) | **Nginx + 새 프론트** |
| 18091 | Nginx 연습용(포트포워드) | **내림** (이 문서 7장). 검증이 끝난 뒤에만 |

### 0-3. 이 작업이 바꾸는 것 / 안 바꾸는 것

| 대상 | 바뀌는가 |
|---|---|
| 프론트 소스 (`nginx` 브랜치만) | **바뀜**: `next.config.ts`에서 `rewrites()` 제거, `Dockerfile`에서 서비스 주소 `ARG` 제거 |
| 프론트 이미지 | **새 태그로 새로 만듦** (기존 태그는 그대로) |
| Nginx 설정 | **바뀜**: 화면 요청 대상을 새 프론트로, `Origin` 줄 정리 |
| 백엔드 10개 (코드, 설정, 재배포) | **바뀌지 않음** |
| 기존 `hisfrontend` 배포 | 바뀌지 않음 (옆에 남겨 둠) |
| `develop` 브랜치 | 바뀌지 않음 |

### 0-4. 이 작업을 한 뒤 알아둘 부작용 (꼭 읽기)

1. **`nginx` 브랜치의 프론트는 Nginx 없이는 `/api`가 동작하지 않습니다.** `rewrites()`가 없어서, 로컬에서 `npm run dev`로 띄워도 API가 안 닿습니다. 로컬 개발은 `develop` 브랜치를 쓰세요. 이 브랜치는 **배포용**입니다.
2. 이 브랜치를 `develop`에 합치면 팀원들의 로컬 개발이 깨집니다. **합치지 마세요.** (합치려면 `rewrites()`를 환경변수로 켜고 끄는 방식이 필요합니다 — 13장)
3. 새 서비스나 경로가 생기면 **Nginx의 `map` 표에 줄을 추가**해야 합니다. 표에 없으면 admin으로 갑니다.

---

## 1. 시작 전 결정과 준비 (먼저 정하기)

| # | 항목 | 확인/결정 |
|---|---|---|
| 1 | **단톡방 공지** | "18090을 Nginx 전용으로 바꿉니다. 화면이 몇 초 끊길 수 있고, 문제가 생기면 바로 원복합니다." 시간대는 한가한 때 |
| 2 | **누가 이미지를 빌드하나** | 로컬 PC(Docker Desktop)에서 빌드해 Docker Hub에 올림 (Dockerfile 사용법 기준) |
| 3 | **Docker Hub 계정과 이미지 이름** | 기존은 `kwonsugeun/hisfrontend:v2.x` 형식 (Dockerfile과 쿠버네티스 가이드 기준). 서버의 실제 값은 2장에서 확인 **[확인 필요]** |
| 4 | **Docker Hub 푸시 권한** | Read & Write 액세스 토큰 필요 (Dockerfile 주석). 없으면 이미지 소유자에게 요청 |
| 5 | **새 이미지 태그** | 기존 태그를 덮어쓰지 않고 **새 태그** (예: `v2.x-nginx`). 쿠버네티스는 같은 태그면 바뀐 줄 모름 |
| 6 | **롤백 담당과 연락 수단** | 문제 시 누가 원복하는지 정해 둠 |

---

## 2. 현재 상태 기록 (읽기만, 5분)

서버 터미널(`guest4`)에서. **이 결과를 메모해 두세요.** 원복할 때 기준이 됩니다.

```bash
mkdir -p ~/his-k8s/nginx/backup-1015 && cd ~/his-k8s/nginx
```

**① 지금 프론트와 Nginx의 정확한 모습**

```bash
kubectl -n his get deploy,svc,pods -l app=hisfrontend
kubectl -n his get deploy,svc,pods -l app=nginx
kubectl -n his get svc hisfrontend nginx
```

기대하는 현재 상태: `hisfrontend 3000:30080`, `nginx 8080:30090`.

**② 현재 프론트가 쓰는 이미지 이름과 태그 (중요)**

```bash
kubectl -n his get deploy hisfrontend -o jsonpath='{.spec.template.spec.containers[0].image}{"\n"}'
```

여기서 나온 `계정/이름:태그`가 **지금 기준 이미지**입니다. 새 이미지는 같은 계정/이름에 **다른 태그**로 만듭니다.

**③ 원복용 백업 (YAML 저장만, 적용하지 않음)**

```bash
kubectl -n his get deploy hisfrontend -o yaml > backup-1015/hisfrontend-deploy.yaml
kubectl -n his get svc hisfrontend -o yaml > backup-1015/hisfrontend-svc.yaml
kubectl -n his get cm nginx-config -o yaml > backup-1015/nginx-config.yaml
kubectl -n his get svc nginx -o yaml > backup-1015/nginx-svc.yaml
cp nginx-step2.yaml backup-1015/nginx-step2.yaml.bak
ls -l backup-1015
```

**④ 18090 연결 방식 재확인 (방식 B)**

```bash
docker port minikube | grep 30080
```

`30080/tcp -> 0.0.0.0:18090`이 보여야 합니다. 보이지 않으면 **여기서 멈추고** 5장의 방식이 달라지므로 먼저 문의하세요.

**⑤ 18091 포트포워드의 PID 파일 확인 (나중에 내 것만 끄기 위해)**

```bash
cat ~/his-k8s/nginx/pf.pid
ss -ltn | grep :18091
```

---

## 3. 코드 수정 (`nginx` 브랜치, 내 PC)

```bash
cd C:\HIS\hisfrontend
git switch nginx
git status          # 깨끗한지 확인 (docs/ 같은 추적 안 되는 폴더만 있으면 괜찮음)
```

> 이 프로젝트의 Next.js는 기존과 다를 수 있다고 `AGENTS.md`에 적혀 있습니다. **지우는 작업만** 하지만, 빌드가 통과하는지는 반드시 확인하세요 (3-4).

### 3-1. `next.config.ts` — `rewrites()`만 제거 (파일을 지우지 않음)

파일 전체를 지우면 안 됩니다. `output: "standalone"`이 없으면 Docker 이미지 빌드가 깨집니다(Dockerfile이 `.next/standalone`을 가져감).

| 부분 | 처리 |
|---|---|
| `async rewrites() { return [ ... ]; }` 블록 전체 | **삭제** |
| 위쪽의 `adminApiOrigin`, `patientApiOrigin` … `seaweedOrigin` 상수 11개 | **삭제** (`rewrites()` 말고는 쓰이지 않음) |
| `output: "standalone"` | **유지** (필수) |
| `allowedDevOrigins: [...]` | 유지 |
| 맨 위 주석 "Plan B — Next.js rewrite …" | 현재 구조에 맞게 수정(예: "API 전달은 Nginx가 한다") |

수정 후 모양은 대략 이렇습니다.

```ts
import type { NextConfig } from "next";

/**
 * API 전달(/api/**, /files/**)은 Nginx가 한다. 이 Next 서버는 화면만 담당한다.
 * - axios baseURL "" → 브라우저는 같은 주소(/api/...)로만 호출 → Nginx가 각 서비스로 전달
 * - 로컬 개발(npm run dev)에서는 /api 가 동작하지 않는다. 로컬은 develop 브랜치를 쓴다.
 */
const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: [ /* 기존 목록 그대로 */ ],
};

export default nextConfig;
```

### 3-2. `Dockerfile` — 서비스 주소 ARG 제거

`rewrites()`가 없어지면 아래 `ARG`는 쓰이지 않습니다. 남겨 두어도 빌드는 되지만 **헷갈리지 않게 정리**합니다.

- 삭제: `ARG ADMIN_API_ORIGIN=...` 부터 `ARG EMERGENCY_API_ORIGIN=...` 까지 10줄, 그리고 `ARG SEAWEED_ORIGIN=...`
- 관련 설명 주석("rewrite 는 build 할 때 굳는다 …")도 정리
- `RUN npm run build`, `output standalone`, `USER nextjs`, `EXPOSE 3000`, `CMD ["node","server.js"]`는 **그대로**

### 3-3. 그 외 파일 (선택)

| 파일 | 내용 |
|---|---|
| `env.local.sample`, `README.md` | `*_API_ORIGIN` 안내가 있음. 이 브랜치에서는 의미가 없으므로 주석/문구만 정리해도 되고, 급하지 않으면 그대로 둠 |
| `src/features/pharmacy/api.ts` 주석 | "next.config.ts 쪽에서 덮어씀" 주석뿐. 동작에는 영향 없음 |
| `src/lib/axios.ts` | `baseURL: ""`는 **그대로** (같은 출처로 `/api/...` 호출) |

### 3-4. 로컬에서 빌드 확인 (이미지 빌드 전에)

```bash
npm ci
npm run build
```

- 오류 없이 끝나야 합니다.
- 빌드 결과에서 라우트 목록이 정상 출력되는지만 봅니다. (`/api`로 시작하는 rewrites 표시가 없어야 정상)
- `.next/standalone` 폴더가 생겼는지 확인합니다.

### 3-5. 커밋과 푸시 (선택, 팀 저장소에 올리는 일이므로 하기 전에 확인)

```bash
git add next.config.ts Dockerfile
git commit -m "nginx 전용 배포: next.config.ts의 rewrites와 Dockerfile의 서비스 주소 ARG 제거"
git push -u origin nginx        # 원격에 올리기 전에 팀과 상의
```

---

## 4. 새 프론트 이미지 만들기와 올리기 (내 PC)

```bash
cd C:\HIS\hisfrontend
docker build -t <계정>/hisfrontend:<새태그> .
docker login -u <계정>          # Password에는 Read & Write 액세스 토큰
docker push <계정>/hisfrontend:<새태그>
```

- `<계정>/hisfrontend`는 2장 ②에서 확인한 이름과 같게 씁니다 (예: `kwonsugeun/hisfrontend`).
- `<새태그>`는 **기존에 없는 태그**. 예: 지금이 `v2.3`이면 `v2.3-nginx`.
- `latest`를 쓰지 않습니다. 같은 태그를 덮어쓰지 않습니다.
- 빌드가 끝나면 로컬에서 한 번 실행해 보는 것은 의미가 없습니다(`/api`가 Nginx 없이는 안 되므로). 이미지가 만들어지고 푸시되면 충분합니다.

확인: Docker Hub 웹에서 새 태그가 보이면 됩니다.

---

## 5. 새 프론트를 "옆에" 올리기 (서버, 외부 영향 없음)

기존 `hisfrontend`는 **그대로 두고**, 이름이 다른 새 배포를 하나 더 만듭니다. 외부 포트가 없는 ClusterIP라서 팀원에게 영향이 없습니다.

### 5-1. 파일 만들기 (`~/his-k8s/nginx/hisfrontend-nginx.yaml`)

2장 ③에서 저장한 `backup-1015/hisfrontend-deploy.yaml`을 **참고용**으로 열어 두고, 아래 최소 형태를 기준으로 합니다. 기존 배포에 `readinessProbe`, `resources`, `env` 등이 있다면 **같은 값을 가져옵니다** **[확인 필요]**.

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

기존 `hisfrontend` 배포에서 가져와 맞춰야 할 것(2장 ③ 파일에서 확인):

- `imagePullPolicy`, `imagePullSecrets`(비공개 이미지일 때), `resources`, `env`
- 컨테이너 포트 이름이 `http`인지

### 5-2. 적용과 확인

```bash
cd ~/his-k8s/nginx
kubectl apply -f hisfrontend-nginx.yaml
kubectl -n his get pods -l app=hisfrontend-nginx -w         # 1/1 Running 이 될 때까지
kubectl -n his get svc hisfrontend-nginx
```

- `ImagePullBackOff`: 이미지 이름·태그가 틀렸거나, 서버가 Docker Hub에서 받지 못하는 것(비공개 이미지면 pull secret 필요) **[확인 필요]**. `kubectl -n his describe pod -l app=hisfrontend-nginx`에서 이유를 확인.
- `CrashLoopBackOff`: `kubectl -n his logs deploy/hisfrontend-nginx`.

이 단계에서 **18090, 18091 모두 변화 없음**을 확인합니다 (브라우저에서 18090이 계속 정상).

---

## 6. 18091에서 먼저 검증하기 (18090은 그대로)

Nginx가 화면 요청을 **새 프론트**로 보내게 바꾸고, 지금 열려 있는 18091로 확인합니다.

### 6-1. Nginx 설정 수정 (`nginx-step2.yaml`을 복사해 사용)

```bash
cd ~/his-k8s/nginx
cp nginx-step2.yaml nginx-final.yaml
```

`nginx-final.yaml`의 `his.conf` 안에서 **두 군데**만 바꿉니다.

**① 화면 요청 대상 (`location /`)**

```nginx
        location / {
            set $front http://hisfrontend.his.svc.cluster.local:3000;     # 수정 전
            set $front http://hisfrontend-nginx.his.svc.cluster.local:3000;   # 수정 후
```

**② `location /api/`의 Origin 줄**

18090으로 올릴 때는 브라우저의 Origin이 원래 `…:18090`이고 admin 허용 목록에 이미 있으므로 **바꿔치기가 필요 없습니다**. 다만 18091로 검증하는 동안에는 필요합니다. 순서는 이렇습니다.

| 시점 | Origin 줄 |
|---|---|
| 6장 (18091로 검증) | 지금 그대로 두거나 `proxy_set_header Origin "";` (CORS 영향 안 받게, 권장) |
| 8장 이후 (18090 전환 후) | 그 줄을 **제거**해도 됨 (허용 목록에 있는 주소). 남겨 두어도 해롭지 않음 |

`Origin`을 `""`로 바꾸는 방법은 이미 설명한 방법 1입니다 (백엔드로 `Origin`을 보내지 않아 CORS 검사가 일어나지 않음).

### 6-2. 적용

```bash
kubectl apply -f nginx-final.yaml
kubectl -n his rollout restart deployment/nginx
kubectl -n his rollout status deployment/nginx
```

> 주의: `nginx-final.yaml`에는 Service의 `nodePort: 30090`도 들어 있습니다. 지금 nginx Service가 30090이므로 변화는 없습니다. **8장에서 30080으로 바꾼 뒤에는 이 파일을 다시 `apply`하면 30090으로 되돌아갈 수 있으므로**, 8-3의 파일 수정을 꼭 하세요.

### 6-3. 18091에서 확인 체크리스트

브라우저 `http://seoulit.pe.kr:18091` (18090 화면은 닫아 두기 — 쿠키는 포트를 구분하지 않음)

| # | 확인 | 정상 |
|---|---|---|
| 1 | 로그인 화면 | 표시됨 |
| 2 | 로그인 | 성공 (`/api/admin/...`) |
| 3 | 입원 목록, 병상 현황 | 데이터 표시 (`/api/inpatient/...`) |
| 4 | 다른 서비스 메뉴 몇 개 (외래, 응급 등) | 정상 |
| 5 | 직원 사진이 있는 화면 | 이미지 표시 (`/files/...`) |
| 6 | 저장·수정 같은 POST/PUT | 정상 |
| 7 | 로그아웃 | 정상 |

서버에서 로그도 같이 봅니다.

```bash
kubectl -n his logs deploy/nginx -f
```

- `/api/...` 줄의 `upstream=`이 서비스별 포트(8086, 9191, 8088 …)이고, 화면 요청은 새 프론트로 가는지 확인합니다.
- **`status=5xx`가 없어야** 합니다: `kubectl -n his logs deploy/nginx | grep 'status=5'`
- 새 프론트 로그에 오류가 없는지: `kubectl -n his logs deploy/hisfrontend-nginx --tail=30`

**하나라도 이상하면 8장으로 넘어가지 마세요.** 원복은 7장이 아니라 6-4입니다.

### 6-4. 검증 중 문제가 생기면 (18090은 영향 없음)

- Nginx 설정을 이전으로: `kubectl apply -f ~/his-k8s/nginx/nginx-step2.yaml` 후 `kubectl -n his rollout restart deployment/nginx`
- 새 프론트는 그냥 두거나 `kubectl -n his delete deployment hisfrontend-nginx; kubectl -n his delete service hisfrontend-nginx`로 지움 (이 두 개만)

---

## 7. (예비) 18090 전환 전 마지막 확인

- [ ] 6-3 체크리스트 7개 모두 통과
- [ ] `grep 'status=5'` 결과 없음
- [ ] 단톡방 공지 후 팀원 응답/시간 확인
- [ ] 원복 명령을 메모장에 복사해 둠 (9장)
- [ ] 2장 ③ 백업 파일이 서버에 있음 (`ls ~/his-k8s/nginx/backup-1015`)

---

## 8. 18090 전환 (몇 초, 방식 B: NodePort 맞바꾸기)

### 8-1. 사전 확인 (읽기만)

```bash
kubectl -n his get svc hisfrontend nginx
```

`hisfrontend 3000:30080`, `nginx 8080:30090`이어야 합니다. 다르면 중단하고 확인하세요.

### 8-2. 전환 (한 줄씩, 순서대로, 연달아)

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

### 8-3. YAML에도 같은 값 반영 (되돌아가기 방지)

`patch`는 클러스터에만 적용되므로, 나중에 YAML을 `apply`하면 옛 번호로 되돌아갑니다. 둘 다 고쳐 두세요.

| 파일 | 수정 |
|---|---|
| `nginx-final.yaml` (Service) | `nodePort: 30090` → `nodePort: 30080` |
| 기존 프론트의 Service YAML(`30-hisfrontend.yaml`, 서버 `~/his-k8s/`) | 팀이 관리하는 파일이므로 **임의로 고치지 말고** 팀에 "프론트 Service의 nodePort가 30081로 바뀌었다"고 알림. 프론트를 재배포하면 30080을 다시 쓰려 해서 Nginx와 충돌합니다 |

### 8-4. 브라우저 확인 (18090)

6-3과 같은 7개 항목. 이번에는 `Origin`이 원래 허용 목록에 있는 `…:18090`이라 CORS 문제가 없어야 합니다.

```bash
kubectl -n his logs deploy/nginx --tail=20
kubectl -n his logs deploy/nginx | grep 'status=5'
```

---

## 9. 원복 (문제가 생기면 바로)

### 9-1. 18090만 원복 (가장 빠름, 몇 초)

**Nginx를 먼저 비우고, 프론트를 되돌립니다.**

```bash
kubectl -n his patch svc nginx --type=json -p='[{"op":"replace","path":"/spec/ports/0/nodePort","value":30090}]'
kubectl -n his patch svc hisfrontend --type=json -p='[{"op":"replace","path":"/spec/ports/0/nodePort","value":30080}]'
kubectl -n his get svc hisfrontend nginx
curl -I http://$(minikube ip):30080/
```

기대: `hisfrontend 3000:30080`, `nginx 8080:30090`. 이렇게 하면 18090은 **기존 프론트로 즉시 복구**됩니다 (기존 프론트는 지우지 않고 남겨 두었기 때문).

### 9-2. Nginx 설정까지 원복

```bash
kubectl apply -f ~/his-k8s/nginx/backup-1015/nginx-step2.yaml.bak
kubectl -n his rollout restart deployment/nginx
```

### 9-3. 새 프론트 정리 (필요할 때만, 이 두 개만)

```bash
kubectl -n his delete deployment hisfrontend-nginx
kubectl -n his delete service hisfrontend-nginx
```

---

## 10. 18091 내리기 (18090 전환이 안정된 뒤)

18090에서 충분히 확인한 뒤에 **내가 만든 포트포워드만** 끕니다.

```bash
kill -0 "$(cat ~/his-k8s/nginx/pf.pid)" && { pkill -P "$(cat ~/his-k8s/nginx/pf.pid)"; kill "$(cat ~/his-k8s/nginx/pf.pid)"; }
ss -ltn | grep :18091          # 아무것도 안 나와야 함
```

- 다른 사람의 포트포워드(`pkill -u guest4 …`)는 절대 끄지 않습니다.
- 18091이 이미 꺼져 있으면 건너뛰어도 됩니다.

---

## 11. 정리 (며칠 지켜본 뒤)

| 시점 | 할 일 |
|---|---|
| 전환 당일~며칠 | 기존 `hisfrontend`는 **그대로 둠** (롤백용). 단, 외부 노출은 없음(30081) |
| 팀 합의 후 | 기존 프론트 `replicas`를 0으로: `kubectl -n his scale deployment hisfrontend --replicas=0` (삭제 아님) |
| 완전 정리 | 팀이 Nginx를 정식 경로로 쓰기로 합의한 뒤에만 기존 프론트 삭제 |
| 브랜치 | `nginx` 브랜치는 **develop에 합치지 않음** (0-4 참고). 필요하면 PR 대신 배포용 브랜치로 관리 |

---

## 12. 문제 해결 표

| 증상 | 의심 | 확인 |
|---|---|---|
| 새 프론트 Pod `ImagePullBackOff` | 이미지 이름·태그 오타, 비공개 이미지에 pull secret 없음 | `kubectl -n his describe pod -l app=hisfrontend-nginx` |
| 화면은 뜨는데 모든 `/api`가 404 | Nginx 설정이 `/api` 대신 화면 쪽으로 감 / `location /api/`가 없음 | Nginx 로그의 `upstream=` |
| 화면이 안 뜨고 `502` | Nginx → 새 프론트 연결 실패 (이름 오타 `hisfrontend-nginx`, Pod 미기동) | `kubectl -n his get pods`, Nginx 로그 `error` |
| 로그인 `403` | CORS (Origin이 허용 목록에 없음) | 6-1 ②의 Origin 처리 |
| 로그인이 되는데 새로고침하면 풀림 | 쿠키/세션 | 브라우저 F12 → Application → Cookies |
| `/files` 이미지가 안 뜸 | `/files/` 블록 Host 헤더 문제 (가이드에서 미확인 항목) | Nginx 로그의 `/files/` 줄 |
| 18090이 열리지 않음 | NodePort 맞바꾸기 중 | 8-1의 `get svc` 결과, 안 되면 9-1 즉시 |
| `kubectl patch` 오류 | JSON 경로 오류 | Service에 포트가 하나인지 `-o yaml`로 확인 |

---

## 13. 나중에 정식으로 쓰려면 (참고, 이번에는 하지 않음)

이 브랜치를 팀 공용으로 만들려면 로컬 개발과 배포를 모두 만족시켜야 합니다. 대안은 이렇습니다.

| 방식 | 내용 | 비고 |
|---|---|---|
| 환경변수로 켜고 끔 | `next.config.ts`에서 `process.env.NEXT_PROXY === "on"`일 때만 `rewrites()`를 반환. Dockerfile 빌드에서는 끔 | 한 브랜치로 로컬(켬)/배포(끔) 모두 가능. **가장 현실적인 정식안** |
| 브랜치 분리 유지 | `develop`은 로컬용, `nginx`는 배포용으로 계속 따로 관리 | 두 브랜치가 어긋나지 않게 주기적으로 `develop`을 합쳐 와야 함 |

그리고 CORS는 각 백엔드의 허용 목록 대신 **Nginx에서 `Origin`을 비워 전달하는 방법**(6-1 ②)으로 영향 없이 갈 수 있습니다. 백엔드 10곳은 그대로입니다.

---

## 14. 확인된 것 / 확인되지 않은 것

**확인된 것 (이전 단계에서 실제 클러스터로 해 본 것)**

- Nginx 1~2단계 적용, `/api` 서비스별 라우팅, `status=5xx` 없음
- 18090이 minikube `30080` 고정(방식 B)이며, `kubectl patch`로 NodePort를 맞바꾸는 전환과 원복이 정상 동작
- 18091 포트포워드와 `Origin` 처리로 로그인 가능

**확인되지 않은 것 [시험 안 됨]**

- `rewrites()` 없는 새 프론트 이미지가 이 클러스터에서 실제로 뜨는지, 모든 화면이 정상인지
- 서버가 Docker Hub에서 새 태그를 받는지(비공개 이미지 여부, pull secret)
- 기존 `hisfrontend` 배포의 `resources`/`env`/probe 설정(5-1에서 맞춰야 함)
- `/files` 경로가 새 구성에서 이미지를 정상 반환하는지
- 프론트 재배포 시 NodePort 충돌 (8-3의 팀 공유 필요)
- 이 문서의 명령들은 위 상태를 근거로 쓴 것이며 **처음 실행하는 순서**입니다. 6장(18091 검증)까지 통과한 뒤에 8장으로 넘어가세요.

---

## 부록: 한눈에 보는 순서

| 단계 | 내용 | 18090 영향 |
|---|---|---|
| 1~2 | 공지, 현재 상태 기록과 백업 | 없음 |
| 3 | `nginx` 브랜치에서 `rewrites()`와 `ARG` 제거, 로컬 빌드 확인 | 없음 |
| 4 | 새 태그로 이미지 빌드와 푸시 | 없음 |
| 5 | 새 프론트를 `hisfrontend-nginx`로 옆에 올림 (ClusterIP) | 없음 |
| 6 | Nginx가 새 프론트를 보게 바꾸고 **18091로 검증** | 없음 |
| 8 | **NodePort 맞바꾸기로 18090 전환** | **몇 초 끊김** |
| 9 | 문제 시 즉시 원복 | — |
| 10 | 안정되면 18091 포트포워드 끄기 | 없음 |
| 11 | 며칠 지켜본 뒤 기존 프론트 `replicas 0` | 없음 |
