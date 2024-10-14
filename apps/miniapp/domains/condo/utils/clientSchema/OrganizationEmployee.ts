import { OrganizationEmployee, QueryAllOrganizationEmployeesArgs } from '@app/miniapp/condoSchema'

import { generateReactHooks } from '@open-condo/codegen/generate.hooks'

import { clientGql } from '@miniapp/domains/condo/gql'


type EmptyObjectTypePlaceHolder = {

}

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
