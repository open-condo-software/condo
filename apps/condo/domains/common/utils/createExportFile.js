const path = require('path')
const { Duplex } = require('stream')
const { Readable } = require('stream')

const carbone = require('carbone')

const FileAdapter = require('@open-condo/keystone/fileAdapter/fileAdapter')
const { generateUUIDv4 } = require('@open-condo/miniapp-utils')

const { EXCEL, DOCX } = require('@condo/domains/common/constants/export')


const EXCEL_FILE_META = {
    mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    encoding: 'UTF-8',
}

const DOCX_FILE_META = {
    mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    encoding: 'UTF-8',
}

const SUPPORTED_FILE_FORMATS = [EXCEL, DOCX]

const FILE_META_BY_FORMATS = {
    [EXCEL]: EXCEL_FILE_META,
    [DOCX]: DOCX_FILE_META,
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
// The default format is "excel"
// @deprecated use `buildExportFile` like in `apps/condo/domains/ticket/tasks/exportTicketsTask.js`
async function createExportFile ({ fileName, templatePath, replaces, meta, format = EXCEL }) {
    if (!SUPPORTED_FILE_FORMATS.includes(format)) throw new Error('Unexpected file format')

    // templatePath is a configured template path - not a user input
    // all results of export file generation will be accessible only for authorized end users
    // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
    const fileContent = await render(path.resolve(templatePath), replaces)
    const ExportFileAdapter = new FileAdapter('export')
    const buffer = new Duplex()
    buffer.push(fileContent)
    buffer.push(null)
    const id = generateUUIDv4()
    // TODO(zuch): add mime types and encoding detector from template
    // mimetype: 'application/vnd.oasis.opendocument.spreadsheet', - for ods
    const fileInfo = await ExportFileAdapter.save({
        stream: buffer,
        id,
        filename: fileName,
        meta,
        ...FILE_META_BY_FORMATS[format],
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
    // all results of export file generation will be accessible only for authorized end users
    // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
    const content = await render(path.resolve(templatePath), replaces, options)
    const stream = Readable.from(content)
    return { stream }
}

module.exports = {
    EXCEL_FILE_META,
    DOCX_FILE_META,
    createExportFile,
    buildExportFile,
    render,
}
