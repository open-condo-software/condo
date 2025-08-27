const { Keystone: DefaultKeystone } = require('@open-keystone/keystone')
const { GraphQLScalarType, GraphQLError } = require('graphql')
const Upload = require('graphql-upload/Upload.js')

const { _patchResolverWithGQLContext } = require('../utils/resolvers')


const CustomFileScalar = new GraphQLScalarType({
    name: 'Upload',
    description: 'File, that could be loaded through new file server or by legacy way',
    parseValue (value) {
        if (value instanceof Upload) return value.promise
        return value
    },
    parseLiteral (node) {
        throw new GraphQLError('Upload literal unsupported.', { nodes: node })
    },
    serialize () {
        throw new GraphQLError('Upload serialization unsupported.')
    },
})


class Keystone extends DefaultKeystone {
    getResolvers ({ schemaName }) {
        const originalResolvers = super.getResolvers({ schemaName })

        return _patchResolverWithGQLContext({ ...originalResolvers, Upload: CustomFileScalar })
    }
}

module.exports = {
    Keystone,
}
