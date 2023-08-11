import { ApolloQueryResult, QueryHookOptions } from '@apollo/client'
import { FetchMoreOptions } from '@apollo/client/core/ObservableQuery'
import { FetchMoreQueryOptions } from '@apollo/client/core/watchQueryOptions'
import { TypedDocumentNode } from '@graphql-typed-document-node/core'
import dayjs from 'dayjs'
import { DocumentNode } from 'graphql'
import isFunction from 'lodash/isFunction'
import { useCallback, useEffect, useState } from 'react'

import { getClientSideSenderInfo } from '@open-condo/codegen/utils/userId'
import { useMutation, useQuery } from '@open-condo/next/apollo'
import { useIntl } from '@open-condo/next/intl'


import { useDeepCompareEffect } from './utils/useDeepCompareEffect'

type IUUIDObject = { id: string }
type IOnCompleteType<GQLObject> = (obj: GQLObject) => void
type IUseObjectsQueryReturnType<GQLObject> = {
    objs?: GQLObject[]
    meta?: { count?: number }
}
type IUseCountQueryReturnType = {
    meta?: { count?: number }
}
type IRefetchType<GQLObject, QueryVariables> = (variables?: Partial<QueryVariables>) => Promise<ApolloQueryResult<IUseObjectsQueryReturnType<GQLObject>>>
type IFetchMoreType<GQLObject, QueryVariables> = (<K extends keyof QueryVariables>(fetchMoreOptions: FetchMoreQueryOptions<QueryVariables, K, IUseObjectsQueryReturnType<GQLObject>> & FetchMoreOptions<IUseObjectsQueryReturnType<GQLObject>, QueryVariables>) => Promise<ApolloQueryResult<IUseObjectsQueryReturnType<GQLObject>>>) & (<TData2, TVariables2, K extends keyof TVariables2>(fetchMoreOptions: {
    query?: DocumentNode | TypedDocumentNode<IUseObjectsQueryReturnType<GQLObject>, QueryVariables>;
} & FetchMoreQueryOptions<TVariables2, K, QueryVariables> & FetchMoreOptions<TData2, TVariables2>) => Promise<ApolloQueryResult<TData2>>)
type IStopPollingType = () => void
type IBasicUseQueryResult<GQLObject, QueryVariables> = {
    loading: boolean
    error?: string
    refetch: IRefetchType<GQLObject, QueryVariables>
    fetchMore: IFetchMoreType<GQLObject, QueryVariables>
    stopPolling: IStopPollingType
}
type IUseObjectsReturnType<GQLObject, QueryVariables> = IBasicUseQueryResult<GQLObject, QueryVariables> & {
    objs: GQLObject[]
    count: number | null
}
type IUseAllObjectsReturnType<GQLObject, QueryVariables> = IUseObjectsReturnType<GQLObject, QueryVariables> & {
    allDataLoaded: boolean
}
type IUseObjectReturnType<GQLObject, QueryVariables> = IBasicUseQueryResult<GQLObject, QueryVariables> & {
    obj: GQLObject | null
}
type IUseCountReturnType<GQLObject, QueryVariables> = IBasicUseQueryResult<GQLObject, QueryVariables> & {
    count: number
}
type IUseCreateActionType<GQLObject, GQLCreateInput> = (values: Partial<GQLCreateInput>) => Promise<GQLObject>
type IUseUpdateActionType<GQLObject, GQLUpdateInput> = (values: Partial<GQLUpdateInput>, obj: IUUIDObject) => Promise<GQLObject>
type IUseSoftDeleteActionType<GQLObject> = (obj: IUUIDObject) => Promise<GQLObject>


export interface IGenerateHooksResult<GQLObject, GQLCreateInput, GQLUpdateInput, QueryVariables> {
    useCreate: (initialValues: Partial<GQLCreateInput>, onComplete?: IOnCompleteType<GQLObject>)
    => IUseCreateActionType<GQLObject, GQLCreateInput>
    useUpdate: (initialValues: Partial<GQLUpdateInput>, onComplete?: IOnCompleteType<GQLObject>)
    => IUseUpdateActionType<GQLObject, GQLUpdateInput>
    useSoftDelete: (onComplete?: IOnCompleteType<GQLObject>)
    => IUseSoftDeleteActionType<GQLObject>
    useObjects: (variables: QueryVariables, options?: QueryHookOptions<IUseObjectsQueryReturnType<GQLObject>, QueryVariables>)
    => IUseObjectsReturnType<GQLObject, QueryVariables>
    useAllObjects: (variables: QueryVariables, options?: QueryHookOptions<IUseObjectsQueryReturnType<GQLObject>, QueryVariables>)
    => IUseAllObjectsReturnType<GQLObject, QueryVariables>
    useObject: (variables: QueryVariables, options?: QueryHookOptions<IUseObjectsQueryReturnType<GQLObject>, QueryVariables>)
    => IUseObjectReturnType<GQLObject, QueryVariables>
    useCount: (variables: QueryVariables, options?: QueryHookOptions<IUseCountQueryReturnType, QueryVariables>)
    => IUseCountReturnType<GQLObject, QueryVariables>
}

type IGQLType = {
    CREATE_OBJ_MUTATION: DocumentNode
    UPDATE_OBJ_MUTATION: DocumentNode
    GET_ALL_OBJS_WITH_COUNT_QUERY: DocumentNode
    GET_COUNT_OBJS_QUERY: DocumentNode
}

export function generateReactHooks<
    GQLObject,
    GQLCreateInput,
    GQLUpdateInput,
    QueryVariables,
> (gql: IGQLType): IGenerateHooksResult<GQLObject, GQLCreateInput, GQLUpdateInput, QueryVariables> {
    function useCreate (initialValues: Partial<GQLCreateInput>, onComplete?: IOnCompleteType<GQLObject>) {
        const [rowAction] = useMutation(gql.CREATE_OBJ_MUTATION)

        return useCallback(async (values: Partial<GQLCreateInput>) => {
            const sender = getClientSideSenderInfo()
            const variables = {
                data: {
                    dv: 1,
                    sender,
                    ...initialValues,
                    ...values,
                },
            }

            const { data, errors } = await rowAction({ variables })

            if (data && data.obj) {
                if (isFunction(onComplete)) {
                    onComplete(data.obj)
                }

                return data.obj
            }

            if (errors) {
                console.warn(errors)
                throw errors
            }

            throw new Error('Unknown useCreate action result!')
        }, [rowAction, initialValues, onComplete])
    }

    function useUpdate (initialValues: Partial<GQLUpdateInput>, onComplete?: IOnCompleteType<GQLObject>) {
        const [rowAction] = useMutation(gql.UPDATE_OBJ_MUTATION)

        return useCallback(async (values: Partial<GQLUpdateInput>, obj: IUUIDObject) => {
            const sender = getClientSideSenderInfo()
            const variables = {
                id: obj.id,
                data: {
                    dv: 1,
                    sender,
                    ...initialValues,
                    ...values,
                },
            }
            const { data, errors } = await rowAction({ variables })

            if (data && data.obj) {
                if (isFunction(onComplete)) {
                    onComplete(data.obj)
                }

                return data.obj
            }

            if (errors) {
                console.warn(errors)
                throw errors
            }

            throw new Error('Unknown useUpdate action result!')

        }, [rowAction, initialValues, onComplete])
    }

    function useSoftDelete (onComplete?: IOnCompleteType<GQLObject>) {
        const [rowAction] = useMutation(gql.UPDATE_OBJ_MUTATION)

        return useCallback(async (obj: IUUIDObject) => {
            const sender = getClientSideSenderInfo()
            const variables = {
                id: obj.id,
                data: {
                    dv: 1,
                    sender,
                    deletedAt: dayjs().toISOString(),
                },
            }

            const { data, errors } = await rowAction({ variables })

            if (data && data.obj) {
                if (isFunction(onComplete)) {
                    onComplete(data.obj)
                }

                return data.obj
            }

            if (errors) {
                console.warn(errors)
                throw errors
            }

            throw new Error('Unknown useSoftDelete action result!')
        }, [rowAction, onComplete])
    }

    function useCount (variables: QueryVariables, options?: QueryHookOptions<IUseCountQueryReturnType, QueryVariables>) {
        const intl = useIntl()
        const AccessDeniedError = intl.formatMessage({ id: 'accessError' })
        const ServerError = intl.formatMessage({ id: 'serverErrorPleaseTryAgainLater' })

        const { data, error, loading, refetch, fetchMore, stopPolling } = useQuery<IUseObjectsQueryReturnType<GQLObject>, QueryVariables>(gql.GET_COUNT_OBJS_QUERY, {
            variables,
            notifyOnNetworkStatusChange: true,
            ...options,
        })

        const count = (data && data.meta) ? data.meta.count : null
        const typedRefetch: IRefetchType<GQLObject, QueryVariables> = refetch
        const typedFetchMore: IFetchMoreType<GQLObject, QueryVariables> = fetchMore
        const typedStopPolling: IStopPollingType = stopPolling

        let readableError

        if (error) {
            readableError = String(error).includes('not have access') ? AccessDeniedError : ServerError
            console.warn(error)
        }

        return {
            loading,
            count,
            error: readableError,
            refetch: typedRefetch,
            fetchMore: typedFetchMore,
            stopPolling: typedStopPolling,
        }
    }

    function useObjects (variables: QueryVariables, options?: QueryHookOptions<IUseObjectsQueryReturnType<GQLObject>, QueryVariables>) {
        const intl = useIntl()
        const AccessDeniedError = intl.formatMessage({ id: 'accessError' })
        const ServerError = intl.formatMessage({ id: 'serverErrorPleaseTryAgainLater' })

        const { data, error, loading, refetch, fetchMore, stopPolling } = useQuery<IUseObjectsQueryReturnType<GQLObject>, QueryVariables>(gql.GET_ALL_OBJS_WITH_COUNT_QUERY, {
            variables,
            notifyOnNetworkStatusChange: true,
            ...options,
        })

        const objs: GQLObject[] = (data && data.objs) ? data.objs : []
        const count = (data && data.meta) ? data.meta.count : null
        const typedRefetch: IRefetchType<GQLObject, QueryVariables> = refetch
        const typedFetchMore: IFetchMoreType<GQLObject, QueryVariables> = fetchMore
        const typedStopPolling: IStopPollingType = stopPolling

        let readableError

        if (error) {
            readableError = String(error).includes('not have access') ? AccessDeniedError : ServerError
            console.warn(error)
        }

        return {
            loading,
            objs,
            count,
            error: readableError,
            refetch: typedRefetch,
            fetchMore: typedFetchMore,
            stopPolling: typedStopPolling,
        }
    }

    function useAllObjects (variables: QueryVariables, options?: QueryHookOptions<IUseObjectsQueryReturnType<GQLObject>, QueryVariables>) {
        const { objs, count, error, loading, refetch: _refetch, fetchMore, stopPolling } = useObjects(variables, options)
        const [data, setData] = useState(objs)
        const [fetchMoreError, setFetchMoreError] = useState()

        const refetch: IRefetchType<GQLObject, QueryVariables> = useCallback((...args) => {
            setData([])
            return _refetch(...args)
        }, [_refetch])

        useDeepCompareEffect(() => {
            setData([])
        }, [variables])

        useEffect(() => {
            const isAllDataLoaded = objs.length === count || data.length === count
            if (isAllDataLoaded || loading || error || fetchMoreError) {
                return
            }

            if (data.length === 0) {
                setData(objs)
                return
            }

            fetchMore({
                variables: {
                    skip: data.length,
                },
            })
                // @ts-ignore
                .then(({ data }) => setData(prevData => [...prevData, ...data.objs]))
                .catch(e => setFetchMoreError(e))
        }, [loading, data.length])

        return {
            loading,
            allDataLoaded: data.length === 0 ? objs.length === count : data.length === count,
            objs: data.length === 0 ? objs : data,
            count,
            error: error || fetchMoreError,
            refetch,
            fetchMore,
            stopPolling,
        }
    }

    function useObject (variables: QueryVariables, options?: QueryHookOptions<IUseObjectsQueryReturnType<GQLObject>, QueryVariables>) {
        const { objs, count, error, loading, refetch, fetchMore, stopPolling } = useObjects(variables, options)
        if (count && count > 1) throw new Error('Wrong query condition! useObject hook must return single value!')
        const obj = (objs && objs.length) ? objs[0] : null

        return {
            obj,
            loading,
            error,
            refetch,
            fetchMore,
            stopPolling,
        }
    }

    return {
        useObject,
        useObjects,
        useCreate,
        useUpdate,
        useSoftDelete,
        useCount,
        useAllObjects,
    }
}
