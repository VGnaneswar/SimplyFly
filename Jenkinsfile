def runCommand(String unixCommand, String windowsCommand) {
    if (isUnix()) {
        sh unixCommand
    } else {
        bat windowsCommand
    }
}

pipeline {
    agent any

    environment {
        DOTNET_CLI_TELEMETRY_OPTOUT = '1'
        DOTNET_NOLOGO = 'true'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Restore Backend') {
            steps {
                script {
                    runCommand(
                        'dotnet restore SimplyFly.slnx',
                        'dotnet restore SimplyFly.slnx'
                    )
                }
            }
        }

        stage('Build Backend') {
            steps {
                script {
                    runCommand(
                        'dotnet build SimplyFly.slnx --configuration Release --no-restore',
                        'dotnet build SimplyFly.slnx --configuration Release --no-restore'
                    )
                }
            }
        }

        stage('Test Backend') {
            steps {
                script {
                    runCommand(
                        'dotnet test SimplyFly.Tests/SimplyFly.Tests.csproj --configuration Release --no-build --verbosity normal',
                        'dotnet test SimplyFly.Tests/SimplyFly.Tests.csproj --configuration Release --no-build --verbosity normal'
                    )
                }
            }
        }

        stage('Install Frontend Dependencies') {
            steps {
                dir('Frontend') {
                    script {
                        runCommand(
                            'npm install --legacy-peer-deps',
                            'npm install --legacy-peer-deps'
                        )
                    }
                }
            }
        }

        stage('Build Frontend') {
            steps {
                dir('Frontend') {
                    script {
                        runCommand(
                            'npm run build',
                            'npm run build'
                        )
                    }
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                script {
                    runCommand(
                        'docker build -f SimplyFly.API/Dockerfile -t simplyfly-api:latest .',
                        'docker build -f SimplyFly.API/Dockerfile -t simplyfly-api:latest .'
                    )
                    runCommand(
                        'cd Frontend && docker build -f Dockerfile -t simplyfly-frontend:latest .',
                        'cd Frontend && docker build -f Dockerfile -t simplyfly-frontend:latest .'
                    )
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
    }
}
