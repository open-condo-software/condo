const { File } = require('@open-keystone/fields')

const { CustomFile } = require('./Implementation')

module.exports = {
    type: 'File',
    implementation: CustomFile,
    views: File.views,
    adapters: File.adapters,
}
