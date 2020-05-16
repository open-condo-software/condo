const http = require('http')
const { prepareBackApp, prepareBackServer } = require('./multi-server')
const port = parseInt(process.env.PORT || '3005')

async function initServer (port) {
    const app = await prepareBackApp()
    app.set('port', port)
    const server = http.createServer(app)
    await prepareBackServer(server)
    return server.listen(port)
}

module.exports = {
    start: () => initServer()
};
