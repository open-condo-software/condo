import { Property, PropertyCreateInput, PropertyUpdateInput, QueryAllPropertiesArgs } from '@app/condo/schema'

import { generateReactHooks } from '@open-condo/codegen/generate.hooks'

import { PropertyTable as PropertyTableGQL } from '@condo/domains/property/gql'

const {
    useObject,
    useObjects,
    useCount,
} = generateReactHooks<Property, PropertyCreateInput, PropertyUpdateInput, QueryAllPropertiesArgs>(PropertyTableGQL)

export {
    useObject,
    useObjects,
    useCount,
}
