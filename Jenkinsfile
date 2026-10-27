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

        stage('Check Tools') {
            steps {
                bat '''
                    echo Checking required tools...
                    where.exe git
                    where.exe node
                    where.exe npm
                    where.exe docker
                    where.exe kubectl
                    docker version
                    kubectl get nodes
                '''
            }
        }

        stage('Check Kubernetes Secret') {
            steps {
                bat '''
                    if not exist "k8s\\02-secrets.yaml" (
                        echo ERROR: k8s\\02-secrets.yaml is missing.
                        echo Create the Kubernetes secret locally before running this pipeline.
                        exit /b 1
                    )
                '''
            }
        }

        stage('Install Dependencies') {
            steps {
                bat '''
                    cd frontend
                    call npm install
                    if errorlevel 1 exit /b 1

                    cd ..\\backend
                    call npm install
                    if errorlevel 1 exit /b 1
                '''
            }
        }

        stage('Build Frontend') {
            steps {
                bat '''
                    cd frontend
                    call npm run build
                    if errorlevel 1 exit /b 1
                '''
            }
        }

        stage('Backend Check') {
            steps {
                bat '''
                    cd backend
                    node --version
                    if errorlevel 1 exit /b 1
                    npm --version
                    if errorlevel 1 exit /b 1
                '''
            }
        }

        stage('Build Docker Images') {
            steps {
                bat '''
                    docker build -t skillswap-backend:latest ./backend
                    if errorlevel 1 exit /b 1

                    docker build -t skillswap-frontend:latest ./frontend
                    if errorlevel 1 exit /b 1
                '''
            }
        }

        stage('Import Images to Kubernetes') {
            steps {
                bat '''
                    docker save -o temp-backend.tar skillswap-backend:latest
                    if errorlevel 1 exit /b 1

                    docker cp temp-backend.tar desktop-control-plane:/temp-backend.tar
                    if errorlevel 1 exit /b 1

                    docker exec desktop-control-plane ctr -n k8s.io images import /temp-backend.tar
                    if errorlevel 1 exit /b 1

                    docker exec desktop-control-plane rm /temp-backend.tar
                    del /q temp-backend.tar

                    docker save -o temp-frontend.tar skillswap-frontend:latest
                    if errorlevel 1 exit /b 1

                    docker cp temp-frontend.tar desktop-control-plane:/temp-frontend.tar
                    if errorlevel 1 exit /b 1

                    docker exec desktop-control-plane ctr -n k8s.io images import /temp-frontend.tar
                    if errorlevel 1 exit /b 1

                    docker exec desktop-control-plane rm /temp-frontend.tar
                    del /q temp-frontend.tar
                '''
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                bat '''
                    kubectl apply -f k8s/01-namespace.yaml
                    if errorlevel 1 exit /b 1

                    kubectl apply -f k8s/03-configmap.yaml
                    if errorlevel 1 exit /b 1

                    kubectl apply -f k8s/04-mongodb.yaml
                    if errorlevel 1 exit /b 1

                    kubectl apply -f k8s/02-secrets.yaml
                    if errorlevel 1 exit /b 1

                    kubectl apply -f k8s/05-backend.yaml
                    if errorlevel 1 exit /b 1

                    kubectl apply -f k8s/06-frontend.yaml
                    if errorlevel 1 exit /b 1
                '''
            }
        }

        stage('Verify Rollout and Diagnostics') {
            steps {
                bat '''
                    kubectl rollout restart deployment/backend-deployment -n skillswap
                    if errorlevel 1 exit /b 1

                    kubectl rollout restart deployment/frontend-deployment -n skillswap
                    if errorlevel 1 exit /b 1

                    kubectl rollout status deployment/backend-deployment -n skillswap --timeout=180s
                    if errorlevel 1 exit /b 1

                    kubectl rollout status deployment/frontend-deployment -n skillswap --timeout=180s
                    if errorlevel 1 exit /b 1

                    echo === Pod Status ===
                    kubectl get pods -n skillswap -o wide

                    echo === Service Status ===
                    kubectl get services -n skillswap

                    echo === Endpoint Status ===
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
                echo ================================================ >> "C:\\JenkinsFeedback\\build-feedback.txt"
            '''
        }
    }
}