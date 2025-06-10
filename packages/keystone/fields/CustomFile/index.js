const { File } = require('@keystonejs/fields')

const { CustomFile } = require('./Implementation')

module.exports = {
    type: 'CustomFile',
    implementation: CustomFile,
    views: File.views,
    adapters: File.adapters,
}
