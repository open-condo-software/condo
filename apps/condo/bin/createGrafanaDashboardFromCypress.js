/**
 * This script allows to generate grafana dashboard from cypress traces and spans configuration.
 *
 * Prepare:
 * 1. Prepare and launch cypress tests (set required variables for cypress)
 * 2. Set environment variables for grafana (see below)
 *
 * Usage:
 *
 * 1. Launch full set of cypress tests once to generate traces.json file.
 * 2. Launch this script
 *
 */

const { randomUUID } = require('crypto')
const fs = require('fs')

const fetch = require('isomorphic-fetch')

const conf = require('@open-condo/config')

// Variables to be set in env:
const CYPRESS_TRACES_PATH = conf['CYPRESS_TRACES_PATH'] || '../cypress/traces.json'
const CYPRESS_GRAFANA_CONFIG = JSON.parse(conf['CYPRESS_GRAFANA_CONFIG']) || { 'apiUrl': null, 'apiKey': null, 'dashboardUid': null }


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
    'editorMode': 'builder',
    'exemplar': false,
    'expr': 'INSERT',
    'instant': false,
    'interval': '',
    'legendFormat': 'INSERT',
    'range': true,
    'refId': 'INSERT',
}

const ROW_PANEL_CONFIG = {
    'collapsed': false,
    'gridPos': {
        'h': 1,
        'w': 24,
        'x': 0,
        'y': 0,
    },
    'id': null,
    'panels': [],
    'title': 'INSERT',
    'type': 'row',
}

const METRICS_PREFIX = conf['STATSD_METRIC_PREFIX'] + 'cypress.'
const METRICS_POSTFIX = '.avg'

const GRAFANA_DASHBOARD_PANEL_WIDTH = 8
const GRAFANA_DASHBOARD_PANEL_HEIGHT = 8
const GRAFANA_DASHBOARD_ROW_WIDTH = 24

const getRequestHeaders = (apiKey) => {
    return {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
    }
}

const getPanelFromTrace = (trace, { posX = 0, posY = 0 }) => {
    const panel = { ...{}, ...PANEL_CONFIG }

    panel.id = null
    panel.title = trace.name.replace('.', ' ')
    panel.targets = []
    panel.gridPos = {
        x: posX,
        y: posY,
        h: GRAFANA_DASHBOARD_PANEL_HEIGHT,
        w: GRAFANA_DASHBOARD_PANEL_WIDTH,
    }

    trace.spans.forEach(span => {
        const target = { ...{}, ...TARGET_CONFIG }
        target.expr = (METRICS_PREFIX + span.fullName + METRICS_POSTFIX).replaceAll('.', '_')
        target.legendFormat = span.name
        target.refId = panel.targets.length.toString()
        panel.targets.push(target)
    })

    if (panel.targets.length > 1) {
        const totalTarget = { ...{}, ...TOTAL_TARGET_CONFIG }
        totalTarget.expression = '0+' + panel.targets.map(t => '$' + t.refId).join('+')
        panel.targets.push(totalTarget)
    }

    return panel
}


const getRowPanel = (title) => {
    const result = { ...{}, ...ROW_PANEL_CONFIG }
    result.title = title
    result.id = randomUUID()
    return result
}


const getNewPanelsFromTraces = (traces) => {

    let newPanels = []

    const tracesByGroups = {}

    traces.forEach(trace => {
        const group = trace.group
        if (!tracesByGroups[group]) { tracesByGroups[group] = [] }
        tracesByGroups[group].push(trace)
    })

    Object.entries(tracesByGroups).forEach(([group, traces]) => {
        let offsetX = 0
        const groupPanels = []
        groupPanels.push(getRowPanel(group))
        traces.forEach(trace => {
            groupPanels.push(getPanelFromTrace(trace, { posX: offsetX }))
            offsetX += GRAFANA_DASHBOARD_PANEL_WIDTH % GRAFANA_DASHBOARD_ROW_WIDTH
        })
        newPanels = newPanels.concat(groupPanels)
    })

    return newPanels
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

const updateGrafanaDashboard = async (newDashboard, { apiUrl, apiKey }) => {

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

/**
 *
 * @param traces
 * @param config
 * @returns {Promise<*>}
 */
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

    const newPanels = getNewPanelsFromTraces(traces)

    const disclaimer = getRowPanel('Warning: this dashboard is auto generated and will reset. Do not change this dashboard by hand!')

    const newDashboard = oldDashboard
    newDashboard.panels = [disclaimer].concat(newPanels)

    const response = await updateGrafanaDashboard(newDashboard, config)

    return apiUrl.replace('/api', '') + response.url
}

const cypressTraces = fs.readFileSync(CYPRESS_TRACES_PATH)
const traces = JSON.parse(cypressTraces)

syncGrafanaDashboard(traces, CYPRESS_GRAFANA_CONFIG)
    .then((url) => {
        console.log('\r\n')
        console.log(`All done, please check the dashboard in grafana: ${url} `)
        process.exit(0)
    }).catch((err) => {
        console.error('Failed to generate grafana dashboard!', err)
    })