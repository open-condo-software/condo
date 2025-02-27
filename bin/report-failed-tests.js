const path = require('path')

const fetch = require('node-fetch')
const { pushTimeseries } = require('prometheus-remote-write')

const REPO_ROOT = path.join(__dirname, '..')
const PROMETHEUS_REMOTE_WRITE_URL = process.env.PROMETHEUS_RW_SERVER_URL
const PROMETHEUS_AUTH_USER = process.env.PROMETHEUS_USER
const PROMETHEUS_AUTH_PASSWORD = process.env.PROMETHEUS_PASSWORD
const RUNTIME_REF_NAME = process.env.GH_REF_NAME || 'local'
const BATCH_SIZE = 10

/** @implements {import('@jest/reporters').Reporter} */
class PrometheusReporter {
    #config = null

    constructor () {
        if (PROMETHEUS_REMOTE_WRITE_URL && PROMETHEUS_AUTH_USER && PROMETHEUS_AUTH_PASSWORD) {
            this.#config = {
                url: PROMETHEUS_REMOTE_WRITE_URL,
                auth: {
                    username: PROMETHEUS_AUTH_USER,
                    password: PROMETHEUS_AUTH_PASSWORD,
                },
                fetch,
                labels: {
                    __name__: 'ci_failed_test',
                    ref: RUNTIME_REF_NAME,
                },
            }
        }
    }

    /**
     * @param {string} testName
     * @param {string} testPath
     * @param {number} timestamp
     */
    async #reportFailedTest ({ testName, testPath, timestamp }) {
        if (this.#config) {
            await pushTimeseries({
                labels: {
                    test_name: testName,
                    test_file: testPath,
                },
                samples: [
                    { value: 1, timestamp },
                ],
            }, this.#config)
        }
    }

    /**
     * @param {Set<import('@jest/reporters').TestContext>} testContexts
     * @param {import('@jest/reporters').AggregatedResult} runResults
     */
    async onRunComplete (
        testContexts,
        runResults
    ) {

        /**
         * @type {Array<{ testName: string, testPath: string, timestamp: number }>}
         */
        const failedTests = []

        if (runResults.numFailedTests === 0) {
            return
        }

        for (const testFileResult of runResults.testResults) {
            if (testFileResult.numFailingTests === 0) {
                continue
            }

            const absoluteTestFilePath = testFileResult.testFilePath
            const testFilePath = path.relative(REPO_ROOT, absoluteTestFilePath)
            const fileEndTimestamp = testFileResult.perfStats.end

            for (const assertionResult of testFileResult.testResults) {
                if (assertionResult.status === 'failed') {
                    const testNameParts = [...assertionResult.ancestorTitles, assertionResult.title]
                    // Clean tabulation / spaces and join
                    const testFullName = testNameParts
                        .map(part => part.replace(/\s+/g, ' '))
                        .join(' > ')
                    failedTests.push({
                        testName: testFullName,
                        testPath: testFilePath,
                        timestamp: fileEndTimestamp,
                    })
                }
            }
        }

        for (let startIdx = 0; startIdx < failedTests.length; startIdx += BATCH_SIZE) {
            const endIdx = Math.min(startIdx + BATCH_SIZE, failedTests.length)
            const batch = failedTests.slice(startIdx, endIdx)

            await Promise.allSettled(batch.map(test => this.#reportFailedTest({
                testName: test.testName,
                testPath: test.testPath,
                timestamp: test.timestamp,
            })))
        }
    }
}

module.exports = PrometheusReporter