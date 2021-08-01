import { Octokit } from '@octokit/core'
const octokit = new Octokit({
    auth: process.env.NOTIFICATION_BOT_CONFIG && JSON.parse(process.env.NOTIFICATION_BOT_CONFIG)?.github_auth_key
})
const AVAILABLE_TASK_TYPES = ['SBERDOMA']

export const getPullRequestMessage = (link, userName, users) => (`
******************************
Pull request opened.
Author: ${userName}.
${users.map(([userName]) => `@${userName}`).join(', ')}
Link: ${link}.
******************************
`)

export const getFormattedCommits = (commits) => {
    const formattedCommit = commits
        .map(({ message }) => {
            const [task_number] = message.split(' ')
            return task_number
        })
        .filter((task_number) => {
            const [taskType] = task_number.split('-')

            return AVAILABLE_TASK_TYPES.includes(taskType)
        })

    return Array.from(new Set<string>(formattedCommit))
        .sort((leftCommit, rightCommit) => {
            const [, leftCommitNumber] = leftCommit.split('-')
            const [, rightCommitNumber] = rightCommit.split('-')

            return Number(leftCommitNumber) > Number(rightCommitNumber) ? 1 : -1
        }).map((commit) => {
            return `https://doma.atlassian.net/browse/${commit}`
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

export const getCommitsFromRange = async (lastCommitSha: string, firstCommitSha?: string) => {
    const commitsList = []

    let isLastCommitFound = false
    let isFirstCommitFound = false

    let page = 1

    if (firstCommitSha) {
        while (!isLastCommitFound && !isFirstCommitFound) {
            const response = await fetchCommitsList(page, 100)

            response.data.forEach(({ sha, commit }) => {
                if (sha === firstCommitSha) {
                    isFirstCommitFound = true
                }

                if (isFirstCommitFound && !isLastCommitFound) {
                    if (sha !== lastCommitSha) {
                        commitsList.push(commit)
                    } else {
                        commitsList.push(commit)
                        isLastCommitFound = true
                    }
                }
            })

            page++
        }
    } else {
        while (!isLastCommitFound) {
            const response = await fetchCommitsList(page, 100)

            response.data.forEach(({ sha, commit }) => {
                if (sha !== lastCommitSha) {
                    commitsList.push(commit)
                } else {
                    commitsList.push(commit)
                    isLastCommitFound = true
                }
            })

            page++
        }
    }

    return getFormattedCommits(commitsList)
}