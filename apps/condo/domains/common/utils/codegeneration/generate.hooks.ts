import { useMemo } from 'react'
import { ApolloError } from '@apollo/client'

import { useMutation, useQuery } from '@core/next/apollo'
import { useIntl } from '@core/next/intl'

const getObjects = (objectsContainer, converter) => (objectsContainer && objectsContainer.objs) ? objectsContainer.objs.map(converter) : []

interface IHookConverters<GQL, GQLInput, UI, UIForm> {
    convertToGQLInput: (state: UIForm) => GQLInput
    convertToUIState: (x: GQL) => UI
}

interface IHookResult<UI, UIForm, Q> {
    useObject: (variables: Q, memoize: boolean) => { obj: UI }
    useObjects: (variables: Q, memoize: boolean) => { objs: UI[], count: number | null, loading: boolean, error?: ApolloError }
    useCreate: (attrs: UIForm, onComplete: (obj: UI) => void) => { obj: UI }
    useUpdate: (attrs: UIForm, onComplete: (obj: UI) => void) => { obj: UI }
    useDelete: (attrs: UIForm, onComplete: (obj: UI) => void) => { obj: UI }
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

        let { loading, data, refetch, error, fetchMore } = useQuery<GQL, Q>(gql.GET_ALL_OBJS_WITH_COUNT_QUERY, {
            variables,
        })

        /*
        * There is bug here with nested objects memoization.
        *
        * We should use this tricky solution for manually control default memoization flow.
        * React and eslint recommend to avoid using reactHooks in conditional statements,
        * as result, we should do some tricks with initial objects value calculation.
        * TODO: debug and remove useMemo later
        */
        let objects = useMemo(() => {
            return getObjects(data, convertToUIState)
        }, [data])

        if (!memoize) {
            objects = getObjects(data, convertToUIState)
        }

        const count = (data && data.meta) ? data.meta.count : null

        if (error && String(error).includes('not have access')) {
            error = AccessErrorMsg
        } else if (error) {
            error = ServerErrorPleaseTryAgainLaterMsg
        }

        return { loading, refetch, fetchMore, objs: objects, count, error }
    }

    function useCreate (attrs: UIForm = {}, onComplete) {
        if (typeof attrs !== 'object' || !attrs) throw new Error('useCreate(): invalid attrs argument')
        let [rowAction] = useMutation(gql.CREATE_OBJ_MUTATION)

        async function _action (state) {
            const { data, error } = await rowAction({
                variables: { data: convertToGQLInput({ ...state, ...attrs }) },
            })
            if (data && data.obj) {
                const result = convertToUIState(data.obj)
                if (onComplete) onComplete(result)
                return result
            }
            if (error) {
                console.warn(error)
                throw error
            }
            throw new Error('unknown action result')
        }

        return useMemo(() => _action, [rowAction])
    }

    function useUpdate (attrs = {}, onComplete) {
        if (typeof attrs !== 'object' || !attrs) throw new Error('useUpdate(): invalid attrs argument')
        let [rowAction] = useMutation(gql.UPDATE_OBJ_MUTATION)

        async function _action (state, obj) {
            if (!obj || !obj.id) throw new Error('No obj.id argument')
            const { data, error } = await rowAction({
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
            if (error) {
                console.warn(error)
                throw error
            }
            throw new Error('unknown action result')
        }

        return useMemo(() => _action, [rowAction])
    }

    function useDelete (attrs = {}, onComplete) {
        if (typeof attrs !== 'object' || !attrs) throw new Error('useDelete(): invalid attrs argument')
        let [rowAction] = useMutation(gql.DELETE_OBJ_MUTATION)

        async function _action (obj) {
            if (!obj || !obj.id) throw new Error('No obj.id argument')
            const { data, error } = await rowAction({
                variables: {
                    id: obj.id,
                },
            })
            if (data && data.obj) {
                const result = convertToUIState(data.obj)
                if (onComplete) onComplete(result)
                return result
            }
            if (error) {
                console.warn(error)
                throw error
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
