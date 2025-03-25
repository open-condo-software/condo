import { Organization, QueryAllOrganizationsArgs } from '@app/miniapp/condoSchema'

import { generateReactHooks } from '@open-condo/codegen/generate.hooks'

import { clientGql } from '@miniapp/domains/condo/gql'


type EmptyObjectTypePlaceHolder = Record<string, never>

const {
    useObject,
    useObjects,
    useAllObjects,
    useCount,
} = generateReactHooks<Organization, EmptyObjectTypePlaceHolder, EmptyObjectTypePlaceHolder, QueryAllOrganizationsArgs>(clientGql.Organization)

export {
    useAllObjects,
    useObjects,
    useObject,
    useCount,
}
