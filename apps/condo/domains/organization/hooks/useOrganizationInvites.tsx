import { useGetEmployeesInvitesByUserIdAndOrganizationTypeQuery } from '@app/condo/gql'
import { OrganizationEmployee as OrganizationEmployeeType, OrganizationTypeType } from '@app/condo/schema'
import { notification } from 'antd'
import React, { useMemo } from 'react'

import { useCachePersistor } from '@open-condo/apollo'
import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { useAuth } from '@open-condo/next/auth'
import { FormattedMessage, useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import { useLayoutContext } from '@condo/domains/common/components/containers/BaseLayout/BaseLayout'

import type { MutationTuple } from '@apollo/client/react/types/types'


type OrganizationInvitesReturnType = {
    loading: boolean
}

export const useOrganizationInvites = (organizationTypes: Array<OrganizationTypeType>, acceptOrRejectMutation: MutationTuple<{ obj: OrganizationEmployeeType }, any>[0]): OrganizationInvitesReturnType => {
    const intl = useIntl()
    const AcceptMessage = intl.formatMessage({ id: 'Accept' })
    const RejectMessage = intl.formatMessage({ id: 'Reject' })
    const DoneMessage = intl.formatMessage({ id: 'OperationCompleted' })
    const ServerErrorMessage = intl.formatMessage({ id: 'ServerError' })

    const { user, isAuthenticated, isLoading: authLoading } = useAuth()
    const userId = user?.id || null
    const { selectEmployee } = useOrganization()
    const { persistor } = useCachePersistor()

    const {
        data: userInvitationsData,
        refetch,
        loading,
    } = useGetEmployeesInvitesByUserIdAndOrganizationTypeQuery({
        variables: {
            userId,
            organizationType: organizationTypes,
        },
        skip: authLoading || !isAuthenticated || !organizationTypes || organizationTypes.length < 1 || !persistor,
    })
    const userInvites = useMemo(() => userInvitationsData?.invitations?.filter(Boolean) || [], [userInvitationsData?.invitations])

    const { addNotification } = useLayoutContext()

    const handleAcceptOrReject = async (item, action) => {
        let data = {}
        if (action === 'accept') {
            data = { isAccepted: true, isRejected: false }
        } else if (action === 'reject') {
            data = { isAccepted: false, isRejected: true }
        } else if (action === 'leave') {
            data = { isRejected: true }
        }
        const sender = getClientSideSenderInfo()
        try {
            await acceptOrRejectMutation({ variables: { id: item.id, data: { ...data, dv: 1, sender } } })
            notification.success({ message: DoneMessage })
        } catch (error) {
            notification.error({
                message: ServerErrorMessage,
                description: error.message,
            })
        }

        await refetch()
    }
    if (!authLoading && isAuthenticated && userInvites) {
        userInvites.forEach(invite => {
            addNotification({
                actions: [
                    {
                        action: () => handleAcceptOrReject(invite, 'reject'),
                        title: RejectMessage,
                        secondary: true,
                    },
                    {
                        action: () => handleAcceptOrReject(invite, 'accept').then(() => {
                            selectEmployee(invite.id)
                        }),
                        title: AcceptMessage,
                    },
                ],
                message: (
                    <FormattedMessage
                        id='pages.users.InviteMessageTitle'
                        values={{
                            name: invite.organization?.name,
                        }}
                    />
                ),
                description: intl.formatMessage({ id: 'pages.users.InviteMessageDescription' }),
                type: 'info',
                id: `invite_${invite.id}`,
            })
        })
    }
    return {
        loading,
    }
}
