import { OrganizationEmployee, QueryAllOrganizationEmployeesArgs } from '@app/{{name}}/condoSchema'

import { generateReactHooks } from '@open-condo/codegen/generate.hooks'

import { clientGql } from '@{{name}}/domains/condo/gql'


type EmptyObjectTypePlaceHolder = Record<string, never>

const {
    useObject,
    useObjects,
    useAllObjects,
    useCount,
} = generateReactHooks<OrganizationEmployee, EmptyObjectTypePlaceHolder, EmptyObjectTypePlaceHolder, QueryAllOrganizationEmployeesArgs>(clientGql.OrganizationEmployee)

export {
    useAllObjects,
    useObjects,
    useObject,
    useCount,
}
