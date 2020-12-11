const { genTestGQLUtils } = require('@core/keystone/gen.gql.utils')

const LIBRARY_FIELDS = '{ id organization { id name } name description }'
const Library = genTestGQLUtils('Library', LIBRARY_FIELDS)

module.exports = {
    Library,
}
