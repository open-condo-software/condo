const { Json } = require('@core/keystone/fields')
const Ajv = require('ajv')

const SectionJsonSchema = {
    type: 'object',
    properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        imageSrc: { type: 'string' },
    },
    additionalProperties: false,
    required: ['title', 'description', 'imageSrc'],
}

const PropsJsonSchema = {
    type: 'object',
    properties: {
        sections: {
            type: 'array',
            items: SectionJsonSchema,
        },
    },
    additionalProperties: false,
    required: ['sections'],
}

const AboutComponentJsonSchema = {
    type: 'object',
    properties: {
        type: { const: 'component-block' },
        component: { const: 'aboutAppBlock' },
        props: PropsJsonSchema,
    },
    additionalProperties: false,
    required: [],
}

const AboutDocumentJsonSchema = {
    type: 'array',
    items: AboutComponentJsonSchema,
    minItems: 1,
    maxItems: 1,
}

const ajv = new Ajv()
const AboutDocumentJsonValidator = ajv.compile(AboutDocumentJsonSchema)

const ABOUT_DOCUMENT_FIELD = {
    schemaDoc: 'JSON interpretation of visual about app field written in KS6 document-field notation',
    type: Json,
    isRequired: false,
    hooks: {
        validateInput: async ({ resolvedData, fieldPath, addFieldValidationError }) => {
            if (resolvedData[fieldPath] && !AboutDocumentJsonValidator(resolvedData[fieldPath])) {
                AboutDocumentJsonValidator.errors.forEach(error => {
                    addFieldValidationError(`${fieldPath} field validation error. JSON not in the correct format - path:${error.instancePath} msg:${error.message}`)
                })
            }
        },
    },
}

module.exports = {
    ABOUT_DOCUMENT_FIELD,
}