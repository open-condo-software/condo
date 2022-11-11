require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const app = express()

const { CondoBicryptSign } = require('@open-condo/bicrypt')
const { passPhrase, keyPath } = process.env.BICRYPT ? JSON.parse(process.env.BICRYPT) : {}

const bicryptSign = new CondoBicryptSign({ passPhrase, keyPath })

app.use(bodyParser.json({ limit: '100mb', extended: true }))

app.post('/sign', async (req, res) => {
    const xml = req.body.xml
    const result = await bicryptSign.sign(xml, false)
    const { signature, xml: canonicalXml } = result
    console.log('RESULT:', signature, canonicalXml)
    return res.json({
        signature,
        xml: canonicalXml,
    })
})

app.listen(7777)