import { B2BAppContext, QueryAllB2BAppContextsArgs } from '@app/{{name}}/condoSchema'

import { generateReactHooks } from '@open-condo/codegen/generate.hooks'

import { clientGql } from '@{{name}}/domains/condo/gql'


type EmptyObjectTypePlaceHolder = {

}

const {
    useObject,
    useObjects,
    useAllObjects,
    useCount,
} = generateReactHooks<B2BAppContext, EmptyObjectTypePlaceHolder, EmptyObjectTypePlaceHolder, QueryAllB2BAppContextsArgs>(clientGql.B2BAppContext)

export {
    useAllObjects,
    useObjects,
    useObject,
    useCount,
}
