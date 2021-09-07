import TelegramBot from 'node-telegram-bot-api'

import { getFormattedTasks, getDoneTasksFromRange, getJiraFormattedTasks } from './utils'
import JiraApi from 'jira-client'

type HandleReleaseReportOptions = {
    simple: boolean
}

export class BotController {
    constructor(private jiraApi: JiraApi, private token?: string) {
        const initialUsers =
            process.env.NOTIFICATION_BOT_CONFIG && JSON.parse(process.env.NOTIFICATION_BOT_CONFIG)?.intitial_listeners

        if (initialUsers) {
            this.users = new Map(Object.entries(initialUsers))
        }
    }

    public init(): void {
        const token = this.token || BotController.getToken()
        this.bot = new TelegramBot(token, { polling: true })
        this.addListeners()
    }

    public sendMessage(message: string): void {
        this.chatIds.forEach((id) => {
            this.bot.sendMessage(id, message)
        })
    }

    public getUsers(): Array<[string, string]> {
        return Array.from(this.users)
    }

    private addListeners() {
        this.bot.on('message', async (message) => {
            const { text } = message
            const command = text.split(' ')[0]

            switch (command) {
                case '/start':
                    this.handleStart(message)
                    break
                case '/stop':
                    this.handleStop(message)
                    break
                case '/join':
                    await this.handleJoin(message)
                    break
                case '/create_release_report':
                    await this.handleCreateReleaseReport(message, { simple: false })
                    break
                case '/create_simple_release_report':
                    await this.handleCreateReleaseReport(message, { simple: true })
                    break
                case '/list_active_listeners':
                    await this.listActiveListeners(message)
                    break
                case '/leave':
                    await this.handleLeave(message)
                    break
            }
        })
    }

    private handleStart(message) {
        this.chatIds.add(message.chat.id)
    }

    private handleStop(message) {
        this.chatIds.delete(message.chat.id)
    }

    private async listActiveListeners(message) {
        const users = this.getUsers()

        if (!users.length) {
            await this.bot.sendMessage(message.chat.id, 'No listeners found')
            return
        }

        const listeners = users.map(([userName]) => `@${userName}`).join(', ')

        await this.bot.sendMessage(message.chat.id, `Active listeners ${listeners}`)
    }

    private async handleJoin(message) {
        const { text } = message
        const formattedMessage = text.split(' ')

        if (formattedMessage.length != 3 || formattedMessage[1] !== 'as') {
            await this.bot.sendMessage(message.chat.id, "/join wrong username, please follow pattern: 'as {{ github_username }}'")
            return
        }

        const userName = formattedMessage[2]

        this.users.set(message.from.username, userName)
        await this.bot.sendMessage(message.chat.id, `@${message.from.username} successfully joined as ${userName}.`)
    }

    private async handleCreateReleaseReport(message, options: HandleReleaseReportOptions) {
        const { text } = message
        const { simple } = options

        const args = text.split(' ')

        if (args.length < 2) {
            await this.bot.sendMessage(message.chat.id, 'sha was not provided')
            return
        }

        const lastCommitSha = args[1]
        const firstCommitSha = args[2]

        const taskIds = await getDoneTasksFromRange(lastCommitSha, firstCommitSha)

        const formattedTasks = simple ? getFormattedTasks(taskIds) : await getJiraFormattedTasks(taskIds, this.jiraApi)

        this.bot.sendMessage(message.chat.id, formattedTasks.join('\n'), { parse_mode: 'Markdown' }).catch((e) => {
            const errorMessage = e.message.split(': ')[2]
            if (errorMessage === 'message is too long') {
                this.bot.sendMessage(message.chat.id, 'Не так много!')
            } else {
                this.bot.sendMessage(message.chat.id, 'Что то пошло не так, повторите попытку.')
            }
        })
    }

    private async handleLeave(message) {
        this.users.delete(message.from.username)
        await this.bot.sendMessage(message.chat.id, `@${message.from.username} successfully left.`)
    }

    private static getToken(): string {
        return process.env.NOTIFICATION_BOT_CONFIG && JSON.parse(process.env.NOTIFICATION_BOT_CONFIG)?.auth_token
    }

    private bot: TelegramBot = null
    private chatIds: Set<number> = new Set<number>()
    private users: Map<string, string> = new Map<string, string>()
}
