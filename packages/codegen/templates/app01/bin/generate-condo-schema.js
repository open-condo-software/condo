const { generateCondoSchema } = require('@open-condo/codegen/generate-condo-schema')

const { CONDO_CONFIG } = require('@{{name}}/domains/condo/gql')


generateCondoSchema(CONDO_CONFIG)