const carbone = require('carbone')
const FileAdapter = require('./fileAdapter')
const { Duplex } = require('stream')
const path = require('path')
const { v4: uuid } = require('uuid')

const EXPORTED_FILE_META = {
    mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    encoding: 'UTF-8',
}

const render = (pathToTemplate, replaces) => new Promise((resolve, reject) => {
    carbone.render(pathToTemplate, replaces, (err, result) => {
        if (err) {
            return reject(err)
        } else {
            return resolve(result)
        }
    })
})

// This function uses file saving apart from internal working of `File` field in Keystone schema
// It makes unable to save data to `File` field server-side
// @deprecated
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
        ...EXPORTED_FILE_META,
    })
    const { filename } = fileInfo
    const url = ExportFileAdapter.publicUrl({ filename })
    return { url, fileInfo }
}

/**
 * Only builds file content and supposes that it will be saved somewhere
 * TODO(antonal): make this function to work with many formats, not only Excel
 * @param templatePath - path to Excel file template
 * @param replaces
 * @param meta
 * @return {Promise<{meta: {mimetype: string, encoding: string}, content: unknown}>}
 */
async function buildExportFile ({ templatePath, replaces, meta }) {
    const content = await render(path.resolve(templatePath), replaces)

    // NOTE: it seems like in case of saving value to `File` field we should use GraphQL `Upload` type and code equivalent to commented below will be executed internally in Keystone `File` field
    // const result = await ExportFileAdapter.save({
    //     stream: buffer,
    //     id,
    //     filename: fileName,
    //     meta,
    //     ...EXPORTED_FILE_META,
    // })
    // const { filename } = result

    // TODO(antonal): Remove this hack later as a way to pass value to `File` field in case of Keystone standard LocalFileAdapter will be figured out
    // Natural way is to pass result of `FileAdapter.save` into `File` field, but LocalFileAdapter (from Keystone)
    // returns object with only `{ id, filename }` fields.
    // Actual data, saved into database is following:
    // ```
    // {
    //   "id": "cl46pgw9m002qjyt6elkzgz5h",
    //   "encoding": "7bit",
    //   "filename": "cl46pgw9m002qjyt6elkzgz5h-NAD-M50.2-Rear-1-e1539984214456.jpg",
    //   "mimetype": "image/jpeg",
    //   "originalFilename": "NAD-M50.2-Rear-1-e1539984214456.jpg"
    // }
    // ```

    // Following data passed into `File` field in case of LocalFileAdapter causes following error:
    // > GraphQLError [Object]: Variable "$data" got invalid value { filename: "278cc130-9ba4-44a8-b1e1-7c77220bc07d-tickets_09_06.xlsx", id: "278cc130-9ba4-44a8-b1e1-7c77220bc07d", mimetype: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", encoding: "UTF-8", originalFilename: "tickets_09_06.xlsx" } at "data.file"; Upload value invalid.
    // ```
    // {
    //   id: "278cc130-9ba4-44a8-b1e1-7c77220bc07d",
    //   encoding: "UTF-8",
    //   filename: "278cc130-9ba4-44a8-b1e1-7c77220bc07d-tickets_09_06.xlsx",
    //   mimetype: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    //   originalFilename: "tickets_09_06.xlsx"
    // }

    return {
        meta: EXPORTED_FILE_META,
        content,
    }
}


module.exports = {
    createExportFile,
    buildExportFile,
}
