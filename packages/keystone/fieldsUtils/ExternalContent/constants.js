// WARNING: Changing this value requires database migration!
// Field name for ExternalContent application-level metadata
// Presence of this field indicates the object is ExternalContent file metadata
// Cloud adapters won't overwrite this field since they only add _meta
const EXTERNAL_CONTENT_FIELD_TYPE_META = '_externalContentFieldTypeMeta'

module.exports = {
    EXTERNAL_CONTENT_FIELD_TYPE_META,
}
