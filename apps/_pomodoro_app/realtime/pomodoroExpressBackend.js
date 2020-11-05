const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')

const createRandomWord = require('./application/utils/createRandomWord')

async function prepareBackApp (store) {
    const app = express()

    app.use(cors())
    app.use(bodyParser.json())

    app.post('/get-timer', (req, res) => {
        res.setHeader('Content-Type', 'application/json')

        if (req.body !== undefined) {
            const timerId = createRandomWord(5) + '-' + createRandomWord(5)

            try {
                const dataObj = {
                    breakTime: parseInt(req.body.break),
                    bigBreakTime: parseInt(req.body.bigBreak),
                    workTimeTime: parseInt(req.body.workTime),
                }

                store.setEntityById(timerId, dataObj)

                res.send(
                    JSON.stringify({
                        id: timerId,
                        data: dataObj,
                    })
                )
            } catch (e) {
                res.status(400).send(
                    JSON.stringify({
                        detail: 'Request body was bad ' + e,
                    })
                )
            }
        } else {
            res.status(400).send(
                JSON.stringify({
                    detail: 'Request body was not specified',
                })
            )
        }
    })

    return app
}

module.exports = prepareBackApp
