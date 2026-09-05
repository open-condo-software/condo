import React from 'react'

import { Typography, Space } from '@open-condo/ui'

import { A2UISurfaces, CONDO_CATALOG_ID } from '@condo/domains/ai/components/AIChat/genUI'
import { CoworkLayout } from '@condo/domains/ai/components/Cowork'
import coworkStyles from '@condo/domains/ai/components/Cowork/Cowork.module.css'
import { PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { PageComponentType } from '@condo/domains/common/types'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'

import type { A2uiMessage } from '@a2ui/web_core/v0_9'


// --- Helpers ---

function surface (id: string, components: Record<string, unknown>[], data?: Record<string, unknown>): A2uiMessage[] {
    const msgs: A2uiMessage[] = [
        { version: 'v0.9', createSurface: { surfaceId: id, catalogId: CONDO_CATALOG_ID } },
        { version: 'v0.9', updateComponents: { surfaceId: id, components } },
    ]
    if (data) {
        msgs.push({ version: 'v0.9', updateDataModel: { surfaceId: id, path: '/', value: data } })
    }
    return msgs
}

// --- Text scenarios ---

const TEXT_SCENARIO: A2uiMessage[] = surface('text-demo', [
    { component: 'Text', id: 'root', text: 'Hello World' },
])

const H1_SCENARIO: A2uiMessage[] = surface('h1-demo', [
    { component: 'Text', id: 'root', text: 'Heading 1', variant: 'h1' },
])

const H2_SCENARIO: A2uiMessage[] = surface('h2-demo', [
    { component: 'Text', id: 'root', text: 'Heading 2', variant: 'h2' },
])

const CAPTION_SCENARIO: A2uiMessage[] = surface('caption-demo', [
    { component: 'Text', id: 'root', text: 'This is a caption — small secondary text.', variant: 'caption' },
])

// --- Chart scenarios ---

const PIE_CHART_SCENARIO: A2uiMessage[] = surface('pie-demo', [
    { component: 'Chart', id: 'root', option: { path: '/option' }, height: '300' },
], {
    option: {
        tooltip: { trigger: 'item' },
        legend: { data: ['Open', 'In progress', 'Closed'], bottom: 0 },
        series: [{
            type: 'pie', name: 'Tickets', radius: '60%',
            data: [
                { name: 'Open', value: 12 },
                { name: 'In progress', value: 5 },
                { name: 'Closed', value: 30 },
            ],
        }],
    },
})

const BAR_CHART_SCENARIO: A2uiMessage[] = surface('bar-demo', [
    { component: 'Chart', id: 'root', option: { path: '/option' }, height: '350' },
], {
    option: {
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        legend: { data: ['This week', 'Last week'], bottom: 0 },
        xAxis: { type: 'category', data: ['Plumbing', 'Electrical', 'HVAC', 'Structural', 'Other'] },
        yAxis: { type: 'value' },
        series: [
            { type: 'bar', name: 'This week', data: [8, 12, 5, 3, 7] },
            { type: 'bar', name: 'Last week', data: [10, 8, 7, 2, 5] },
        ],
    },
})

const LINE_CHART_SCENARIO: A2uiMessage[] = surface('line-demo', [
    { component: 'Chart', id: 'root', option: { path: '/option' }, height: '300' },
], {
    option: {
        tooltip: { trigger: 'axis' },
        legend: { data: ['Paid', 'Pending'], bottom: 0 },
        xAxis: { type: 'category', data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'] },
        yAxis: { type: 'value' },
        series: [
            { type: 'line', name: 'Paid', data: [320, 432, 401, 534, 590, 630], smooth: true },
            { type: 'line', name: 'Pending', data: [50, 45, 60, 30, 25, 40], smooth: true },
        ],
    },
})

// Area chart (line with areaStyle)
const AREA_CHART_SCENARIO: A2uiMessage[] = surface('area-demo', [
    { component: 'Chart', id: 'root', option: { path: '/option' }, height: '300' },
], {
    option: {
        tooltip: { trigger: 'axis' },
        legend: { data: ['Income', 'Expenses'], bottom: 0 },
        xAxis: { type: 'category', boundaryGap: false, data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'] },
        yAxis: { type: 'value' },
        series: [
            { type: 'line', name: 'Income', data: [140, 232, 101, 264, 290, 330], areaStyle: {}, smooth: true },
            { type: 'line', name: 'Expenses', data: [120, 182, 191, 234, 290, 330], areaStyle: {}, smooth: true },
        ],
    },
})

// Stacked bar chart
const STACKED_BAR_SCENARIO: A2uiMessage[] = surface('stacked-bar-demo', [
    { component: 'Chart', id: 'root', option: { path: '/option' }, height: '350' },
], {
    option: {
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        legend: { data: ['Open', 'In progress', 'Closed'], bottom: 0 },
        xAxis: { type: 'category', data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
        yAxis: { type: 'value' },
        series: [
            { type: 'bar', name: 'Open', data: [5, 3, 7, 4, 6], stack: 'tickets' },
            { type: 'bar', name: 'In progress', data: [2, 4, 1, 3, 2], stack: 'tickets' },
            { type: 'bar', name: 'Closed', data: [4, 5, 3, 6, 5], stack: 'tickets' },
        ],
    },
})

// Scatter chart
const SCATTER_CHART_SCENARIO: A2uiMessage[] = surface('scatter-demo', [
    { component: 'Chart', id: 'root', option: { path: '/option' }, height: '300' },
], {
    option: {
        tooltip: { trigger: 'item' },
        legend: { data: ['Building A', 'Building B'], bottom: 0 },
        xAxis: { type: 'value', name: 'Tickets' },
        yAxis: { type: 'value', name: 'Residents' },
        series: [
            { type: 'scatter', name: 'Building A', data: [[12, 80], [15, 95], [8, 60], [20, 110]] },
            { type: 'scatter', name: 'Building B', data: [[5, 40], [10, 70], [7, 55], [14, 85]] },
        ],
    },
})

// Radar chart
const RADAR_CHART_SCENARIO: A2uiMessage[] = surface('radar-demo', [
    { component: 'Chart', id: 'root', option: { path: '/option' }, height: '350' },
], {
    option: {
        tooltip: {},
        legend: { data: ['Building A', 'Building B'], bottom: 0 },
        radar: {
            indicator: [
                { name: 'Tickets', max: 100 },
                { name: 'Payments', max: 100 },
                { name: 'Residents', max: 100 },
                { name: 'Maintenance', max: 100 },
                { name: 'Satisfaction', max: 100 },
            ],
        },
        series: [{
            type: 'radar',
            data: [
                { name: 'Building A', value: [85, 92, 78, 70, 88] },
                { name: 'Building B', value: [70, 65, 90, 85, 72] },
            ],
        }],
    },
})

// Gauge chart
const GAUGE_CHART_SCENARIO: A2uiMessage[] = surface('gauge-demo', [
    { component: 'Chart', id: 'root', option: { path: '/option' }, height: '300' },
], {
    option: {
        series: [{
            type: 'gauge',
            progress: { show: true, width: 18 },
            axisLine: { lineStyle: { width: 18 } },
            detail: { valueAnimation: true, formatter: '{value}%', fontSize: 24 },
            data: [{ value: 89, name: 'Payment rate' }],
        }],
    },
})

// Horizontal bar chart
const HORIZONTAL_BAR_SCENARIO: A2uiMessage[] = surface('hbar-demo', [
    { component: 'Chart', id: 'root', option: { path: '/option' }, height: '350' },
], {
    option: {
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        legend: { data: ['Count'], bottom: 0 },
        xAxis: { type: 'value' },
        yAxis: { type: 'category', data: ['Plumbing', 'Electrical', 'HVAC', 'Structural', 'Cleaning', 'Other'] },
        series: [
            { type: 'bar', name: 'Count', data: [23, 18, 12, 8, 15, 10] },
        ],
    },
})

// --- Layout scenarios (Row + Col) ---

// Row with 3 text columns
const ROW_TEXT_SCENARIO: A2uiMessage[] = surface('row-text-demo', [
    { component: 'Row', id: 'root', children: ['col1', 'col2', 'col3'] },
    { component: 'Text', id: 'col1', text: 'Column 1' },
    { component: 'Text', id: 'col2', text: 'Column 2' },
    { component: 'Text', id: 'col3', text: 'Column 3' },
])

// Col with stacked text
const COL_TEXT_SCENARIO: A2uiMessage[] = surface('col-text-demo', [
    { component: 'Col', id: 'root', children: ['t1', 't2', 't3'] },
    { component: 'Text', id: 't1', text: 'First item' },
    { component: 'Text', id: 't2', text: 'Second item' },
    { component: 'Text', id: 't3', text: 'Third item' },
])

// Row with 2 charts side by side
const ROW_CHARTS_SCENARIO: A2uiMessage[] = surface('row-charts-demo', [
    { component: 'Row', id: 'root', children: ['pie', 'bar'] },
    { component: 'Chart', id: 'pie', option: { path: '/pieOption' }, height: '250' },
    { component: 'Chart', id: 'bar', option: { path: '/barOption' }, height: '250' },
], {
    pieOption: {
        tooltip: { trigger: 'item' },
        series: [{
            type: 'pie', radius: '60%',
            data: [
                { name: 'Open', value: 12 },
                { name: 'Closed', value: 30 },
            ],
        }],
    },
    barOption: {
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
        yAxis: { type: 'value' },
        series: [{ type: 'bar', data: [5, 3, 7, 4, 6] }],
    },
})

// Col with title + chart
const COL_TITLE_CHART_SCENARIO: A2uiMessage[] = surface('col-title-chart-demo', [
    { component: 'Col', id: 'root', children: ['title', 'chart'] },
    { component: 'Text', id: 'title', text: 'Monthly revenue', variant: 'h3' },
    { component: 'Chart', id: 'chart', option: { path: '/option' }, height: '300' },
], {
    option: {
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'] },
        yAxis: { type: 'value' },
        series: [{ type: 'bar', data: [320, 432, 401, 534, 590, 630] }],
    },
})

// Dashboard: Col > [title, Row of 2 charts, Row of 2 texts]
const DASHBOARD_SCENARIO: A2uiMessage[] = surface('dashboard-demo', [
    { component: 'Col', id: 'root', children: ['title', 'chartsRow', 'statsRow'] },
    { component: 'Text', id: 'title', text: 'Building overview', variant: 'h2' },
    { component: 'Row', id: 'chartsRow', children: ['pie', 'line'] },
    { component: 'Chart', id: 'pie', option: { path: '/pieOption' }, height: '250' },
    { component: 'Chart', id: 'line', option: { path: '/lineOption' }, height: '250' },
    { component: 'Row', id: 'statsRow', children: ['stat1', 'stat2'] },
    { component: 'Text', id: 'stat1', text: 'Open tickets: 12', variant: 'caption' },
    { component: 'Text', id: 'stat2', text: 'Payment rate: 89%', variant: 'caption' },
], {
    pieOption: {
        tooltip: { trigger: 'item' },
        series: [{
            type: 'pie', radius: '60%',
            data: [
                { name: 'Open', value: 12 },
                { name: 'In progress', value: 5 },
                { name: 'Closed', value: 30 },
            ],
        }],
    },
    lineOption: {
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
        yAxis: { type: 'value' },
        series: [{ type: 'line', data: [5, 3, 7, 4, 6, 2, 3], smooth: true }],
    },
})

// Nested: Col > Row > Col > Text (depth test)
const NESTED_SCENARIO: A2uiMessage[] = surface('nested-demo', [
    { component: 'Col', id: 'root', children: ['header', 'row'] },
    { component: 'Text', id: 'header', text: 'Nested layout test', variant: 'h3' },
    { component: 'Row', id: 'row', children: ['left', 'right'] },
    { component: 'Col', id: 'left', children: ['l1', 'l2'] },
    { component: 'Text', id: 'l1', text: 'Left top' },
    { component: 'Text', id: 'l2', text: 'Left bottom' },
    { component: 'Col', id: 'right', children: ['r1', 'r2'] },
    { component: 'Text', id: 'r1', text: 'Right top' },
    { component: 'Text', id: 'r2', text: 'Right bottom' },
])

// --- Scenario registry ---

interface Scenario {
    title: string
    description: string
    messages: A2uiMessage[]
}

const SCENARIOS: Scenario[] = [
    // Text
    { title: '1. Plain text', description: 'Basic Typography.Text', messages: TEXT_SCENARIO },
    { title: '2. H1 heading', description: 'Typography.Title level=1', messages: H1_SCENARIO },
    { title: '3. H2 heading', description: 'Typography.Title level=2', messages: H2_SCENARIO },
    { title: '4. Caption', description: 'Small secondary text', messages: CAPTION_SCENARIO },
    // Charts
    { title: '5. Pie chart', description: 'ECharts pie', messages: PIE_CHART_SCENARIO },
    { title: '6. Bar chart', description: 'ECharts grouped bar', messages: BAR_CHART_SCENARIO },
    { title: '7. Line chart', description: 'ECharts smooth line', messages: LINE_CHART_SCENARIO },
    { title: '8. Area chart', description: 'ECharts line with areaStyle', messages: AREA_CHART_SCENARIO },
    { title: '9. Stacked bar', description: 'ECharts stacked bar', messages: STACKED_BAR_SCENARIO },
    { title: '10. Scatter chart', description: 'ECharts scatter plot', messages: SCATTER_CHART_SCENARIO },
    { title: '11. Radar chart', description: 'ECharts radar', messages: RADAR_CHART_SCENARIO },
    { title: '12. Gauge chart', description: 'ECharts gauge', messages: GAUGE_CHART_SCENARIO },
    { title: '13. Horizontal bar', description: 'ECharts horizontal bar', messages: HORIZONTAL_BAR_SCENARIO },
    // Layout
    { title: '14. Row of text', description: '3 text columns in a row', messages: ROW_TEXT_SCENARIO },
    { title: '15. Col of text', description: '3 text items stacked', messages: COL_TEXT_SCENARIO },
    { title: '16. Row of charts', description: '2 charts side by side', messages: ROW_CHARTS_SCENARIO },
    { title: '17. Col: title + chart', description: 'Heading above a chart', messages: COL_TITLE_CHART_SCENARIO },
    { title: '18. Dashboard', description: 'Col > title + Row of 2 charts + Row of stats', messages: DASHBOARD_SCENARIO },
    { title: '19. Nested layout', description: 'Col > Row > Col > Text (depth test)', messages: NESTED_SCENARIO },
]

// --- Page ---

const DebugChatPage: PageComponentType = () => {
    return (
        <PageWrapper className={coworkStyles.chatPageWrapper}>
            <div className={coworkStyles.chatContent}>
                <div className={coworkStyles.chatContainer} style={{ overflowY: 'auto', paddingTop: 48 }}>
                    <Space direction='vertical' size={24} width='100%'>
                        <Typography.Title level={2}>A2UI Component Debug</Typography.Title>
                        <Typography.Text type='secondary'>
                            Text + Chart + Row/Col. Row is flex (children fill equally), Col is vertical stack.
                        </Typography.Text>
                        {SCENARIOS.map((scenario) => (
                            <div key={scenario.title} style={{
                                padding: 16,
                                border: '1px solid #e8e8e8',
                                borderRadius: 8,
                                width: '100%',
                            }}>
                                <Space direction='vertical' size={12} width='100%'>
                                    <div>
                                        <Typography.Title level={4}>{scenario.title}</Typography.Title>
                                        <Typography.Text type='secondary' size='small'>{scenario.description}</Typography.Text>
                                    </div>
                                    <A2UISurfaces messages={scenario.messages} />
                                </Space>
                            </div>
                        ))}
                    </Space>
                </div>
            </div>
        </PageWrapper>
    )
}

DebugChatPage.requiredAccess = OrganizationRequired
DebugChatPage.container = CoworkLayout

export default DebugChatPage
