const { FieldController } = require('@keystonejs/fields/Controller')



class FileController extends FieldController {
    serialize = data => {
        const { path } = this
        if (!data || !data[path]) {
            // Forcibly return null if empty string
            return null
        }
        return data[path]
    }
    getQueryFragment = () => `
    ${this.path} {
       id
       path
       filename
       originalFilename
       mimetype
       encoding
       publicUrl
    }
  `
    getFilterTypes = () => []
}


module.exports = FileController
