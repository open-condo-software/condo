import { ApolloError } from '@apollo/client'
import { useMemo } from 'react'

import { useMutation, useQuery } from '@open-condo/next/apollo'
import { useIntl } from '@open-condo/next/intl'

const getObjects = (objectsContainer, converter) => (objectsContainer && objectsContainer.objs) ? objectsContainer.objs.map(converter) : []

interface Refetch<Q> {
    // TODO(pahaz): write right Refetch signature!
    (variables?: Q): Promise<any>
}

interface IHookConverters<GQL, GQLInput, UI, UIForm> {
    convertToGQLInput: (state: UIForm, item?: UI) => GQLInput
    convertToUIState: (item: GQL) => UI
}

interface IHookResult<UI, UIForm, Q> {
    gql: any
    useObject: (variables: Q, memoize?: boolean) => { obj: UI, loading: boolean, error?: ApolloError | string, refetch?: Refetch<Q> }
    useObjects: (variables: Q, memoize?: boolean) => { objs: UI[], count: number | null, loading: boolean, error?: ApolloError | string, refetch?: Refetch<Q> }
    useCreate: (attrs: UIForm, onComplete: (obj: UI) => void) => (attrs: UIForm) => Promise<UI>
    useUpdate: (attrs: UIForm, onComplete: (obj: UI) => void) => (attrs: UIForm, obj: UI) => Promise<UI>
    useDelete: (attrs: UIForm, onComplete: (obj: UI) => void) => (attrs: UIForm) => Promise<UI>
}

export function generateReactHooks<GQL, GQLInput, UIForm, UI, Q> (gql, { convertToGQLInput, convertToUIState }: IHookConverters<GQL, GQLInput, UI, UIForm>): IHookResult<UI, UIForm, Q> {
    function useObject (variables: Q, memoize = true) {
        const { loading, refetch, objs, count, error } = useObjects(variables, memoize)
        if (count && count > 1) throw new Error('Wrong query condition! return more then one result')
        const obj = (objs.length) ? objs[0] : null
        return { loading, refetch, obj, error }
    }

    function useObjects (variables: Q, memoize = true) {
        const intl = useIntl()
        const ServerErrorPleaseTryAgainLaterMsg = intl.formatMessage({ id: 'ServerErrorPleaseTryAgainLater' })
        const AccessErrorMsg = intl.formatMessage({ id: 'AccessError' })

        // eslint-disable-next-line prefer-const
        const result = useQuery<{ objs?: GQL[], meta?: { count?: number } }, Q>(gql.GET_ALL_OBJS_WITH_COUNT_QUERY, {
            variables,
        })

        let error: ApolloError | string
        if (error && String(error).includes('not have access')) {
            error = AccessErrorMsg
        } else if (error) {
            error = ServerErrorPleaseTryAgainLaterMsg
        }

        /*
        * There is bug here with nested objs memoization.
        *
        * We should use this tricky solution for manually control default memoization flow.
        * React and eslint recommend to avoid using reactHooks in conditional statements,
        * as result, we should do some tricks with initial objs value calculation.
        * TODO: debug and remove useMemo later
        */
        let objs: UI[] = useMemo(() => {
            return getObjects(result.data, convertToUIState)
        }, [result.data])

        if (!memoize) {
            objs = getObjects(result.data, convertToUIState)
        }

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

    function useCreate (attrs: UIForm | Record<string, unknown> = {}, onComplete) {
        if (typeof attrs !== 'object' || !attrs) throw new Error('useCreate(): invalid attrs argument')
        const [rowAction] = useMutation(gql.CREATE_OBJ_MUTATION)

        async function _action (state: UIForm) {
            const { data, errors } = await rowAction({
                variables: { data: convertToGQLInput({ ...state, ...attrs }) },
            })
            if (data && data.obj) {
                const result = convertToUIState(data.obj)
                if (onComplete) onComplete(result)
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
                if (onComplete) onComplete(result)
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
                if (onComplete) onComplete(result)
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
    }
}
