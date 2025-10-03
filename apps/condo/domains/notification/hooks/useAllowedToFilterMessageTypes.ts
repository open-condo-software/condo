import { useGetB2BAppsWithMessageSettingsQuery, useGetEmployeeB2BAppRolesForSpecificAppsQuery } from '@app/condo/gql'
import { useMemo } from 'react'

import { useCachePersistor } from '@open-condo/apollo'
import { useAuth } from '@open-condo/next/auth'
import { useOrganization } from '@open-condo/next/organization'

import {
    B2B_APP_MESSAGE_TYPES,
    CONDO_MESSAGE_TYPES,
    MessageTypeAllowedToFilterType,
} from '@condo/domains/notification/utils/client/constants'


type UseAllowedToFilterMessageTypesResultType = {
    loading: boolean
    messageTypes: Array<MessageTypeAllowedToFilterType>
}
type UseAllowedToFilterMessageTypesType = () => UseAllowedToFilterMessageTypesResultType

export const useAllowedToFilterMessageTypes: UseAllowedToFilterMessageTypesType = () => {
    const { persistor } = useCachePersistor()
    const { isAuthenticated, isLoading: userIsLoading } = useAuth()
    const { role, organization, isLoading: organizationIsLoading } = useOrganization()

    const roleId = useMemo(() => role?.id, [role?.id])
    // Spread B2B_APP_MESSAGE_TYPES to make array mutable (need for getB2BAppsWithMessageSettings query variable)
    const messageTypesToFilter = useMemo(() => [...B2B_APP_MESSAGE_TYPES], [])

    const {
        data: appMessageSettingsData,
        loading: appMessageSettingsLoading,
    } = useGetB2BAppsWithMessageSettingsQuery({
        variables: {
            messageTypes: messageTypesToFilter,
        },
        skip: !persistor || userIsLoading || organizationIsLoading || !isAuthenticated || !organization,
    })
    const b2bAppToMessageType = useMemo(
        () => appMessageSettingsData?.settings?.filter(Boolean)?.reduce((result, setting) => {
            if (result[setting.b2bApp.id] === undefined)
                result[setting.b2bApp.id] = [setting.type]
            else {
                result[setting.b2bApp.id] = [...result[setting.b2bApp.id], setting.type]
            }
            return result
        }, {}) || {},
        [appMessageSettingsData?.settings])

    const b2bAppIds = useMemo(() => Object.keys(b2bAppToMessageType) || [],
        [b2bAppToMessageType])
    const {
        data: userB2bRolesData,
        loading: userB2BRolesLoading,
    } = useGetEmployeeB2BAppRolesForSpecificAppsQuery({
        variables: {
            employeeRoleId: roleId,
            b2bAppIds,
        },
        skip: !persistor || userIsLoading || organizationIsLoading || !isAuthenticated || !organization
         || appMessageSettingsLoading || !roleId || b2bAppIds.length === 0,
    })
    const b2bAppsWithEmployeeRoles = useMemo(() => userB2bRolesData?.b2bRoles?.filter(Boolean)?.map(role => role?.app?.id) || [],
        [userB2bRolesData?.b2bRoles])
    const availableB2BAppMessageTypes = useMemo(
        () => {
            const result = b2bAppsWithEmployeeRoles.map(b2bAppId => b2bAppToMessageType[b2bAppId]).filter(Boolean) || []

            return result.reduce((acc, val) => [...acc, ...val], [])
        },
        [b2bAppToMessageType, b2bAppsWithEmployeeRoles])
    const b2bAppMessageTypesToFilter = useMemo(() => B2B_APP_MESSAGE_TYPES.filter(type => availableB2BAppMessageTypes.includes(type)),
        [availableB2BAppMessageTypes])

    return useMemo(() => ({
        loading: appMessageSettingsLoading || userB2BRolesLoading,
        messageTypes: [...CONDO_MESSAGE_TYPES, ...b2bAppMessageTypesToFilter] as Array<MessageTypeAllowedToFilterType>,
    }), [appMessageSettingsLoading, b2bAppMessageTypesToFilter, userB2BRolesLoading])
}