import { ApolloQueryResult, QueryHookOptions } from '@apollo/client'
import { FetchMoreOptions } from '@apollo/client/core/ObservableQuery'
import { FetchMoreQueryOptions } from '@apollo/client/core/watchQueryOptions'
import { TypedDocumentNode } from '@graphql-typed-document-node/core'
import dayjs from 'dayjs'
import { DocumentNode } from 'graphql'
import get from 'lodash/get'
import isFunction from 'lodash/isFunction'
import { useCallback, useEffect, useState, useMemo } from 'react'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
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
export type IRefetchType<GQLObject, QueryVariables> = (variables?: Partial<QueryVariables>) => Promise<ApolloQueryResult<IUseObjectsQueryReturnType<GQLObject>>>
type IFetchMoreType<GQLObject, QueryVariables> = (
    (
        fetchMoreOptions: FetchMoreQueryOptions<QueryVariables, IUseObjectsQueryReturnType<GQLObject>> & FetchMoreOptions<IUseObjectsQueryReturnType<GQLObject>, QueryVariables>
    ) => Promise<ApolloQueryResult<IUseObjectsQueryReturnType<GQLObject>>>
) & (
    <TData2, TVariables2>(
        fetchMoreOptions: {
            query?: DocumentNode | TypedDocumentNode<IUseObjectsQueryReturnType<GQLObject>, QueryVariables>
        } & FetchMoreQueryOptions<TVariables2, TData2> & FetchMoreOptions<TData2, TVariables2>
    ) => Promise<ApolloQueryResult<TData2>>
)
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
export type IUseCreateActionType<GQLObject, GQLCreateInput> = (values: Partial<GQLCreateInput>) => Promise<GQLObject>
export type IUseCreateManyActionType<GQLObject, GQLCreateInput> = (values: Array<Partial<GQLCreateInput>>) => Promise<Array<GQLObject>>
export type IUseUpdateActionType<GQLObject, GQLUpdateInput> = (values: Partial<GQLUpdateInput>, obj: IUUIDObject) => Promise<GQLObject>
export type IUseUpdateManyActionType<GQLObject, GQLUpdateInput> = (values: Array<{ data: Partial<GQLUpdateInput> } & IUUIDObject>) => Promise<Array<GQLObject>>
export type IUseSoftDeleteActionType<GQLObject> = (obj: IUUIDObject) => Promise<GQLObject>
export type IUseSoftDeleteManyActionType<GQLObject> = (objs: Array<IUUIDObject>) => Promise<Array<GQLObject>>


export interface IGenerateHooksResult<GQLObject, GQLCreateInput, GQLUpdateInput, QueryVariables> {
    useCreate: (initialValues: Partial<GQLCreateInput>, onComplete?: IOnCompleteType<GQLObject>)
    => IUseCreateActionType<GQLObject, GQLCreateInput>
    useCreateMany: (initialValues: Partial<GQLCreateInput>, onComplete?: IOnCompleteType<Array<GQLObject>>) => IUseCreateManyActionType<GQLObject, GQLCreateInput>
    useUpdate: (initialValues: Partial<GQLUpdateInput>, onComplete?: IOnCompleteType<GQLObject>)
    => IUseUpdateActionType<GQLObject, GQLUpdateInput>
    useUpdateMany: (initialValues: Partial<GQLUpdateInput>, onComplete?: IOnCompleteType<Array<GQLObject>>) => IUseUpdateManyActionType<GQLObject, GQLUpdateInput>
    useSoftDelete: (onComplete?: IOnCompleteType<GQLObject>)
    => IUseSoftDeleteActionType<GQLObject>
    useSoftDeleteMany: (onComplete?: IOnCompleteType<Array<GQLObject>>) => IUseSoftDeleteManyActionType<GQLObject>
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
    SINGULAR_FORM: string
    PLURAL_FORM: string
    MODEL_FIELDS: string
    CREATE_OBJ_MUTATION: DocumentNode
    CREATE_OBJS_MUTATION: DocumentNode
    UPDATE_OBJ_MUTATION: DocumentNode
    UPDATE_OBJS_MUTATION: DocumentNode
    GET_ALL_OBJS_WITH_COUNT_QUERY: DocumentNode
    GET_COUNT_OBJS_QUERY: DocumentNode
}

function nonNull<TVal> (val: TVal): val is NonNullable<TVal> {
    return val !== null && val !== undefined
}

export function generateReactHooks<
    GQLObject,
    GQLCreateInput,
    GQLUpdateInput,
    QueryVariables,
> (gql: IGQLType): IGenerateHooksResult<GQLObject, GQLCreateInput, GQLUpdateInput, QueryVariables> {
    function useCreate (initialValues: Partial<GQLCreateInput>, onComplete?: IOnCompleteType<GQLObject>) {
        const [rowAction] = useMutation(gql.CREATE_OBJ_MUTATION, { fetchPolicy: 'no-cache' })

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

    function useCreateMany (initialValues: Partial<GQLCreateInput>, onComplete?: IOnCompleteType<Array<GQLObject>>) {
        const [rowAction] = useMutation(gql.CREATE_OBJS_MUTATION, { fetchPolicy: 'no-cache' })

        return useCallback(async (values: Array<Partial<GQLCreateInput>>) => {
            const sender = getClientSideSenderInfo()
            const variables = {
                data: values.map(item => ({
                    data: {
                        dv: 1,
                        sender,
                        ...initialValues,
                        ...item,
                    },
                })),
            }

            const { data, errors } = await rowAction({ variables })

            if (data && data.objs) {
                if (isFunction(onComplete)) {
                    onComplete(data.objs)
                }

                return data.objs
            }

            if (errors) {
                console.warn(errors)
                throw errors
            }

            throw new Error('Unknown useCreateMany action result!')
        }, [initialValues, onComplete, rowAction])
    }

    function useUpdate (initialValues: Partial<GQLUpdateInput>, onComplete?: IOnCompleteType<GQLObject>) {
        const [rowAction] = useMutation(gql.UPDATE_OBJ_MUTATION, { fetchPolicy: 'no-cache' })

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

    function useUpdateMany (initialValues: Partial<GQLUpdateInput>, onComplete?: IOnCompleteType<Array<GQLObject>>) {
        const [rowAction] = useMutation(gql.UPDATE_OBJS_MUTATION, { fetchPolicy: 'no-cache' })

        return useCallback(async (values: Array<{ data: Partial<GQLUpdateInput> } & IUUIDObject>) => {
            const sender = getClientSideSenderInfo()
            const variables = {
                data: values.map(item => ({
                    id: item.id,
                    data: {
                        dv: 1,
                        sender,
                        ...initialValues,
                        ...item.data,
                    },
                })),
            }

            const { data, errors } = await rowAction({ variables })

            if (data && data.objs) {
                if (isFunction(onComplete)) {
                    onComplete(data.objs)
                }

                return data.objs
            }

            if (errors) {
                console.warn(errors)
                throw errors
            }

            throw new Error('Unknown useUpdateMany action result!')

        }, [rowAction, initialValues, onComplete])
    }

    function useSoftDelete (onComplete?: IOnCompleteType<GQLObject>) {
        const [rowAction] = useMutation(gql.UPDATE_OBJ_MUTATION, { fetchPolicy: 'no-cache' })

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

    function useSoftDeleteMany (onComplete?: IOnCompleteType<Array<GQLObject>>) {
        const [rowAction] = useMutation(gql.UPDATE_OBJS_MUTATION, { fetchPolicy: 'no-cache' })

        return useCallback(async (objs: Array<IUUIDObject>) => {
            const sender = getClientSideSenderInfo()
            const variables = {
                data: objs.map(item => ({
                    id: item.id,
                    data: {
                        dv: 1,
                        sender,
                        deletedAt: dayjs().toISOString(),
                    },
                })),
            }

            const { data, errors } = await rowAction({ variables })

            if (data && data.objs) {
                if (isFunction(onComplete)) {
                    onComplete(data.objs)
                }

                return data.objs
            }

            if (errors) {
                console.warn(errors)
                throw errors
            }

            throw new Error('Unknown useSoftDeleteMany action result!')
        }, [rowAction, onComplete])
    }

    function useCount (variables: QueryVariables, options?: QueryHookOptions<IUseCountQueryReturnType, QueryVariables>) {
        const intl = useIntl()
        const AccessDeniedError = intl.formatMessage({ id: 'AccessError' })
        const ServerError = intl.formatMessage({ id: 'ServerErrorPleaseTryAgainLater' })

        const { data, error, loading, refetch, fetchMore, stopPolling } = useQuery<IUseObjectsQueryReturnType<GQLObject>, QueryVariables>(gql.GET_COUNT_OBJS_QUERY, {
            variables,
            notifyOnNetworkStatusChange: true,
            ...options,
            ...(typeof options === 'object' && 'fetchPolicy' in options ? null : { fetchPolicy: 'no-cache' }),
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
        const AccessDeniedError = intl.formatMessage({ id: 'AccessError' })
        const ServerError = intl.formatMessage({ id: 'ServerErrorPleaseTryAgainLater' })

        const { data, error, loading, refetch, fetchMore, stopPolling } = useQuery<IUseObjectsQueryReturnType<GQLObject>, QueryVariables>(gql.GET_ALL_OBJS_WITH_COUNT_QUERY, {
            variables,
            notifyOnNetworkStatusChange: true,
            ...options,
            ...(typeof options === 'object' && 'fetchPolicy' in options ? null : { fetchPolicy: 'no-cache' }),
        })

        const objs: GQLObject[] = useMemo(() => (data && data.objs) ? data.objs.filter(nonNull) : [], [data])
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
        const skip = get(options, 'skip')
        const { objs, count, error, loading, refetch: _refetch, fetchMore, stopPolling } = useObjects(variables, {
            ...options,
        })
        const [fetchMoreError, setFetchMoreError] = useState(null)

        // NOTE: returns only the first part of the data
        const refetch: IRefetchType<GQLObject, QueryVariables> = useCallback((...args) => {
            setFetchMoreError(null)
            return _refetch(...args)
        }, [_refetch])

        useDeepCompareEffect(() => {
            setFetchMoreError(null)
        }, [variables])

        const loadMore = useCallback(async (skip) => {
            try {
                await fetchMore({
                    variables: {
                        skip: skip,
                    },
                    updateQuery (previousData, { fetchMoreResult }) {
                        // @ts-ignore
                        const updatedObjs = [...(previousData?.objs.filter(nonNull) || []), ...(fetchMoreResult?.objs?.filter(nonNull) || [])]
                        // @ts-ignore
                        const updatedCount = fetchMoreResult?.meta?.count || previousData?.meta?.count || 0
                        // @ts-ignore
                        return { ...previousData, objs: updatedObjs, count: updatedCount }
                    },
                })
            } catch (error) {
                setFetchMoreError(error)
            }
        }, [fetchMore])

        useEffect(() => {
            if (skip) return
            if (loading) return
            if (error || fetchMoreError) return

            if (objs.length >= count) {
                return
            }

            loadMore(objs.length)
        }, [loadMore, objs.length, count])

        const allDataLoaded = objs.length >= count && !loading
        return {
            loading: !allDataLoaded,
            /** @deprecated use loading field instead */
            allDataLoaded,
            objs,
            count,
            error: error || fetchMoreError,
            refetch,
            fetchMore,
            stopPolling,
        }
    }

    function useObject (variables: QueryVariables, options?: QueryHookOptions<IUseObjectsQueryReturnType<GQLObject>, QueryVariables>) {
        const { objs, count, error, loading, refetch, fetchMore, stopPolling } = useObjects(variables, options)
        if (count && count > 1) {
            console.error({
                msg: 'Wrong query condition! useObject hook must return single value!',
                singularName: gql.SINGULAR_FORM,
                pluralName: gql.PLURAL_FORM,
                modelFields: gql.MODEL_FIELDS,
            })
            throw new Error('Wrong query condition! useObject hook must return single value!')
        }
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
        useCreateMany,
        useUpdate,
        useUpdateMany,
        useSoftDelete,
        useSoftDeleteMany,
        useCount,
        useAllObjects,
    }
}
