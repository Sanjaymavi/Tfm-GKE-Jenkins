pipeline {
    agent {
        kubernetes {
            yamlFile 'kaniko-pod.yaml'
            defaultContainer 'kubectl'
        }
    }
    environment {
        PROJECT_ID   = ''
        REGION       = 'asia-south1'
        GAR_REPO     = 'jenkins-docker-repo'
        APP_NAME     = 'node-app'
        CLUSTER_NAME = 'jenkins-cluster'
        CLUSTER_ZONE = 'asia-south1-a'
        NAMESPACE    = 'default'

        IMAGE_TAG = "${BUILD_NUMBER}"
        IMAGE_URI = "${REGION}-docker.pkg.dev/${PROJECT_ID}/${GAR_REPO}/${APP_NAME}:${IMAGE_TAG}"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build & Push Image (Kaniko)') {
            steps {
                container('kaniko') {
                    sh '''
                    /kaniko/executor \
                      --dockerfile=Dockerfile \
                      --context=dir://$(pwd) \
                      --destination=$IMAGE_URI \
                      --verbosity=info
                    '''
                }
            }
        }

        stage('Connect to GKE') {
            steps {
                container('kubectl') {
                    sh '''
                    gcloud config set project $PROJECT_ID
                    gcloud container clusters get-credentials $CLUSTER_NAME --zone $CLUSTER_ZONE
                    '''
                }
            }
        }

        stage('Deploy Application') {
            steps {
                container('kubectl') {
                    sh '''
                    sed "s|IMAGE_PLACEHOLDER|$IMAGE_URI|g" node-app-deploy.yaml | kubectl apply -f -
                    kubectl apply -f service.yaml
                    '''
                }
            }
        }

        stage('Verify Deployment') {
            steps {
                container('kubectl') {
                    sh '''
                    kubectl rollout status deployment/$APP_NAME -n $NAMESPACE --timeout=180s
                    kubectl get pods -n $NAMESPACE
                    '''
                }
            }
        }
    }

    post {
        success {
            echo "SUCCESS: Image pushed -> ${IMAGE_URI}"
        }
        failure {
            echo "FAILED: Check logs"
        }
    }
}
