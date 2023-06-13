const GQL_SCHEMA_PLUGIN = 'GQLSchemaPlugin'

const TEST_EXAMPLE = {
    fields: {
        name: {
            type: 'Text',
            isRequired: true,
        },
    },
    access: {
        read: true,
        write: true,
    },
}

function assertPluginCall (fn) {
    // NOTE: we want to check that the plugin is a pure function! It should not save or use any global state!
    fn(TEST_EXAMPLE, { schemaName: 'Test', addSchema: () => undefined })
}

function plugin (fn) {
    assertPluginCall(fn)
    fn._type = GQL_SCHEMA_PLUGIN
    return fn
}

module.exports = {
    plugin,
    GQL_SCHEMA_PLUGIN,
}
