const { genTestGQLUtils } = require('@core/keystone/gen.gql.utils')

const FUNCTION_FIELDS = '{ id owner { id } description markerplaceName isPublished language signature body }'
const Function = genTestGQLUtils('Function', FUNCTION_FIELDS)

module.exports = {
    Function,
}
