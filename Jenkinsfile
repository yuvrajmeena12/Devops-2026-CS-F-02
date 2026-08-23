pipeline {
    agent any

    stages {
        stage('Install Dependencies') {
            steps {
                bat 'npm install'
            }
        }

        stage('Build Frontend') {
            steps {
                bat 'npm run build'
            }
        }
    }

    post {
        success {
            script {
                publishChecks(
                    name: 'Jenkins CI',
                    title: 'Build Successful',
                    summary: 'Frontend build completed successfully'
                )
            }
        }

        failure {
            script {
                publishChecks(
                    name: 'Jenkins CI',
                    title: 'Build Failed',
                    summary: 'Frontend build failed'
                )
            }
        }
    }
}