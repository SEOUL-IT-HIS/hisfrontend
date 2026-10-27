// =====================================================================
// [프론트 담당 1명] 프론트(hisfrontend-nginx): 소스 받기 → 이미지 빌드(Dockerfile 안에서 npm ci + next build) → push → 배포
// =====================================================================

// ===== 담당자가 채우는 값 ============================================
def CFG = [
    repo      : 'https://github.com/SEOUL-IT-HIS/hisfrontend.git',
    branch    : 'nginx',                                                    // [확인 필요] 지금 18090 의 v2.4-nginx 를 만든 브랜치. 팀 통합 후에는 develop
    dockerhub : 'youngeiya',                                                // 프론트 담당 본인 Docker Hub 아이디
    agent     : 'remote-linux-agent',                                                // 프론트 담당 본인 Jenkins 의 원격 노드 Label
    owner     : 'youngeiya',                                                // 배포 기록에 남길 이름
]
// =====================================================================

// CFG 에 TODO 가 남아 있으면 노드를 기다리기 전에 바로 멈춘다 (agent 'TODO' 로는 영원히 대기하게 되므로)
for (k in CFG.keySet()) {
    if (CFG[k].toString().contains('TODO')) {
        error "이 Jenkinsfile 의 CFG.${k} 를 채운다 (지금 값: ${CFG[k]})"
    }
}

pipeline {
    agent { label "${CFG.agent}" }

    options {
        disableConcurrentBuilds()
        timeout(time: 40, unit: 'MINUTES')              // npm ci + next build 는 백엔드보다 오래 걸린다
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    triggers {
        pollSCM('H/5 * * * *')
    }

    environment {
        NS = 'his'
    }

    stages {
        stage('준비') {
            steps {
                script {
                    env.OWNER = CFG.owner
                }
                sh '''
                    export PATH="$HOME/bin:$PATH"
                    which kubectl docker
                    kubectl -n "$NS" get ns "$NS" >/dev/null
                '''
            }
        }

        stage('소스 받기') {
            steps {
                dir('src') {
                    git url: CFG.repo, branch: CFG.branch
                }
                script {
                    def sha = sh(script: 'git -C src rev-parse --short=7 HEAD', returnStdout: true).trim()
                    env.IMAGE = "${CFG.dockerhub}/hisfrontend:b${env.BUILD_NUMBER}-${sha}"
                    currentBuild.displayName = "#${env.BUILD_NUMBER} frontend ${sha}"
                }
            }
        }

        stage('이미지 빌드·push') {
            steps {
                dir('src') {
                    withCredentials([usernamePassword(credentialsId: 'dockerhub',
                                                      usernameVariable: 'DH_USER',
                                                      passwordVariable: 'DH_TOKEN')]) {
                        sh '''
                            export DOCKER_CONFIG="$WORKSPACE/.docker"
                            mkdir -p "$DOCKER_CONFIG"
                            echo "$DH_TOKEN" | docker login -u "$DH_USER" --password-stdin
                            docker build -t "$IMAGE" .
                            docker push "$IMAGE"
                        '''
                    }
                }
            }
        }

        stage('배포') {
            steps {
                sh '''
                    export PATH="$HOME/bin:$PATH"
                    sed "s|__IMAGE__|$IMAGE|g" frontend/k8s.yaml | kubectl apply -f -
                    kubectl -n "$NS" annotate deployment/hisfrontend-nginx \
                        kubernetes.io/change-cause="$IMAGE by $OWNER (Jenkins #$BUILD_NUMBER)" --overwrite
                    kubectl -n "$NS" rollout status deployment/hisfrontend-nginx --timeout=300s
                    kubectl -n "$NS" get pods -l app=hisfrontend-nginx -o wide
                '''
            }
        }
    }

    post {
        always {
            sh '''
                export DOCKER_CONFIG="$WORKSPACE/.docker"
                docker logout >/dev/null 2>&1 || true
                rm -rf "$DOCKER_CONFIG"
                if [ -n "$IMAGE" ]; then docker rmi "$IMAGE" >/dev/null 2>&1 || true; fi
            '''
        }
    }
}
