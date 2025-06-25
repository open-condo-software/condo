const { File } = require('@open-keystone/fields')

const { FileWithUTF8Name } = require('./Implementation')

module.exports = {
    type: 'FileWithUTF8Name',
    implementation: FileWithUTF8Name,
    views: File.views,
    adapters: File.adapters,
}