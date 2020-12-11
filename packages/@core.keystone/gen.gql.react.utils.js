import { useMemo } from 'react'
import { useMutation, useQuery } from '@core/next/apollo'
import { useIntl } from '@core/next/intl'

function genReactHooks (TestUtils, { convertGQLItemToUIState, convertUIStateToGQLItem, options } = { options: {} }) {
    function useObject (variables) {
        const { loading, refetch, objs, count, error } = useObjects(variables)
        if (count && count > 1) throw new Error('Wrong query condition! return more then one result')
        const obj = (objs.length) ? objs[0] : null
        return { loading, refetch, obj, error }
    }

    function useObjects (variables = {}) {
        let { loading, data, refetch, error } = useQuery(TestUtils.GET_ALL_OBJS_WITH_COUNT_QUERY, {
            variables,
            ...options,
        })

        const intl = useIntl()
        const ServerErrorPleaseTryAgainLaterMsg = intl.formatMessage({ id: 'ServerErrorPleaseTryAgainLater' })
        const AccessErrorMsg = intl.formatMessage({ id: 'AccessError' })

        const objs = useMemo(() => (data && data.objs) ? data.objs.map(convertGQLItemToUIState) : [], [data])
        const count = (data && data.meta) ? data.meta.count : null
        if (error && String(error).includes('not have access')) {
            error = AccessErrorMsg
        } else if (error) {
            error = ServerErrorPleaseTryAgainLaterMsg
        }

        return { loading, refetch, objs, count, error }
    }

    function useCreate (attrs = {}, onComplete) {
        if (typeof attrs !== 'object' || !attrs) throw new Error('useCreate(): invalid attrs argument')
        let [rowAction] = useMutation(TestUtils.CREATE_OBJ_MUTATION)

        async function _action (state) {
            const { data, error } = await rowAction({
                variables: { data: convertUIStateToGQLItem({ ...state, ...attrs }) },
            })
            if (data && data.obj) {
                const result = convertGQLItemToUIState(data.obj)
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
        let [rowAction] = useMutation(TestUtils.UPDATE_OBJ_MUTATION)

        async function _action (state, obj) {
            if (!obj || !obj.id) throw new Error('No obj.id argument')
            const { data, error } = await rowAction({
                variables: {
                    id: obj.id,
                    data: convertUIStateToGQLItem({ ...state, ...attrs }, obj),
                },
            })
            if (data && data.obj) {
                const result = convertGQLItemToUIState(data.obj)
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
        useObject,
        useObjects,
        useCreate,
        useUpdate,
    }
}

export {
    genReactHooks,
}
