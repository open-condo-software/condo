require('dotenv').config()

import TelegramBot from 'node-telegram-bot-api'
import express from 'express'
import cors from 'cors'

const app = express()

const token = process.env.NOTIFICATION_BOT_CONFIG && JSON.parse(process.env.NOTIFICATION_BOT_CONFIG)?.auth_token
const tgBot = new TelegramBot(token, { polling: true })

let chatId = null

tgBot.on('message', message => {
    const { text, chat } = message

    switch (text) {
        case '/start':
            chatId = chat.id
            break
        case '/stop':
            chatId = null
            break
    }
})

const getMessage = (link, userName) => (`
******************************
Pull request opened.
Author: ${userName}.
Link: ${link}.
******************************
`)

const notifyPullRequestOpened = (payload) => {
    if (!chatId || payload?.action !== 'opened') {
        return
    }

    const pullRequest = payload?.pull_request

    if (!pullRequest) {
        return
    }

    tgBot.sendMessage(chatId, getMessage(pullRequest._links.html.href, pullRequest.user.login))
}

app.use(express.json())
app.use(cors())

app.post('/pullRequestUpdate/', (req, res) => {
    notifyPullRequestOpened(req.body)
    res.send()
})

// get from env
app.listen(5000, () => {
    console.log('listening on 5000')
})
