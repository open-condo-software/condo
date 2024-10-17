import { useApolloClient } from '@apollo/client'
import { GetActualOrganizationEmployeesDocument } from '@app/condo/gql'
import { OrganizationEmployee as OrganizationEmployeeType, OrganizationTypeType } from '@app/condo/schema'
import { notification } from 'antd'
import { get } from 'lodash'
import React from 'react'

import { useMutation } from '@open-condo/next/apollo'
import { useAuth } from '@open-condo/next/auth'
import { FormattedMessage, useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import { useLayoutContext } from '@condo/domains/common/components/containers/BaseLayout/BaseLayout'
import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'
import { ACCEPT_OR_REJECT_ORGANIZATION_INVITE_BY_ID_MUTATION } from '@condo/domains/organization/gql'
import { OrganizationEmployee } from '@condo/domains/organization/utils/clientSchema'

import { nonNull } from '../../common/utils/nonNull'

import type { OrganizationWhereInput } from '@app/condo/schema'

interface IOrganizationInvitesHookResult {
    loading: boolean
}

export const useOrganizationInvites = (organizationFilter?: OrganizationWhereInput): IOrganizationInvitesHookResult => {
    const intl = useIntl()
    const AcceptMessage = intl.formatMessage({ id: 'Accept' })
    const RejectMessage = intl.formatMessage({ id: 'Reject' })
    const DoneMessage = intl.formatMessage({ id: 'OperationCompleted' })
    const ServerErrorMessage = intl.formatMessage({ id: 'ServerError' })
    const { user, isAuthenticated } = useAuth()
    const userId = get(user, 'id', null)
    const { selectEmployee } = useOrganization()
    const { objs: userInvites, refetch, loading } = OrganizationEmployee.useObjects(
        { where: { user: { id: userId }, isAccepted: false, isRejected: false, isBlocked: false, organization: organizationFilter } },
        { skip: !userId },
    )
    const { addNotification } = useLayoutContext()
    const client = useApolloClient()
    const [acceptOrReject] = useMutation(ACCEPT_OR_REJECT_ORGANIZATION_INVITE_BY_ID_MUTATION, {
        onCompleted: (result: { obj: OrganizationEmployeeType }) => {
            const isAcceptedInvite = result?.obj
                && result.obj.isAccepted
                && !result.obj.isBlocked
                && !result.obj.isRejected
                && [OrganizationTypeType.ManagingCompany, OrganizationTypeType.ServiceProvider].includes(result.obj.organization.type)

            if (isAcceptedInvite) {
                const queryData = {
                    query: GetActualOrganizationEmployeesDocument,
                    variables: { userId: userId },
                }
                const cachedData = client.readQuery(queryData)
                const cachedActualEmployees = Array.isArray(cachedData?.actualEmployees) ? cachedData.actualEmployees.filter(nonNull) : []

                client.writeQuery({
                    ...queryData,
                    data: {
                        actualEmployees: [result.obj, ...cachedActualEmployees],
                    },
                })
            }
        },
    })
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
            await acceptOrReject({ variables: { id: item.id, data: { ...data, dv: 1, sender } } })
            notification.success({ message: DoneMessage })
        } catch (error) {
            notification.error({
                message: ServerErrorMessage,
                description: error.message,
            })
        }
        await refetch()
    }
    if (isAuthenticated && userInvites) {
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
                            name: invite.organization.name,
                        }}
                    />
                ),
                type: 'success',
                id: `invite_${invite.id}`,
            })
        })
    }
    return {
        loading,
    }
}
