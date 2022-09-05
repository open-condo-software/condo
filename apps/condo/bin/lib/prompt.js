const cin = process.stdin
const cout = process.stdout

/**
 * Allows to input single/multi line text from keyboard within scripts.
 * @param messsage
 * @param multiLine
 * @param defaultValue
 * @returns {Promise<unknown>}
 */
function prompt (messsage, multiLine, defaultValue = ''){
    return new Promise((resolve) => {
        cout.write(messsage)
        cin.setEncoding('utf8')

        let buf = []

        const singleLineHandler = (val) => {
            cin.pause()
            resolve(val.slice(0, -1) || defaultValue)
        }
        const multiLineHandler = (val) => {
            if ('\n' == val || '\r\n' == val) {
                cin.pause()
                cin.removeAllListeners('data')
                resolve(buf.length ? buf.join('\n') : defaultValue)
                buf = null
            } else {
                buf.push(val.slice(0, -1))
            }
        }

        if (multiLine) {
            cin.on('data', multiLineHandler).resume()
        } else {
            cin.once('data', singleLineHandler).resume()
        }
    })
}

module.exports = {
    prompt,
}