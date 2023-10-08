const { adminDocPreprocessor } = require('./adminDoc')
const { customAccessPostProcessor } = require('./customAccess')
const { escapeSearchPreprocessor } = require('./escapeSearch')
const { schemaDocPreprocessor } = require('./schemaDoc')

module.exports = {
    adminDocPreprocessor,
    customAccessPostProcessor,
    escapeSearchPreprocessor,
    schemaDocPreprocessor,
}