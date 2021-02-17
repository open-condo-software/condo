import { useMemo } from 'react'

import { useMutation } from '@core/next/apollo'
import { genReactHooks } from '@core/keystone/gen.gql.react.utils'

import { OrganizationEmployee, REGISTER_NEW_ORGANIZATION_MUTATION, INVITE_NEW_ORGANIZATION_EMPLOYEE_MUTATION } from '../../schema/Organization.gql'
import { getClientSideSenderInfo } from '../userid.utils'

function convertGQLItemToUIState (item) {
    if (item.dv !== 1) throw new Error('unsupported item.dv')
    return { ...item, dv: undefined }
}

function convertUIStateToGQLItem (state, obj = null) {
    const sender = getClientSideSenderInfo()
    return { dv: 1, sender, ...state }
}

function useRegisterNewOrganization (attrs = {}, onComplete) {
    if (typeof attrs !== 'object' || !attrs) throw new Error('useCreate(): invalid attrs argument')
    let [rowAction] = useMutation(REGISTER_NEW_ORGANIZATION_MUTATION)

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

function useInviteNewOrganizationEmployee (attrs = {}, onComplete) {
    if (typeof attrs !== 'object' || !attrs) throw new Error('useCreate(): invalid attrs argument')
    let [rowAction] = useMutation(INVITE_NEW_ORGANIZATION_EMPLOYEE_MUTATION)

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

module.exports = {
    convertGQLItemToUIState, convertUIStateToGQLItem,
    OrganizationEmployee: genReactHooks(OrganizationEmployee, { convertGQLItemToUIState, convertUIStateToGQLItem }),
    useRegisterNewOrganization,
    useInviteNewOrganizationEmployee,
}
