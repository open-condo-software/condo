const http = require('http')
const { prepareBackApp, prepareBackServer } = require('./multi-server')
const port = parseInt(process.env.PORT || '3000')

async function initServer (port) {
    const app = await prepareBackApp()
    app.set('port', port)
    const server = http.createServer(app)
    await prepareBackServer(server)
    return server.listen(port)
}

initServer(port).then(() => {
    console.log(`SERVER: ready on port ${port}`)
})
