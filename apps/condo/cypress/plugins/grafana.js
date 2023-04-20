/**
 * @type {Cypress.PluginConfig}
 */

module.exports = async (on, config) => {
    on('task', {
        async 'grafana:drawTrace' ([traceName, spans]) {
            console.log(`Drawing Trace ${traceName}. Spans: ${spans.join()}`)
            return null
        },
    })

    return config
}