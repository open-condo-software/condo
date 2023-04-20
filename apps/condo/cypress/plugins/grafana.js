/**
 * @type {Cypress.PluginConfig}
 */

const fetch = require('isomorphic-fetch')

/**
 * https://grafana.com/docs/grafana/latest/developers/http_api/dashboard/#get-dashboard-by-uid
 * @param on
 * @param config
 * @returns {Promise<null|*>}
 */
module.exports = async (on, config) => {

    const GRAFANA_API_URL = config.env.grafanaApiUrl
    const GRAFANA_API_KEY = config.env.grafanaApiKey
    const GRAFANA_DASHBOARD_UID = config.env.grafanaDashboardUid

    let pluginEnabled = true
    if (!GRAFANA_API_URL || !GRAFANA_API_KEY || !GRAFANA_DASHBOARD_UID) {
        pluginEnabled = false
        console.log('Please provide cypress with grafana credentials for correct dashboard update. Since not all credentials were provided, plugin will not work.')
    }

    const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + GRAFANA_API_KEY,
    }

    on('task', {
        async 'grafana:drawTrace' ([traceName, spans]) {
            if (!pluginEnabled) {
                console.log('grafana:drawTrace was called, but not configured')
                return null
            }

            console.log(`Drawing Trace ${traceName}. Spans: ${spans.map((s) => s.name).join()}...`)

            const dashboardResponse = await fetch(`${GRAFANA_API_URL}/dashboards/uid/${GRAFANA_DASHBOARD_UID}`, { headers: headers })
            if (dashboardResponse.status === 200) {
                const dashboard = await dashboardResponse.json()
                console.log(dashboard)
            } else {
                throw new Error(`Couldn't get dashboard by uid! Status-code: ${dashboardResponse.status}`)
            }

            return null
        },
    })

    return config
}