export const CONDO_CATALOG_ID = 'https://condo.open-condo.software/a2ui/v1/catalog.json'

export type CatalogPropType =
    | 'string'
    | 'number'
    | 'boolean'
    | 'ComponentId'
    | 'ChildList'
    | 'DynamicString'
    | 'DynamicNumber'
    | 'DynamicBoolean'
    | 'DynamicStringList'
    | 'Action'
    | 'Check[]'
    | 'Option[]'

export interface CatalogPropDef {
    name: string
    type: CatalogPropType
    description: string
    required?: boolean
    enum?: string[]
}

export interface CatalogComponentDef {
    name: string
    description: string
    props: CatalogPropDef[]
}

export const CONDO_CATALOG_COMPONENTS: CatalogComponentDef[] = [
    {
        name: 'Text',
        description: 'Displays text. Supports simple Markdown.',
        props: [
            { name: 'text', type: 'DynamicString', description: 'Text content', required: true },
            { name: 'variant', type: 'DynamicString', description: 'Text style variant', enum: ['h1', 'h2', 'h3', 'caption'] },
        ],
    },
    {
        name: 'Button',
        description: 'A clickable button that dispatches an action.',
        props: [
            { name: 'child', type: 'ComponentId', description: 'ID of a Text component for the button label' },
            { name: 'text', type: 'DynamicString', description: 'Fallback label text if no child' },
            { name: 'variant', type: 'DynamicString', description: 'Button style', enum: ['primary', 'borderless'] },
            { name: 'action', type: 'Action', description: 'Action to dispatch on click' },
        ],
    },
    {
        name: 'Row',
        description: 'A horizontal layout container.',
        props: [
            { name: 'children', type: 'ChildList', description: 'Child component IDs', required: true },
            { name: 'justify', type: 'DynamicString', description: 'Horizontal distribution', enum: ['start', 'center', 'end', 'spaceBetween'] },
            { name: 'align', type: 'DynamicString', description: 'Vertical alignment', enum: ['start', 'center', 'end'] },
        ],
    },
    {
        name: 'Column',
        description: 'A vertical layout container.',
        props: [
            { name: 'children', type: 'ChildList', description: 'Child component IDs', required: true },
        ],
    },
    {
        name: 'Card',
        description: 'A container with card-like styling.',
        props: [
            { name: 'child', type: 'ComponentId', description: 'Child component ID' },
            { name: 'children', type: 'ChildList', description: 'Child component IDs' },
        ],
    },
    {
        name: 'TextField',
        description: 'A field for user text input.',
        props: [
            { name: 'label', type: 'DynamicString', description: 'Field label' },
            { name: 'value', type: 'DynamicString', description: 'Bound data value via { path: "/data/field" }', required: true },
            { name: 'variant', type: 'DynamicString', description: 'Input variant', enum: ['shortText', 'longText'] },
            { name: 'placeholder', type: 'DynamicString', description: 'Placeholder text' },
            { name: 'checks', type: 'Check[]', description: 'Validation checks' },
        ],
    },
    {
        name: 'CheckBox',
        description: 'A checkbox with a label and a boolean value.',
        props: [
            { name: 'label', type: 'DynamicString', description: 'Checkbox label', required: true },
            { name: 'value', type: 'DynamicBoolean', description: 'Bound boolean via { path: "/data/field" }', required: true },
        ],
    },
    {
        name: 'ChoicePicker',
        description: 'A component for selecting one or more options.',
        props: [
            { name: 'options', type: 'Option[]', description: 'Available options [{ label, value }]', required: true },
            { name: 'value', type: 'DynamicStringList', description: 'Bound value via { path: "/data/field" }', required: true },
            { name: 'variant', type: 'DynamicString', description: 'Selection mode', enum: ['mutuallyExclusive', 'multiSelect'] },
        ],
    },
    {
        name: 'Divider',
        description: 'A horizontal or vertical dividing line.',
        props: [
            { name: 'axis', type: 'DynamicString', description: 'Divider direction', enum: ['horizontal', 'vertical'] },
        ],
    },
    {
        name: 'Icon',
        description: 'Displays a system-provided icon from a predefined list.',
        props: [
            { name: 'name', type: 'DynamicString', description: 'Icon name', required: true },
        ],
    },
    {
        name: 'List',
        description: 'A scrollable list of components.',
        props: [
            { name: 'children', type: 'ChildList', description: 'Child component IDs', required: true },
        ],
    },
]

function formatPropType (prop: CatalogPropDef): string {
    let typeStr: string = prop.type
    if (prop.enum) {
        typeStr = `"${prop.enum.join('"|"')}"`
    }
    return `${typeStr}${prop.required ? '' : ' (optional)'}`
}

export function generateCatalogPrompt (): string {
    const componentLines = CONDO_CATALOG_COMPONENTS.map(function (comp) {
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
1. createSurface — { "version": "v0.9", "createSurface": { "surfaceId": "unique-id", "catalogId": "${CONDO_CATALOG_ID}" } }
2. updateComponents — { "version": "v0.9", "updateComponents": { "surfaceId": "...", "components": [...] } }
3. updateDataModel — { "version": "v0.9", "updateDataModel": { "surfaceId": "...", "path": "/", "value": {...} } }

## Component Structure
Each component in the "components" array is a JSON object with:
- "component" (string, required) — the component type name (e.g. "Text", "Button", "Row")
- "id" (string, required) — unique identifier for this component
- All other props from the component definition above

Example component: { "component": "Text", "id": "title", "text": "Hello" }
Example with data binding: { "component": "TextField", "id": "name", "label": "Name", "value": { "path": "/data/name" } }

The component tree must have exactly one component with id "root".
Components are a flat list — parent-child relationships are via ID references in the "children" array.

## Example
<a2ui>
{"version":"v0.9","createSurface":{"surfaceId":"demo","catalogId":"${CONDO_CATALOG_ID}"}}
{"version":"v0.9","updateComponents":{"surfaceId":"demo","components":[{"component":"Column","id":"root","children":["title","btn"]},{"component":"Text","id":"title","text":"Hello World"},{"component":"Button","id":"btn","text":"Click me","variant":"primary"}]}}
</a2ui>`
}

export function generateCatalogJSON (): Record<string, unknown> {
    return {
        catalogId: CONDO_CATALOG_ID,
        version: 'v0.9',
        components: CONDO_CATALOG_COMPONENTS,
    }
}
