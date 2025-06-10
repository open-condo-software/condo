const { generateGqlQueries } = require('@open-condo/codegen/generate.gql')

const COMMON_FIELDS = 'id dv sender { dv fingerprint } v deletedAt newId createdBy { id name } updatedBy { id name } createdAt updatedAt'

const CONDO_FILE_FIELDS = `{ file { id originalFilename publicUrl mimetype } ${COMMON_FIELDS} }`

const CondoFile = generateGqlQueries('CondoFile', CONDO_FILE_FIELDS)

module.exports = {
    CondoFile,
}
