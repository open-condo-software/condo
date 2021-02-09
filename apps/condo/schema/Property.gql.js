const { genTestGQLUtils } = require('@core/keystone/gen.gql.utils')

const PROPERTY_FIELDS = '{ id dv sender organization { id name } name type address addressMeta map v deletedAt newId createdBy { id name } updatedBy { id name } createdAt updatedAt }'
const Property = genTestGQLUtils('Property', PROPERTY_FIELDS)

module.exports = {
    Property,
}
