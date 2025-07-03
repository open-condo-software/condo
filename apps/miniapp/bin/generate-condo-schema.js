const { generateCondoSchema } = require('@open-condo/codegen/generate-condo-schema')

const { CONDO_CONFIG } = require('@miniapp/domains/condo/gql')


generateCondoSchema(CONDO_CONFIG)
