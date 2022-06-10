import { useMemo } from 'react'
import { isFunction } from 'lodash/isFunction'
import { ApolloError, QueryHookOptions, OperationVariables } from '@apollo/client'

import { useMutation, useQuery } from '@core/next/apollo'
import { useIntl } from '@core/next/intl'

const getObjects = (objectsContainer, converter) => (objectsContainer && objectsContainer.objs) ? objectsContainer.objs.map(converter) : []

interface Refetch<Q> {
    // TODO(pahaz): write right Refetch signature!
    (variables?: Q): Promise<any>
}

interface FetchMore<Q> {
    (variables?: Q): Promise<any>
}

interface IHookConverters<GQL, GQLInput, UI, UIForm> {
    convertToGQLInput: (state: UIForm, item?: UI) => GQLInput
    convertToUIState: (item: GQL) => UI
}

interface FetchMore<Q> {
    (variables?: Q): Promise<any>
}

interface IHookResult<UI, UIForm, Q, TData = any, TVariables = OperationVariables> {
    gql: any
    useObject: (variables: Q, options?: QueryHookOptions<TData, TVariables>) => { obj: UI, loading: boolean, error?: ApolloError | string, refetch?: Refetch<Q>, fetchMore: FetchMore<Q> }
    useObjects: (variables: Q, options?: QueryHookOptions<TData, TVariables>) => { objs: UI[], count: number | null, loading: boolean, error?: ApolloError | string, refetch?: Refetch<Q>, fetchMore: FetchMore<Q> }
    useCreate: (attrs: UIForm, onComplete: (obj: UI) => void) => (attrs: UIForm) => Promise<UI>
    useUpdate: (attrs: UIForm, onComplete?: (obj: UI) => void) => (attrs: UIForm, obj: UI) => Promise<UI>
    useDelete: (attrs: UIForm, onComplete?: (obj: UI) => void) => (attrs: UIForm) => Promise<UI>
    useSoftDelete: (attrs: UIForm, onComplete?: (obj: UI) => void) => (attrs: UIForm, obj: UI) => Promise<UI>
}

export function generateReactHooks<GQL, GQLInput, UIForm, UI, Q> (gql, { convertToGQLInput, convertToUIState }: IHookConverters<GQL, GQLInput, UI, UIForm>): IHookResult<UI, UIForm, Q> {
    function useObject (variables: Q, options?: QueryHookOptions<{ objs?: GQL[], meta?: { count?: number } }, Q>) {
        const { loading, refetch, fetchMore, objs, count, error } = useObjects(variables, options)

        if (count && count > 1) throw new Error('Wrong query condition! return more then one result')

        const obj = (objs.length) ? objs[0] : null

        return { loading, refetch, fetchMore, obj, error }
    }

    function useObjects (variables: Q, options?: QueryHookOptions<{ objs?: GQL[], meta?: { count?: number } }, Q>) {
        const intl = useIntl()
        const ServerErrorPleaseTryAgainLaterMsg = intl.formatMessage({ id: 'ServerErrorPleaseTryAgainLater' })
        const AccessErrorMsg = intl.formatMessage({ id: 'AccessError' })
        const result = useQuery<{ objs?: GQL[], meta?: { count?: number } }, Q>(gql.GET_ALL_OBJS_WITH_COUNT_QUERY, {
            variables,
            notifyOnNetworkStatusChange: true,
            ...options,
        })
        let error: ApolloError | string

        if (error) {
            error = String(error).includes('not have access') ? AccessErrorMsg : ServerErrorPleaseTryAgainLaterMsg
        }

        const objs: UI[] = getObjects(result.data, convertToUIState)
        const count = (result.data && result.data.meta) ? result.data.meta.count : null

        return {
            loading: result.loading,
            refetch: result.refetch,
            fetchMore: result.fetchMore,
            objs,
            count,
            error,
        }
    }

    /**
     * Client hook that uses create-mutation of current schema
     * @param attrs - values, that will be passed to update input unchanged by form
     */
    function useCreate (attrs: UIForm | Record<string, unknown> = {}, onComplete) {
        if (typeof attrs !== 'object' || !attrs) throw new Error('useCreate(): invalid attrs argument')

        const [rowAction] = useMutation(gql.CREATE_OBJ_MUTATION)

        async function _action (state: UIForm) {
            const { data, errors } = await rowAction({ variables: { data: convertToGQLInput({ ...state, ...attrs }) } })

            if (data && data.obj) {
                const result = convertToUIState(data.obj)

                if (isFunction(onComplete)) onComplete(result)

                return result
            }

            if (errors) {
                console.warn(errors)
                throw errors
            }

            throw new Error('unknown action result')
        }

        return useMemo(() => _action, [rowAction])
    }

    function useUpdate (attrs = {}, onComplete) {
        if (typeof attrs !== 'object' || !attrs) throw new Error('useUpdate(): invalid attrs argument')

        const [rowAction] = useMutation(gql.UPDATE_OBJ_MUTATION)

        async function _action (state, obj) {
            if (!obj || !obj.id) throw new Error('No obj.id argument')

            const { data, errors } = await rowAction({
                variables: {
                    id: obj.id,
                    data: convertToGQLInput({ ...state, ...attrs }, obj),
                },
            })

            if (data && data.obj) {
                const result = convertToUIState(data.obj)

                if (isFunction(onComplete)) onComplete(result)

                return result
            }
            if (errors) {
                console.warn(errors)

                throw errors
            }

            throw new Error('unknown action result')
        }

        return useMemo(() => _action, [rowAction])
    }

    function useDelete (attrs = {}, onComplete) {
        if (typeof attrs !== 'object' || !attrs) throw new Error('useDelete(): invalid attrs argument')

        const [rowAction] = useMutation(gql.DELETE_OBJ_MUTATION)

        async function _action (obj) {
            if (!obj || !obj.id) throw new Error('No obj.id argument')

            const { data, errors } = await rowAction({
                variables: {
                    id: obj.id,
                },
            })

            if (data && data.obj) {
                const result = convertToUIState(data.obj)

                if (isFunction(onComplete)) onComplete(result)

                return result
            }

            if (errors) {
                console.warn(errors)

                throw errors
            }

            throw new Error('unknown action result')
        }

        return useMemo(() => _action, [rowAction])
    }

    function useSoftDelete (attrs = {}, onComplete) {
        if (typeof attrs !== 'object' || !attrs) throw new Error('useSoftDelete(): invalid attrs argument')

        const [rowAction] = useMutation(gql.UPDATE_OBJ_MUTATION)

        async function _action (state, obj) {
            if (!obj.id) throw new Error('No obj.id argument')

            const { data, errors } = await rowAction({
                variables: {
                    id: obj.id,
                    data: convertToGQLInput({ ...state, deletedAt: 'true' }, obj),
                },
            })

            if (data && data.obj) {
                const result = convertToUIState(data.obj)

                if (isFunction(onComplete)) onComplete(result)

                return result
            }

            if (errors) {
                console.warn(errors)

                throw errors
            }

            throw new Error('unknown action result')
        }

        return useMemo(() => _action, [rowAction])
    }

    return {
        gql,
        useObject,
        useObjects,
        useCreate,
        useUpdate,
        useDelete,
        useSoftDelete,
    }
}
