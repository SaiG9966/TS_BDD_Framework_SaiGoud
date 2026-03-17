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
    booleanParam(
      name: 'FAIL_BUILD_ON_TEST_FAILURE',
      defaultValue: false,
      description: 'If false, build is marked UNSTABLE (not FAILED) when tests fail'
    )
  }

  environment {
    FRAMEWORK_DIR = 'playwright-bdd-framework'
    CI = 'true'
    BROWSER = 'chromium'
    HEADLESS = 'true'
    RETRY = '2'
    PARALLEL = '1'
    MAXIMIZE_BROWSER = 'false'
    SLOW_MO = '0'
    HIGHLIGHT_ELEMENTS = 'true'
    ALLOW_MANUAL_VERIFICATION = 'false'
    PRACTICE_FORM_PICTURE = 'picture.png'
    SCREENSHOT_ON_FAILURE = 'true'
    ATTACH_SCREENSHOTS = 'true'
    RECORD_VIDEO = 'true'
    PRACTICE_FORM_URL = 'https://demoqa.com/automation-practice-form'
    BASIC_CONTROLS_URL = 'https://www.hyrtutorials.com/p/basic-controls.html'
    PLAYWRIGHT_INSTALL_BROWSERS = 'chromium'
    PLAYWRIGHT_BROWSERS_PATH = '0'
    SKIP_PLAYWRIGHT_INSTALL = 'true'
    TEST_EXIT_CODE = '0'
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
      steps {
        script {
          if (isUnix()) {
            sh "cd ${env.FRAMEWORK_DIR} && cp -f .env.example .env"
            if (params.RUN_SETUP) {
              sh "cd ${env.FRAMEWORK_DIR} && npm run setup"
            } else {
              sh "cd ${env.FRAMEWORK_DIR} && npm ci"
            }
          } else {
            bat """
              @echo on
              cd /d %WORKSPACE%\\${env.FRAMEWORK_DIR}
              copy /Y .env.example .env
            """
            if (params.RUN_SETUP) {
              bat """
                @echo on
                cd /d %WORKSPACE%\\${env.FRAMEWORK_DIR}
                npm run setup
              """
            } else {
              bat """
                @echo on
                cd /d %WORKSPACE%\\${env.FRAMEWORK_DIR}
                npm ci
              """
            }
          }
        }
      }
    }

    stage('Run Tests') {
      steps {
        script {
          def extra = params.EXTRA_ARGS?.trim()
          def cmd = "npm run ${params.TEST_COMMAND}" + (extra ? " -- ${extra}" : "")
          int exitCode = 0

          if (isUnix()) {
            exitCode = sh(
              script: "cd ${env.FRAMEWORK_DIR} && ${cmd}",
              returnStatus: true
            )
          } else {
            exitCode = bat(
              script: """
                @echo on
                cd /d %WORKSPACE%\\${env.FRAMEWORK_DIR}
                ${cmd}
                exit /b %errorlevel%
              """,
              returnStatus: true
            )
          }

          env.TEST_EXIT_CODE = exitCode.toString()
          if (exitCode != 0) {
            echo "Tests finished with non-zero exit code: ${exitCode}. Continuing to report generation."
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

    stage('Finalize Build Result') {
      steps {
        script {
          if ((env.TEST_EXIT_CODE ?: '0') != '0') {
            if (params.FAIL_BUILD_ON_TEST_FAILURE) {
              error("Test stage failed with exit code ${env.TEST_EXIT_CODE}")
            }

            currentBuild.result = 'UNSTABLE'
            echo "Tests failed with exit code ${env.TEST_EXIT_CODE}. Marking build as UNSTABLE as configured."
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