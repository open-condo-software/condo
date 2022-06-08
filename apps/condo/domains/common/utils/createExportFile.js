const carbone = require('carbone')
const FileAdapter = require('./fileAdapter')
const { Duplex } = require('stream')
const path = require('path')
const { v4: uuid } = require('uuid')

const render = (pathToTemplate, replaces) => new Promise((resolve, reject) => {
    carbone.render(pathToTemplate, replaces, (err, result) => {
        if (err) {
            return reject(err)
        } else {
            return resolve(result)
        }
    })
})

async function createExportFile ({ fileName, templatePath, replaces, meta }) {
    const ExportFileAdapter = new FileAdapter('export')
    const fileContent = await render(path.resolve(templatePath), replaces)
    const buffer = new Duplex()
    buffer.push(fileContent)
    buffer.push(null)
    const id = uuid()
    // TODO(zuch): add mime types and encoding detector from template
    // mimetype: 'application/vnd.oasis.opendocument.spreadsheet', - for ods
    const fileInfo = await ExportFileAdapter.save({
        stream: buffer,
        id,
        filename: fileName,
        meta,
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        encoding: 'UTF-8',
    })
    const { filename } = fileInfo
    const url = ExportFileAdapter.publicUrl({ filename })
    return { url, fileInfo }
}

module.exports = {
    createExportFile,
}
