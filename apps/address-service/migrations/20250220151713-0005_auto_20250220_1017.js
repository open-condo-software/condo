// auto generated by kmigrator
// KMIGRATOR:0005_auto_20250220_1017:IyBHZW5lcmF0ZWQgYnkgRGphbmdvIDUuMSBvbiAyMDI1LTAyLTIwIDEwOjE3Cgpmcm9tIGRqYW5nby5kYiBpbXBvcnQgbWlncmF0aW9ucwoKCmNsYXNzIE1pZ3JhdGlvbihtaWdyYXRpb25zLk1pZ3JhdGlvbik6CgogICAgZGVwZW5kZW5jaWVzID0gWwogICAgICAgICgnX2RqYW5nb19zY2hlbWEnLCAnMDAwNF9hbHRlcl9hZGRyZXNzaGlzdG9yeXJlY29yZF9oaXN0b3J5X2FjdGlvbl9hbmRfbW9yZScpLAogICAgXQoKICAgIG9wZXJhdGlvbnMgPSBbCiAgICBdCg==

const { checkMinimalKVDataVersion, getKVClient } = require('@open-condo/keystone/kv')

exports.up = async () => {
    await checkMinimalKVDataVersion(2)
}

exports.down = async () => {
    const kv = getKVClient()
    const versionString = await kv.get('data_version')
    const dbSize = await kv.dbsize()
    // Rollback "empty db" if statement, since non-empty one mutates nothing
    if (dbSize === 1 && versionString === '2') {
        await kv.del('data_version')
    }
}
