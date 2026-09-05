// Standalone catalog generator — no TS transpiler needed
// Run: yarn workspace @app/condo node ./bin/generate-a2ui-catalog.js [--json]

const CATALOG_ID = 'https://condo.open-condo.software/a2ui/v1/catalog.json'

const CATALOG_COMPONENTS = [
    {
        name: 'Text',
        description: 'Displays text.',
        props: [
            { name: 'text', type: 'DynamicString', description: 'Text content', required: true },
            { name: 'variant', type: 'DynamicString', description: 'Text style variant', enum: ['h1', 'h2', 'h3', 'caption'] },
        ],
    },
    {
        name: 'Row',
        description: 'A horizontal layout container. Children fill space equally (flex: 1).',
        props: [
            { name: 'children', type: 'ChildList', description: 'Child component IDs', required: true },
        ],
    },
    {
        name: 'Col',
        description: 'A vertical layout container. Children stack vertically and fill full width.',
        props: [
            { name: 'children', type: 'ChildList', description: 'Child component IDs', required: true },
        ],
    },
    {
        name: 'Chart',
        description: 'Renders an ECharts chart from a native ECharts option object. Put the option in updateDataModel and bind via { path: "/..." }, or inline it directly.',
        props: [
            { name: 'option', type: 'DynamicObject', description: 'ECharts option object (series, xAxis, yAxis, tooltip, legend, etc.), or { path: "/chartOption" } binding to one in the data model', required: true },
            { name: 'height', type: 'DynamicString', description: 'Chart height in px (default 300)' },
        ],
    },
]

function formatPropType (prop) {
    let typeStr = prop.type
    if (prop.enum) {
        typeStr = `"${prop.enum.join('"|"')}"`
    }
    return `${typeStr}${prop.required ? '' : ' (optional)'}`
}

function generateCatalogPrompt () {
    const componentLines = CATALOG_COMPONENTS.map(function (comp) {
        const propsStr = comp.props.length > 0
            ? comp.props.map(function (p) { return `${p.name} (${formatPropType(p)})` }).join(', ')
            : 'No props.'
        return `- **${comp.name}** — ${comp.description} Props: ${propsStr}`
    }).join('\n')

    return `You are generating A2UI v0.9 messages for the Condo property management platform.

## Available Components
${componentLines}

## Message Format
Output A2UI messages as JSONL inside <a2ui>...</a2ui> tags. Each line is one A2UI message:
1. createSurface — { "version": "v0.9", "createSurface": { "surfaceId": "unique-id", "catalogId": "${CATALOG_ID}" } }
2. updateComponents — { "version": "v0.9", "updateComponents": { "surfaceId": "...", "components": [...] } }
3. updateDataModel — { "version": "v0.9", "updateDataModel": { "surfaceId": "...", "path": "/", "value": {...} } }

## Component Structure
Each component in the "components" array is a JSON object with:
- "component" (string, required) — the component type name (e.g. "Text", "Row", "Col", "Chart")
- "id" (string, required) — unique identifier for this component
- All other props from the component definition above

Example component: { "component": "Text", "id": "title", "text": "Hello" }
Example with data binding: { "component": "Chart", "id": "chart", "option": { "path": "/chartOption" }, "height": "300" }

The component tree must have exactly one component with id "root".
Components are a flat list — parent-child relationships are via ID references in the "children" array.

## Example
<a2ui>
{"version":"v0.9","createSurface":{"surfaceId":"demo","catalogId":"${CATALOG_ID}"}}
{"version":"v0.9","updateComponents":{"surfaceId":"demo","components":[{"component":"Col","id":"root","children":["title","subtitle"]},{"component":"Text","id":"title","text":"Hello World","variant":"h2"},{"component":"Text","id":"subtitle","text":"This is a subtitle"}]}}
</a2ui>

## Chart Example (ECharts option bound via data model)
<a2ui>
{"version":"v0.9","createSurface":{"surfaceId":"chart-demo","catalogId":"${CATALOG_ID}"}}
{"version":"v0.9","updateComponents":{"surfaceId":"chart-demo","components":[{"component":"Col","id":"root","children":["title","chart"]},{"component":"Text","id":"title","text":"Tickets by status","variant":"h3"},{"component":"Chart","id":"chart","option":{"path":"/chartOption"},"height":"300"}]}}
{"version":"v0.9","updateDataModel":{"surfaceId":"chart-demo","path":"/","value":{"chartOption":{"tooltip":{"trigger":"item"},"legend":{"data":["Open","In progress","Closed"]},"series":[{"type":"pie","name":"Tickets","data":[{"name":"Open","value":12},{"name":"In progress","value":5},{"name":"Closed","value":30}]}]}}}}
</a2ui>`
}

function generateCatalogJSON () {
    return {
        catalogId: CATALOG_ID,
        version: 'v0.9',
        components: CATALOG_COMPONENTS,
    }
}

function main (args) {
    const outputJSON = args.includes('--json')

    if (outputJSON) {
        console.log(JSON.stringify(generateCatalogJSON(), null, 2))
    } else {
        console.log(generateCatalogPrompt())
    }
}

main(process.argv.slice(2))

module.exports = {
    CATALOG_ID,
    CATALOG_COMPONENTS,
    generateCatalogPrompt,
    generateCatalogJSON,
}
