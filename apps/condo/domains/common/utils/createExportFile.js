const path = require('path')
const { Duplex } = require('stream')
const { Readable } = require('stream')

const carbone = require('carbone')
const { v4: uuid } = require('uuid')

const FileAdapter = require('./fileAdapter')

const EXCEL_FILE_META = {
    mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    encoding: 'UTF-8',
}

const render = (pathToTemplate, replaces, options = {}) => new Promise((resolve, reject) => {
    carbone.render(pathToTemplate, replaces, options, (err, result) => {
        if (err) {
            return reject(err)
        } else {
            return resolve(result)
        }
    })
})

// This function uses file saving apart from internal working of `File` field in Keystone schema
// It makes unable to save data to `File` field server-side
// @deprecated use `buildExportFile` like in `apps/condo/domains/ticket/tasks/exportTicketsTask.js`
async function createExportFile ({ fileName, templatePath, replaces, meta }) {
    // templatePath is a configured template path - not a user input
    // all results of export file generation will be accessible only for authorized end users
    // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
    const fileContent = await render(path.resolve(templatePath), replaces)
    const ExportFileAdapter = new FileAdapter('export')
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
        ...EXCEL_FILE_META,
    })
    const { filename } = fileInfo
    const url = ExportFileAdapter.publicUrl({ filename })
    return { url, fileInfo }
}

/**
 * Only builds file content and supposes that it will be saved somewhere
 * TODO(antonal): make this function to work with many formats, not only Excel
 * @param templatePath path to Excel file template
 * @param replaces
 * @param options
 * @return {Promise<{ stream }>}
 */
async function buildExportFile ({ templatePath, replaces, options }) {
    const content = await render(path.resolve(templatePath), replaces, options)
    const stream = Readable.from(content)
    return { stream }
}

module.exports = {
    EXCEL_FILE_META,
    createExportFile,
    buildExportFile,
    render,
}
