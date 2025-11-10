const { generateGqlQueries } = require('@open-condo/codegen/generate.gql')
const { generateGQLTestUtils } = require('@open-condo/codegen/generate.test.utils')

const { FILE_RECORD_ATTACHMENTS, FILE_RECORD_META_FIELDS } = require('../models/FileRecord')

const COMMON_FIELDS = 'id dv sender { dv fingerprint } v deletedAt newId createdBy { id name } updatedBy { id name } createdAt updatedAt'
const FILE_RECORD_FIELDS = `{ attachments ${FILE_RECORD_ATTACHMENTS} fileMeta ${FILE_RECORD_META_FIELDS} fileAdapter sourceApp fileSize fileMimeType user { id } organization { id } sourceFileRecord { id } ${COMMON_FIELDS} }`

const FileRecordGql = generateGqlQueries('FileRecord', FILE_RECORD_FIELDS)

const FileRecord = generateGQLTestUtils(FileRecordGql)

module.exports = { FileRecord }
