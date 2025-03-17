import { useApolloClient } from '@apollo/client'
import {
    GetActualOrganizationEmployeesDocument,
    useAcceptOrRejectOrganizationInviteMutation,
    useGetLastEmployeeInviteQuery, useGetOrganizationEmployeeExistenceQuery,
} from '@app/condo/gql'
import { OrganizationTypeType } from '@app/condo/schema'
import pickBy from 'lodash/pickBy'
import Head from 'next/head'
import React, { ReactNode, useCallback, useMemo } from 'react'

import { useCachePersistor } from '@open-condo/apollo'
import { useAuth } from '@open-condo/next/auth'
import { useOrganization } from '@open-condo/next/organization'
import { Button, Space, Typography } from '@open-condo/ui'

import { LayoutWithPoster } from '@condo/domains/common/components/containers/LayoutWithPoster'
import { Loader } from '@condo/domains/common/components/Loader'
import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'
import { AuthPoster } from '@condo/domains/user/components/containers/AuthPoster'
import { WelcomeHeaderTitle } from '@condo/domains/user/components/UserWelcomeTitle'

import './OrganizationExistenceRequired.css'
import { CreateOrganizationForm } from './CreateOrganizationForm'

import { FormWithAction } from '../../common/components/containers/FormList'


type OrganizationExistenceRequiredProps = {
    children: ReactNode
}

export const OrganizationExistenceRequired: React.FC<OrganizationExistenceRequiredProps> = ({ children }) => {
    const client = useApolloClient()

    const { persistor } = useCachePersistor()
    const { user, isLoading: userLoading } = useAuth()
    const { organization, isLoading: organizationLoading, selectEmployee } = useOrganization()

    const initialDataLoading = !persistor || userLoading || organizationLoading

    // skip queries if user is not logged in or he has organization already
    // skip => initialDataLoading || !user || !!organization
    const skipQueryStatement = initialDataLoading || !user || !!organization

    const {
        data: employeeExistenceData,
        loading: employeeExistenceLoading,
    } = useGetOrganizationEmployeeExistenceQuery({
        variables: {
            userId: user?.id,
        },
        skip: skipQueryStatement,
    })

    const isEmployeeExist = useMemo(() => employeeExistenceData?.actualEmployees?.length > 0, [employeeExistenceData?.actualEmployees])

    const {
        data: lastInviteData,
        loading: lastInviteLoading,
        refetch: refetchLastInvite,
    } = useGetLastEmployeeInviteQuery({
        variables: {
            userId: user?.id,
        },
        skip: skipQueryStatement || employeeExistenceLoading,
    })
    const lastInvite = useMemo(() => lastInviteData?.employees?.filter(Boolean)?.[0], [lastInviteData?.employees])

    const [acceptOrRejectInvite] = useAcceptOrRejectOrganizationInviteMutation()

    const handleAcceptOrReject = useCallback(async (isAccepted: boolean, isRejected: boolean) => {
        const result = await acceptOrRejectInvite({
            variables: {
                id: lastInvite?.id,
                data: {
                    dv: 1,
                    sender: getClientSideSenderInfo(),
                    ...pickBy({ isAccepted, isRejected }),
                },
            },
        })

        const invite = result.data.invite
        const isAcceptedInvite = invite?.isAccepted
            && !invite?.isBlocked
            && !invite?.isRejected
            && [OrganizationTypeType.ManagingCompany, OrganizationTypeType.ServiceProvider].includes(invite?.organization?.type)

        if (isAcceptedInvite) {
            await selectEmployee(invite.id)
        }

        // Надо? Как в Header. Мб для того чтобы в селекте норм отображалось.
        //    await client.refetchQueries({
        //      include: [GetActualOrganizationEmployeesDocument],
        //    })

        await refetchLastInvite()
    }, [acceptOrRejectInvite, lastInvite?.id, refetchLastInvite, selectEmployee])

    const loading = lastInviteLoading || initialDataLoading || employeeExistenceLoading

    console.log('loading', loading, isEmployeeExist, !user)

    // If user has employee => skip this screens
    if (loading || isEmployeeExist || !user || !!organization) {
        return <>{children}</>
    }

    let content = <CreateOrganizationForm />

    // If user has invites => show last invite to him
    if (lastInvite) {
        content = (
            <Space size={40} direction='vertical' align='center' className='initial-organization-invite'>
                <Space size={24} direction='vertical'>
                    <Typography.Title level={2}>Вас пригласила организация {lastInvite.organization?.name}</Typography.Title>
                    <Typography.Text type='secondary' size='large'>
                        Примите приглашение, если вы сотрудник этой организации и хотите присоединиться
                    </Typography.Text>
                </Space>
                <Space size={20} direction='vertical' className='initial-organization-invite-buttons'>
                    <Button type='primary' onClick={() => handleAcceptOrReject(true, false)}>
                        Принять
                    </Button>
                    <Button type='secondary' onClick={() => handleAcceptOrReject(false, true)}>
                        Отклонить
                    </Button>
                </Space>
            </Space>
        )
    }

    // if (organizationEmployeeRequest) ...

    return (
        <>
            <Head>
                <title>ахаха)</title>
            </Head>
            <LayoutWithPoster
                headerAction={<WelcomeHeaderTitle userType='staff'/>}
                Poster={AuthPoster}
            >
                {content}
            </LayoutWithPoster>
        </>
    )
}
