pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    parameters {
        string(name: 'GIT_BRANCH', defaultValue: 'main', description: 'Git branch to build')
        string(name: 'IMAGE_TAG', defaultValue: '', description: 'Optional image tag override')
        choice(name: 'DEPLOY_ENV', choices: ['dev', 'qa', 'prod'], description: 'Target environment')
    }

    
    environment {
        PROJECT_ID   = 'your-gcp-project-id'
        REGION       = 'asia-south1'
        GAR_REPO     = 'your-artifact-repo'
        APP_NAME     = 'node-app'
        CLUSTER_NAME = 'your-gke-cluster'
        CLUSTER_ZONE = 'asia-south1-a'
        NAMESPACE    = 'default'

        IMAGE_TAG_FINAL = "${params.IMAGE_TAG ?: env.BUILD_NUMBER}"
        IMAGE_URI = "${REGION}-docker.pkg.dev/${PROJECT_ID}/${GAR_REPO}/${APP_NAME}:${IMAGE_TAG_FINAL}"
    }



    stages {

        stage('Checkout Source') {
            steps {
                checkout([
                    $class: 'GitSCM',
                    branches: [[name: "*/${params.GIT_BRANCH}"]],
                    userRemoteConfigs: [[
                        url: 'https://github.com/your-org/your-repo.git',
                        credentialsId: 'github-creds'
                    ]]
                ])
            }
        }

        stage('Verify Tools') {
            steps {
                sh '''
                    git --version
                    docker --version
                    gcloud --version
                    kubectl version --client
                '''
            }
        }

        stage('Authenticate to GCP') {
            steps {
                withCredentials([file(credentialsId: 'gcp-sa-json', variable: 'GOOGLE_APPLICATION_CREDENTIALS')]) {
                    sh '''
                        gcloud auth activate-service-account --key-file="$GOOGLE_APPLICATION_CREDENTIALS"
                        gcloud config set project "$PROJECT_ID"
                        gcloud auth configure-docker ${REGION}-docker.pkg.dev --quiet
                    '''
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                sh '''
                    docker build -t "$IMAGE_URI" .
                '''
            }
        }

        stage('Push Image to Artifact Registry') {
            steps {
                sh '''
                    docker push "$IMAGE_URI"
                '''
            }
        }

        stage('Get GKE Credentials') {
            steps {
                withCredentials([file(credentialsId: 'gcp-sa-json', variable: 'GOOGLE_APPLICATION_CREDENTIALS')]) {
                    sh '''
                        gcloud auth activate-service-account --key-file="$GOOGLE_APPLICATION_CREDENTIALS"
                        gcloud config set project "$PROJECT_ID"
                        gcloud container clusters get-credentials "$CLUSTER_NAME" --zone "$CLUSTER_ZONE" --project "$PROJECT_ID"
                    '''
                }
            }
        }
        
        stage('Deploy to GKE') {
            steps {
                sh '''
                    sed "s|IMAGE_PLACEHOLDER|$IMAGE_URI|g" node-app-deploy.yaml | kubectl apply -n "$NAMESPACE" -f -
                    kubectl apply -n "$NAMESPACE" -f service.yaml
                '''
            }
        }

        stage('Verify Rollout') {
            steps {
                sh '''
                    kubectl rollout status deployment/$APP_NAME -n "$NAMESPACE" --timeout=180s
                    kubectl get pods -n "$NAMESPACE"
                    kubectl get svc -n "$NAMESPACE"
                '''
            }
        }
    }

    post {
        success {
            echo "Pipeline completed successfully. Image pushed: ${IMAGE_URI}"
        }
        failure {
            echo "Pipeline failed. Check the stage logs."
        }
        always {
            sh 'docker image prune -f || true'
        }
    }
}