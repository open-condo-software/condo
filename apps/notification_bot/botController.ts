import TelegramBot from 'node-telegram-bot-api'
import { getCommitsFromRange } from './utils'

export class BotController {
    constructor (private token?: string) {
    }

    public init (): void {
        const token = this.token || BotController.getToken()
        this.bot = new TelegramBot(token, { polling: true })
        this.addListeners()
    }

    public sendMessage (message: string): void {
        this.chatIds.forEach((id) => {
            this.bot.sendMessage(id, message)
        })
    }

    public getUsers (): Array<[string, string]> {
        return Array.from(this.users)
    }

    private addListeners (): void {
        this.bot.on('message', (message) => {
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
                    this.handleJoin(message)
                    break
                case '/create_release_report':
                    this.handleCreateReleaseReport(message)
                    break
                case '/leave':
                    this.handleLeave(message)
                    break
            }
        })
    }

    private handleStart (message) {
        this.chatIds.add(message.chat.id)
    }

    private handleStop (message) {
        this.chatIds.delete(message.chat.id)
    }

    private handleJoin (message) {
        const { text } = message
        const formattedMessage = text.split(' ')

        if (formattedMessage.length != 3 || formattedMessage[1] !== 'as') {
            this.bot.sendMessage(message.chat.id, '/join wrong username, please follow pattern: \'as {{ github_username }}\'')
            return
        }

        const userName = formattedMessage[2]

        this.users.set(message.from.username, userName)
        this.bot.sendMessage(message.chat.id, `@${message.from.username} successfully joined as ${userName}.`)
    }

    private async handleCreateReleaseReport (message) {
        const { text } = message
        const formattedMessage = text.split(' ')

        if (formattedMessage.length < 2) {
            this.bot.sendMessage(message.chat.id, '/create_release_report sha was not provided')
            return
        }

        const lastCommitSha = formattedMessage[1]
        const firstCommitSha = formattedMessage[2]
        const commitsList = await getCommitsFromRange(lastCommitSha, firstCommitSha)

        this.bot.sendMessage(message.chat.id, commitsList.join('\n'))
            .catch((e) => {
                const errorMessage = e.message.split(': ')[2]
                if (errorMessage === 'message is too long') {
                    this.bot.sendMessage(message.chat.id, 'Не так много!')
                } else {
                    this.bot.sendMessage(message.chat.id, 'Что то пошло не так, повторите попытку.')
                }
            })
    }

    private handleLeave (message) {
        this.users.delete(message.from.username)
        this.bot.sendMessage(message.chat.id, `@${message.from.username} successfully left.`)
    }

    private static getToken (): string {
        return process.env.NOTIFICATION_BOT_CONFIG && JSON.parse(process.env.NOTIFICATION_BOT_CONFIG)?.auth_token
    }

    private bot: TelegramBot = null
    private chatIds: Set<number> = new Set<number>()
    private users: Map<string, string> = new Map<string, string>()
}
