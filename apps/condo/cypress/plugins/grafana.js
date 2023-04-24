/**
 * @type {Cypress.PluginConfig}
 */

const fetch = require('isomorphic-fetch')

const totalTargetConfig = {
    'datasource': {
        'name': 'Expression',
        'type': '__expr__',
        'uid': '__expr__',
    },
    'expression': '',
    'hide': false,
    'refId': 'Total',
    'type': 'math',
}

const panelConfig = {
    'datasource': {
        'type': 'prometheus',
        'uid': 'P4169E866C3094E38',
    },
    'fieldConfig': {
        'defaults': {
            'color': {
                'mode': 'palette-classic',
            },
            'custom': {
                'axisCenteredZero': false,
                'axisColorMode': 'text',
                'axisGridShow': true,
                'axisLabel': '',
                'axisPlacement': 'auto',
                'barAlignment': 0,
                'drawStyle': 'line',
                'fillOpacity': 100,
                'gradientMode': 'hue',
                'hideFrom': {
                    'legend': false,
                    'tooltip': false,
                    'viz': false,
                },
                'lineInterpolation': 'smooth',
                'lineStyle': {
                    'fill': 'solid',
                },
                'lineWidth': 1,
                'pointSize': 3,
                'scaleDistribution': {
                    'type': 'linear',
                },
                'showPoints': 'always',
                'spanNulls': true,
                'stacking': {
                    'group': 'A',
                    'mode': 'normal',
                },
                'thresholdsStyle': {
                    'mode': 'line',
                },
            },
            'mappings': [],
            'thresholds': {
                'mode': 'absolute',
                'steps': [
                    {
                        'color': 'green',
                        'value': null,
                    },
                    {
                        'color': 'red',
                        'value': 4000,
                    },
                ],
            },
            'unit': 'ms',
        },
        'overrides': [
            {
                'matcher': {
                    'id': 'byName',
                    'options': 'Total',
                },
                'properties': [
                    {
                        'id': 'custom.fillOpacity',
                        'value': 0,
                    },
                    {
                        'id': 'custom.lineWidth',
                        'value': 3,
                    },
                    {
                        'id': 'custom.stacking',
                        'value': {
                            'group': 'A',
                            'mode': 'none',
                        },
                    },
                ],
            },
        ],
    },
    'gridPos': {
        'h': 8,
        'w': 12,
        'x': 0,
        'y': 0,
    },
    'id': 18,
    'options': {
        'legend': {
            'calcs': [],
            'displayMode': 'list',
            'placement': 'bottom',
            'showLegend': true,
        },
        'tooltip': {
            'mode': 'multi',
            'sort': 'none',
        },
    },
    'pluginVersion': '9.1.6',
    'targets': [],
    'title': '',
    'type': 'timeseries',
}

const targetConfig = {
    'datasource': {
        'type': 'prometheus',
        'uid': 'P4169E866C3094E38',
    },
    'editorMode': 'builder',
    'exemplar': false,
    'expr': 'condo_test_cypress_auth_test_anonymous_canRegisterAfterConfirmingPhone_registrationClickedToEnd_duration_avg',
    'instant': false,
    'interval': '',
    'legendFormat': '',
    'range': true,
    'refId': '',
}


/**
 * https://grafana.com/docs/grafana/latest/developers/http_api/dashboard
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

            // GET DASHBOARD FROM GRAFANA

            const dashboardResponse = await fetch(`${GRAFANA_API_URL}/dashboards/uid/${GRAFANA_DASHBOARD_UID}`, { headers: headers })

            let dashboard = null
            if (dashboardResponse.status === 200) {
                const dashboardResponseParsed = await dashboardResponse.json()
                dashboard = dashboardResponseParsed.dashboard
                console.log(dashboard)
            } else {
                throw new Error(`Couldn't get dashboard by uid! Status-code: ${dashboardResponse.status}`)
            }

            // CREATE NEW PANEL

            const newPanel = { ...{}, ...panelConfig }

            newPanel.id = null
            newPanel.title = traceName
            newPanel.targets = []

            spans.forEach(span => {
                const target = { ...{}, ...targetConfig }
                target.expr = ('condo_test_cypress_' + span.fullName + '_avg').replaceAll('.', '_')
                target.legendFormat = span.name
                target.refId = newPanel.targets.length.toString()
                newPanel.targets.push(target)
                console.log(`Pushed new target: ${span.name} : ${span.fullName} : ${target}`)
            })

            const totalTarget = { ...{}, ...totalTargetConfig }
            totalTarget.expression = newPanel.targets.map(t => '$' + t.refId).join('+')
            newPanel.targets.push(totalTarget)

            // FINALIZE PAYLOAD AND SEND

            const newDashboard = { ...{}, ...dashboard }
            newDashboard.panels = [newPanel]

            const updateDashboardMessage = 'UPDATE DB FROM CODE'

            const postDashboardResponse = await fetch(
                `${GRAFANA_API_URL}/dashboards/db`,
                { 
                    headers: headers,
                    method: 'POST',
                    body: JSON.stringify({
                        dashboard: newDashboard,
                        message: updateDashboardMessage,
                        overwrite: true,
                    }),
                },
            )
            if (postDashboardResponse.status === 200) {
                console.log(await postDashboardResponse.json())
            } else {
                throw new Error(`Couldn't update dashboard by uid! Status-code: ${dashboardResponse.status}`)
            }

            return null
        },
    })

    return config
}