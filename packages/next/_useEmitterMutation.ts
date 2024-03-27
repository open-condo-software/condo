import {
    useMutation,
} from '@apollo/client'
import { OperationVariables } from '@apollo/client/core'
import { FetchResult } from '@apollo/client/link/core'
import { MutationFunctionOptions, MutationHookOptions, MutationTuple } from '@apollo/client/react/types/types'
import { TypedDocumentNode } from '@graphql-typed-document-node/core'
import { EventEmitter } from 'eventemitter3'
import { DocumentNode } from 'graphql'
import { get } from 'lodash'

export const MUTATION_RESULT_EVENT = 'MutationResult'

const eventEmitter = new EventEmitter()

const MutationEmitter = {
    on: (event, fn) => eventEmitter.on(event, fn),
    once: (event, fn) => eventEmitter.once(event, fn),
    off: (event, fn) => eventEmitter.off(event, fn),
    emit: (event, payload) => eventEmitter.emit(event, payload),
    addListener: (event, fn) => eventEmitter.addListener(event, fn),
    removeListener: (event, fn) => eventEmitter.removeListener(event, fn),
}

export function _useEmitterMutation<TData = any, TVariables = OperationVariables> (mutation: DocumentNode | TypedDocumentNode<TData, TVariables>, options?: MutationHookOptions<TData, TVariables>): MutationTuple<TData, TVariables> {
    const [originalAction, result] = useMutation<TData, TVariables>(mutation, options)

    async function action (options?: MutationFunctionOptions<TData, TVariables>): Promise<FetchResult<TData>> {
        const result = await originalAction(options)
        const { data } = result
        const mutationKind = get(mutation, 'kind')
        if (data && mutationKind === 'Document') {
            const operation = 'mutation'
            const name = get(mutation, ['definitions', '0', 'name', 'value'], null)
            MutationEmitter.emit(MUTATION_RESULT_EVENT, {
                operation,
                name,
                data,
            })
        }

        return result
    }

    return [action, result]
}

export {
    MutationEmitter,
}