import TelegramBot from 'node-telegram-bot-api'

export class BotController {
    constructor(private token?: string) {}

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

    private addListeners(): void {
        this.bot.on('message', (message) => {
            const { text } = message
            const command = text.split(' ')[0]

            switch (command) {
                case '/start':
                    this.chatIds.add(message.chat.id)
                    break
                case '/stop':
                    this.chatIds.delete(message.chat.id)
                    break
                case '/join':
                    // eslint-disable-next-line no-case-declarations
                    const formattedMessage = text.split(' ')

                    if (formattedMessage.length != 3 || formattedMessage[1] !== 'as') {
                        this.bot.sendMessage(
                            message.chat.id,
                            "/join wrong username, please follow pattern: 'as {{ github_username }}'",
                        )
                        return
                    }

                    this.users.set(message.from.username, formattedMessage[2])
                    this.bot.sendMessage(
                        message.chat.id,
                        `@${message.from.username} successfully joined as ${formattedMessage[2]}.`,
                    )
                    break
                case '/leave':
                    this.users.delete(message.from.username)
                    this.bot.sendMessage(message.chat.id, `@${message.from.username} successfully left.`)
                    break
            }
        })
    }

    private static getToken(): string {
        return process.env.NOTIFICATION_BOT_CONFIG && JSON.parse(process.env.NOTIFICATION_BOT_CONFIG)?.auth_token
    }

    private bot: TelegramBot = null
    private chatIds: Set<number> = new Set<number>()
    private users: Map<string, string> = new Map<string, string>()
}
