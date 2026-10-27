pipeline {
    agent any

    environment {
    PATH = "C:/Users/GANPATI/AppData/Local/Programs/DockerDesktop/resources/bin;${env.PATH}"
    KUBECONFIG = "C:/Users/GANPATI/.kube/config"
}
    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                bat '''
                    cd frontend
                    call npm install

                    cd ..\\backend
                    call npm install
                '''
            }
        }

        stage('Build Frontend') {
            steps {
                bat '''
                    cd frontend
                    call npm run build
                '''
            }
        }

        stage('Backend Check') {
            steps {
                bat '''
                    cd backend
                    node --version
                    npm --version
                '''
            }
        }

        stage('Build Docker Images') {
            steps {
                bat '''
                    docker build -t skillswap-backend:latest ./backend
                    docker build -t skillswap-frontend:latest ./frontend
                '''
            }
        }

        stage('Import Images to Kubernetes') {
            steps {
                bat '''
                    docker save -o temp-backend.tar skillswap-backend:latest
                    docker cp temp-backend.tar desktop-control-plane:/temp-backend.tar
                    docker exec desktop-control-plane ctr -n k8s.io images import /temp-backend.tar
                    docker exec desktop-control-plane rm /temp-backend.tar
                    del temp-backend.tar

                    docker save -o temp-frontend.tar skillswap-frontend:latest
                    docker cp temp-frontend.tar desktop-control-plane:/temp-frontend.tar
                    docker exec desktop-control-plane ctr -n k8s.io images import /temp-frontend.tar
                    docker exec desktop-control-plane rm /temp-frontend.tar
                    del temp-frontend.tar
                '''
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                bat '''
                    kubectl apply -f k8s/01-namespace.yaml
                    kubectl apply -f k8s/03-configmap.yaml
                    kubectl apply -f k8s/04-mongodb.yaml

                    if exist k8s\\02-secrets.yaml (
                        kubectl apply -f k8s/02-secrets.yaml
                    ) else (
                        kubectl apply -f k8s/02-secrets.example.yaml
                    )

                    kubectl apply -f k8s/05-backend.yaml
                    kubectl apply -f k8s/06-frontend.yaml
                '''
            }
        }

        stage('Verify Rollout and Diagnostics') {
            steps {
                bat '''
                    kubectl rollout restart deployment/backend-deployment -n skillswap
                    kubectl rollout restart deployment/frontend-deployment -n skillswap
                    kubectl rollout status deployment/backend-deployment -n skillswap --timeout=120s
                    kubectl rollout status deployment/frontend-deployment -n skillswap --timeout=120s

                    echo === Pod Status ===
                    kubectl get pods -n skillswap -o wide

                    echo === Service Status ===
                    kubectl get services -n skillswap

                    echo === Endpoints Status ===
                    kubectl get endpoints -n skillswap
                '''
            }
        }
    }

    post {

        success {
            bat '''
                if not exist "C:\\JenkinsFeedback" mkdir "C:\\JenkinsFeedback"

                echo.>> "C:\\JenkinsFeedback\\build-feedback.txt"
                echo ================================================ >> "C:\\JenkinsFeedback\\build-feedback.txt"
                echo Build Number: %BUILD_NUMBER% >> "C:\\JenkinsFeedback\\build-feedback.txt"
                echo Build Status: SUCCESS >> "C:\\JenkinsFeedback\\build-feedback.txt"
                echo Project: SkillSwap >> "C:\\JenkinsFeedback\\build-feedback.txt"
                echo Job Name: %JOB_NAME% >> "C:\\JenkinsFeedback\\build-feedback.txt"
                echo Stage: Kubernetes Deployment Verified >> "C:\\JenkinsFeedback\\build-feedback.txt"
                echo Jenkins Auto Trigger: SUCCESS >> "C:\\JenkinsFeedback\\build-feedback.txt"
                echo ================================================ >> "C:\\JenkinsFeedback\\build-feedback.txt"
            '''
        }

        failure {
            bat '''
                if not exist "C:\\JenkinsFeedback" mkdir "C:\\JenkinsFeedback"

                echo.>> "C:\\JenkinsFeedback\\build-feedback.txt"
                echo ================================================ >> "C:\\JenkinsFeedback\\build-feedback.txt"
                echo Build Number: %BUILD_NUMBER% >> "C:\\JenkinsFeedback\\build-feedback.txt"
                echo Build Status: FAILURE >> "C:\\JenkinsFeedback\\build-feedback.txt"
                echo Project: SkillSwap >> "C:\\JenkinsFeedback\\build-feedback.txt"
                echo Job Name: %JOB_NAME% >> "C:\\JenkinsFeedback\\build-feedback.txt"
                echo Jenkins Auto Trigger: FAILED >> "C:\\JenkinsFeedback\\build-feedback.txt"
                echo ================================================ >> "C:\\JenkinsFeedback\\build-feedback.txt"
            '''
        }
    }
}
