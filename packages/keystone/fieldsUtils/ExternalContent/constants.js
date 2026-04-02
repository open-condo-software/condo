// WARNING: Changing this value requires database migration!
// All existing file-meta objects in the database have _type set to this value.
// If you change it, you must migrate all existing records to use the new value.
const FILE_META_TYPE = 'ExternalContent.file-meta'

// Default batch delay: 10ms
const DEFAULT_BATCH_DELAY_MS = 10

module.exports = {
    FILE_META_TYPE,
    DEFAULT_BATCH_DELAY_MS,
}
