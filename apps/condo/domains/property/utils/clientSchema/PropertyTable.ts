import { Property, PropertyCreateInput, PropertyUpdateInput, QueryAllPropertiesArgs } from '@app/condo/schema'
import { PropertyTable as PropertyTableGQL } from '@condo/domains/property/gql'
import { generateReactHooks } from '@condo/codegen/generate.hooks'

const {
    useObject,
    useObjects,
} = generateReactHooks<Property, PropertyCreateInput, PropertyUpdateInput, QueryAllPropertiesArgs>(PropertyTableGQL)

export {
    useObject,
    useObjects,
}
