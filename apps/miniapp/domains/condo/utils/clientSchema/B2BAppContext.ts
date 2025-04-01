import { B2BAppContext, QueryAllB2BAppContextsArgs } from '@app/miniapp/condoSchema'

import { generateReactHooks } from '@open-condo/codegen/generate.hooks'

import { clientGql } from '@miniapp/domains/condo/gql'


type EmptyObjectTypePlaceHolder = Record<string, never>

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
