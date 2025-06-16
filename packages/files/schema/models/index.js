const { CondoFile } = require('./CondoFile')
const { FileMiddlewareTests } = require('./file.test')

const getFileModels = () => {
    return { CondoFile }
}

module.exports = {
    getFileModels,
    FileMiddlewareTests,
}
