pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '20'))
    timeout(time: 90, unit: 'MINUTES')
  }

  parameters {
    choice(
      name: 'TEST_COMMAND',
      choices: ['test', 'test:smoke', 'test:regression', 'test:wip', 'test:report:no-open'],
      description: 'NPM script to run inside playwright-bdd-framework'
    )
    string(
      name: 'EXTRA_ARGS',
      defaultValue: '',
      description: 'Optional extra args after -- (example: --tags @smoke)'
    )
    booleanParam(
      name: 'RUN_SETUP',
      defaultValue: true,
      description: 'Run npm run setup before test execution'
    )
    booleanParam(
      name: 'GENERATE_REPORTS',
      defaultValue: true,
      description: 'Try generating Allure + Cucumber HTML reports after tests'
    )
  }

  environment {
    FRAMEWORK_DIR = 'playwright-bdd-framework'
    CI = 'true'
    BROWSER = 'chromium'
    PLAYWRIGHT_INSTALL_BROWSERS = 'chromium'
    PLAYWRIGHT_BROWSERS_PATH = '0'
    SKIP_PLAYWRIGHT_INSTALL = 'true'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Tooling Check') {
      steps {
        script {
          if (isUnix()) {
            sh '''
              node -v
              npm -v
              java -version || true
            '''
          } else {
            bat '''
              @echo on
              node -v
              npm -v
              java -version || exit /b 0
            '''
          }
        }
      }
    }

    stage('Install / Setup') {
      when {
        expression { return params.RUN_SETUP }
      }
      steps {
        script {
          if (isUnix()) {
            sh "cd ${env.FRAMEWORK_DIR} && npm run setup"
          } else {
            bat """
              @echo on
              cd /d %WORKSPACE%\\${env.FRAMEWORK_DIR}
              npm run setup
            """
          }
        }
      }
    }

    stage('Run Tests') {
      steps {
        script {
          def extra = params.EXTRA_ARGS?.trim()
          def cmd = "npm run ${params.TEST_COMMAND}" + (extra ? " -- ${extra}" : "")

          if (isUnix()) {
            sh "cd ${env.FRAMEWORK_DIR} && ${cmd}"
          } else {
            bat """
              @echo on
              cd /d %WORKSPACE%\\${env.FRAMEWORK_DIR}
              ${cmd}
            """
          }
        }
      }
    }

    stage('Generate Reports (non-blocking)') {
      when {
        expression { return params.GENERATE_REPORTS }
      }
      steps {
        script {
          try {
            if (isUnix()) {
              sh "cd ${env.FRAMEWORK_DIR} && npm run report:generate"
              sh "cd ${env.FRAMEWORK_DIR} && npm run cucumber:report:generate"
            } else {
              bat """
                @echo on
                cd /d %WORKSPACE%\\${env.FRAMEWORK_DIR}
                call npm run report:generate
                call npm run cucumber:report:generate
              """
            }
          } catch (err) {
            echo "Report generation skipped/failed: ${err}"
          }
        }
      }
    }
  }

  post {
    always {
      archiveArtifacts(
        artifacts: 'playwright-bdd-framework/allure-results/**/*,playwright-bdd-framework/allure-report/**/*,playwright-bdd-framework/reports/**/*,playwright-bdd-framework/test-results/**/*',
        allowEmptyArchive: true,
        fingerprint: true
      )
    }

    success {
      echo 'Jenkins run completed successfully.'
    }

    failure {
      echo 'Jenkins run failed. Check stage logs and archived artifacts.'
    }
  }
}