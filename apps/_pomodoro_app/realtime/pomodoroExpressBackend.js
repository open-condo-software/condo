const express = require('express')
const bodyParser = require('body-parser')

const {generateLink} = require('./application/utils')

async function prepareBackApp (store) {
    const app = express()

    app.use(bodyParser.json())

    app.post('/get-timer', (req, res) => {
        res.setHeader('Content-Type', 'application/json')

        if (req.body !== undefined) {

            const timerId = generateLink()

            try {
                const dataObj = {
                    breakTime: parseInt(req.body.break),
                    bigBreakTime: parseInt(req.body.bigBreak),
                    workTimeTime: parseInt(req.body.workTime)
                }

                store.setEntityById(timerId, dataObj)

                res.send(JSON.stringify({
                    id:timerId,
                    data: dataObj
                }))
            } catch (e) {
                res.status(400).send(JSON.stringify({
                    detail:'Request body was bad ' + e,
                }))
            }
        } else {
            res.status(400).send(JSON.stringify({
                detail:'Request body was not specified',
            }))
        }
    })

    return app
}

module.exports = prepareBackApp
