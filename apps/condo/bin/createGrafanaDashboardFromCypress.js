const fs = require('fs')

const fetch = require('isomorphic-fetch')

const conf = require('@open-condo/config')


const TOTAL_TARGET_CONFIG = {
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

const PANEL_CONFIG = {
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
    'title': 'INSERT',
    'type': 'timeseries',
}

const TARGET_CONFIG = {
    'datasource': {
        'type': 'prometheus',
        'uid': 'P4169E866C3094E38',
    },
    'editorMode': 'builder',
    'exemplar': false,
    'expr': 'condo_test_cypress_auth_test_anonymous_canRegisterAfterConfirmingPhone_registrationClickedToEnd_duration_avg',
    'instant': false,
    'interval': '',
    'legendFormat': 'INSERT',
    'range': true,
    'refId': 'INSERT',
}


const getRequestHeaders = (apiKey) => {
    return {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
    }
}

const getNewDashboardPanelConfigFromTraces = (traces) => {

    const panels = traces.map(trace => {
        const newPanel = { ...{}, ...PANEL_CONFIG }

        newPanel.id = null
        newPanel.title = trace.name
        newPanel.targets = []

        trace.spans.forEach(span => {
            const target = { ...{}, ...TARGET_CONFIG }
            target.expr = ('condo_test_cypress_' + span.fullName + '_avg').replaceAll('.', '_')
            target.legendFormat = span.name
            target.refId = newPanel.targets.length.toString()
            newPanel.targets.push(target)
            console.log(`Pushed new target: ${span.name} : ${span.fullName} : ${target}`)
        })

        const totalTarget = { ...{}, ...TOTAL_TARGET_CONFIG }
        totalTarget.expression = newPanel.targets.map(t => '$' + t.refId).join('+')
        newPanel.targets.push(totalTarget)

        return newPanel
    })

    return panels
}

const getOldGrafanaDashboard = async ({ apiUrl, apiKey, dashboardUid }) => {
    const dashboardResponse = await fetch(`${apiUrl}/dashboards/uid/${dashboardUid}`, { headers: getRequestHeaders(apiKey) })

    let dashboard = null
    if (dashboardResponse.status === 200) {
        const dashboardResponseParsed = await dashboardResponse.json()
        dashboard = dashboardResponseParsed.dashboard
        return dashboard
    } else {
        throw new Error(`Couldn't get dashboard by uid! Status-code: ${dashboardResponse.status}`)
    }
}

const updateGrafanaDashboard = async (newDashboard, { apiUrl, apiKey, dashboardUid }) => {

    const updateDashboardMessage = 'Update Dashboard from cypress integration'

    const postDashboardResponse = await fetch(
        `${apiUrl}/dashboards/db`,
        {
            headers: getRequestHeaders(apiKey),
            method: 'POST',
            body: JSON.stringify({
                dashboard: newDashboard,
                message: updateDashboardMessage,
                overwrite: true,
            }),
        },
    )
    if (postDashboardResponse.status === 200) {
        return postDashboardResponse.json()
    } else {
        throw new Error(`Couldn't update dashboard by uid! Status-code: ${postDashboardResponse.status}`)
    }
}

const syncGrafanaDashboard = async (traces, config) => {
    const {
        apiUrl,
        apiKey,
        dashboardUid,
    } = config

    if (!apiUrl || !apiKey || !dashboardUid) {
        throw new Error('Please provide cypress with grafana credentials for correct dashboard update.')
    }

    const oldDashboard = await getOldGrafanaDashboard(config)

    const newPanelConfig = getNewDashboardPanelConfigFromTraces(traces)

    const newDashboard = oldDashboard
    newDashboard.panels = newPanelConfig

    const response = await updateGrafanaDashboard(newDashboard, config)

    console.log(response)

    return response
}

const cypressTracesPath = '../cypress/metrics/traces.json'
const cypressTraces = fs.readFileSync(cypressTracesPath)
const traces = JSON.parse(cypressTraces)

const config = JSON.parse(conf['CYPRESS_GRAFANA_CONFIG'])

syncGrafanaDashboard(traces, config)
    .then(() => {
        console.log('\r\n')
        console.log('All done, please check the dashboard in grafana')
        process.exit(0)
    }).catch((err) => {
        console.error('Failed to done', err)
    })