import { Octokit } from '@octokit/core'
import JiraApi from 'jira-client'
const octokit = new Octokit({
    auth: process.env.NOTIFICATION_BOT_CONFIG && JSON.parse(process.env.NOTIFICATION_BOT_CONFIG)?.github_auth_key,
})
const AVAILABLE_TASK_TYPES = ['SBERDOMA', 'DOMA']

export const getPullRequestMessage = (link, userName, users) => `
---------------------------------
${userName} opened a pull request.
${link}.
${users.map(([userName]) => `@${userName}`).join(', ')}
---------------------------------
`

const extractTasksFromCommits = (commits) => {
    const relevantCommits = commits
        .map(({ message }) => {
            const [task_number] = message.split(' ')
            return task_number
        })
        .filter((task_number) => {
            const [taskType] = task_number.split('-')

            return AVAILABLE_TASK_TYPES.includes(taskType)
        })

    const uniqueCommits = Array.from(new Set<string>(relevantCommits))

    return uniqueCommits
        .sort((leftCommit, rightCommit) => {
            const [, leftCommitNumber] = leftCommit.split('-')
            const [, rightCommitNumber] = rightCommit.split('-')

            return Number(leftCommitNumber) > Number(rightCommitNumber) ? 1 : -1
        })
        .map((task) => {
            return task
        })
}

const fetchCommitsList = async (page: number, per_page = 100) => {
    return await octokit.request('GET /repos/{owner}/{repo}/commits', {
        owner: 'open-condo-software',
        repo: 'condo',
        per_page,
        page,
    })
}

export const getDoneTasksFromRange = async (lastCommitSha: string, firstCommitSha?: string) => {
    const commitsList = []

    let isLastCommitFound = false
    let isFirstCommitFound = false

    let page = 1

    if (firstCommitSha) {
        while (!isLastCommitFound && !isFirstCommitFound) {
            const response = await fetchCommitsList(page, 100)

            if (response.data.length === 0) {
                break
            }

            response.data.forEach(({ sha, commit }) => {
                if (sha === firstCommitSha) {
                    isFirstCommitFound = true
                }

                if (isFirstCommitFound && !isLastCommitFound) {
                    if (sha === lastCommitSha) {
                        isLastCommitFound = true
                    }

                    commitsList.push(commit)
                }
            })

            page++
        }
    } else {
        while (!isLastCommitFound) {
            const response = await fetchCommitsList(page, 100)

            if (response.data.length === 0) {
                break
            }

            response.data.forEach(({ sha, commit }) => {
                if (!isLastCommitFound) {
                    if (sha === lastCommitSha) {
                        isLastCommitFound = true
                    }

                    commitsList.push(commit)
                }
            })

            page++
        }
    }

    return extractTasksFromCommits(commitsList)
}

/**
 * Formats jira task like SBERDOMA-1 to markdown without meta
 */
export const getFormattedTasks = (taskIds: Array<string>) => {
    return taskIds.map((taskId) => {
        return `[${taskId}](https://doma.atlassian.net/browse/${taskId})`
    })
}

/**
 * Formats jira tasks like SBERDOMA-1 to markdown with meta from Jira api
 */
export const getJiraFormattedTasks = async (taskIds: Array<string>, jiraApi: JiraApi) => {
    const formattedTasks = taskIds.map(async (taskId) => {
        try {
            const taskMeta = await jiraApi.findIssue(taskId)
            return `[${taskId}](https://doma.atlassian.net/browse/${taskId}): ${taskMeta.fields.summary}. ${taskMeta.fields.labels
                .map((x) => `\`${x}\``)
                .join(', ')}`
        } catch (e) {
            let msg = e.error
            if (msg.errorMessages) {
                msg = msg.errorMessages.join(', ')
            }
            return `Не смог получить: ${taskId}, Потому что: ${msg}`
        }
    })

    return await Promise.all(formattedTasks)
}
