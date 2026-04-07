// WARNING: Changing this value requires database migration!
// All existing file-meta objects in the database have _type set to this value.
// If you change it, you must migrate all existing records to use the new value.
const FILE_META_TYPE = 'ExternalContent.file-meta'

module.exports = {
    FILE_META_TYPE,
}
