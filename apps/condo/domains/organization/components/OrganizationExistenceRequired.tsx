import {
    useAcceptOrRejectOrganizationInviteMutation,
    useGetLastEmployeeInviteQuery,
    useGetLastUserOrganizationEmployeeRequestQuery,
    useSendOrganizationEmployeeRequestMutation,
    useGetOrganizationEmployeeExistenceQuery,
} from '@app/condo/gql'
import { OrganizationTypeType } from '@app/condo/schema'
import pickBy from 'lodash/pickBy'
import getConfig from 'next/config'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { ReactNode, useCallback, useMemo, useState } from 'react'

import { useCachePersistor } from '@open-condo/apollo'
import { getClientSideSenderInfo } from '@open-condo/codegen/utils/userId'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Alert, Button, Modal, Space, Typography } from '@open-condo/ui'

import { LayoutWithPoster } from '@condo/domains/common/components/containers/LayoutWithPoster'
import { Loader } from '@condo/domains/common/components/Loader'
import { useMutationErrorHandler } from '@condo/domains/common/hooks/useMutationErrorHandler'
import { MAX_ORGANIZATION_EMPLOYEE_REQUEST_RETRIES } from '@condo/domains/organization/constants/common'
import { SecondaryLink } from '@condo/domains/user/components/auth/SecondaryLink'
import { AuthPoster } from '@condo/domains/user/components/containers/AuthPoster'
import { WelcomeHeaderTitle } from '@condo/domains/user/components/UserWelcomeTitle'

import { CreateOrganizationForm } from './CreateOrganizationForm'

import './OrganizationExistenceRequired.css'


const {
    publicRuntimeConfig: { HelpRequisites },
} = getConfig()

type OrganizationExistenceRequiredProps = {
    children: ReactNode
}

export const OrganizationExistenceRequired: React.FC<OrganizationExistenceRequiredProps> = ({ children }) => {
    const intl = useIntl()
    const Accept = intl.formatMessage({ id: 'Accept' })
    const Reject = intl.formatMessage({ id: 'Reject' })
    const CancelModalTitle = intl.formatMessage({ id: 'organization.createOrganizationForm.cancelModal.title' })
    const LeaveMessage = intl.formatMessage({ id: 'Leave' })
    const RemainMessage = intl.formatMessage({ id: 'Remain' })
    const CancelModalMessage = intl.formatMessage({ id: 'organization.createOrganizationForm.cancelModal.message' })
    const RejectedRequestMessage = intl.formatMessage({ id: 'organization.createOrganizationForm.rejectedRequest.message' })
    const SendAgainMessage = intl.formatMessage({ id: 'organization.createOrganizationForm.rejectedRequest.sendAgain' })
    const CreateOtherOrganizationMessage = intl.formatMessage({ id: 'organization.createOrganizationForm.rejectedRequest.createOtherOrganization' })
    const OrganizationEmployeeRequestDescription = intl.formatMessage({ id: 'organization.createOrganizationForm.request.description' })
    const ChatInTelegramMessage = intl.formatMessage({ id: 'organization.createOrganizationForm.supportChat' })
    const OrganizationEmployeeRequestAlert = intl.formatMessage({ id: 'organization.createOrganizationForm.request.alert.description' }, {
        supportChat: (
            <SecondaryLink target='_blank' href={HelpRequisites?.support_bot ? `https://t.me/${HelpRequisites.support_bot}` : '#'}>
                {ChatInTelegramMessage}
            </SecondaryLink>
        ),
    })
    const InviteEmployeeDescription = intl.formatMessage({ id: 'organization.createOrganizationForm.invite.description' })
    const CreateOrganizationTitle = intl.formatMessage({ id: 'pages.organizations.CreateOrganizationModalTitle' })

    const router = useRouter()
    const { persistor } = useCachePersistor()
    const { user, isLoading: userLoading, signOut } = useAuth()
    const { selectEmployee } = useOrganization()

    const [showOrganizationForm, setShowOrganizationForm] = useState<boolean>(false)
    const [isCancelModalOpen, setIsCancelModalOpen] = useState<boolean>(false)

    const onError = useMutationErrorHandler()

    // getActualOrganizationEmployees?
    const {
        data: employeeExistenceData,
        loading: employeeExistenceLoading,
    } = useGetOrganizationEmployeeExistenceQuery({
        variables: {
            userId: user?.id,
        },
        onError,
        skip: !persistor || userLoading || !user,
    })
    const isEmployeeExist = useMemo(() => employeeExistenceData?.actualEmployees?.length > 0, [employeeExistenceData?.actualEmployees])

    const skipQueryStatement = !persistor || userLoading || !user || employeeExistenceLoading || isEmployeeExist

    const {
        data: lastInviteData,
        loading: lastInviteLoading,
        refetch: refetchLastInvite,
    } = useGetLastEmployeeInviteQuery({
        variables: {
            userId: user?.id,
        },
        onError,
        skip: skipQueryStatement,
    })
    const lastInvite = useMemo(() => lastInviteData?.employees?.filter(Boolean)?.[0], [lastInviteData?.employees])

    const {
        data: lastOrganizationEmployeeRequestData,
        loading: lastOrganizationEmployeeRequestLoading,
        refetch: refetchLastOrganizationEmployeeRequest,
    } = useGetLastUserOrganizationEmployeeRequestQuery({
        variables: {
            userId: user?.id,
        },
        onError,
        skip: skipQueryStatement || lastInviteLoading,
    })
    const lastOrganizationEmployeeRequest = useMemo(() => lastOrganizationEmployeeRequestData?.requests?.[0], [lastOrganizationEmployeeRequestData?.requests])

    const [acceptOrRejectInvite] = useAcceptOrRejectOrganizationInviteMutation({ onError })
    const [sendOrganizationEmployeeRequest] = useSendOrganizationEmployeeRequestMutation({ onError })

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

        await refetchLastInvite()
    }, [acceptOrRejectInvite, lastInvite?.id, refetchLastInvite, selectEmployee])

    const handleRetryOrganizationEmployeeRequest = useCallback(async () => {
        await sendOrganizationEmployeeRequest({
            variables: {
                data: {
                    dv: 1,
                    sender: getClientSideSenderInfo(),
                    organization: { id: lastOrganizationEmployeeRequest?.organizationId },
                },
            },
        })

        await refetchLastOrganizationEmployeeRequest()
    }, [lastOrganizationEmployeeRequest?.organizationId, refetchLastOrganizationEmployeeRequest, sendOrganizationEmployeeRequest])

    const handleCancelOrganizationCreation = useCallback(async () => {
        await signOut()
        // pass next link?
        await router.push('/auth/signin')
        setIsCancelModalOpen(false)
        setShowOrganizationForm(false)
    }, [router, signOut])

    const pageDataLoading = lastInviteLoading || lastOrganizationEmployeeRequestLoading

    if (userLoading || employeeExistenceLoading) {
        return <Loader fill size='large' />
    }

    // If there is no user or user has employee => skip this screens
    if (!user || isEmployeeExist) {
        return <>{children}</>
    }

    let content = (
        <>
            <CreateOrganizationForm
                type='form'
                onSendOrganizationRequest={async () => {
                    await refetchLastOrganizationEmployeeRequest()
                    setShowOrganizationForm(false)
                }}
                onOrganizationCreated={() => setShowOrganizationForm(false)}
                onCancel={() => setIsCancelModalOpen(true)}
            />
            <Modal
                open={isCancelModalOpen}
                onCancel={() => setIsCancelModalOpen(false)}
                title={CancelModalTitle}
                footer={(
                    <Space size={16} direction='horizontal'>
                        <Button
                            type='secondary'
                            danger
                            onClick={handleCancelOrganizationCreation}
                        >
                            {LeaveMessage}
                        </Button>
                        <Button type='secondary' onClick={() => setIsCancelModalOpen(false)}>
                            {RemainMessage}
                        </Button>
                    </Space>
                )}
            >
                <Typography.Text type='secondary'>
                    {CancelModalMessage}
                </Typography.Text>
            </Modal>
        </>
    )

    if (!showOrganizationForm && lastOrganizationEmployeeRequest) {
        if (lastOrganizationEmployeeRequest.isRejected) {
            content = (
                <Space size={40} direction='vertical'>
                    <Space size={24} direction='vertical'>
                        <Typography.Title level={2}>
                            {
                                intl.formatMessage(
                                    { id: 'organization.createOrganizationForm.rejectedRequest.title' },
                                    { organizationName: lastOrganizationEmployeeRequest?.organizationName }
                                )
                            }
                        </Typography.Title>
                        <Typography.Text type='secondary'>
                            {RejectedRequestMessage}
                        </Typography.Text>
                    </Space>
                    <Space size={24} direction='vertical' width='100%'>
                        {
                            lastOrganizationEmployeeRequest.retries < MAX_ORGANIZATION_EMPLOYEE_REQUEST_RETRIES - 1 && (
                                <Button
                                    type='primary'
                                    onClick={handleRetryOrganizationEmployeeRequest}
                                    className='initial-organization-invite-buttons'
                                >
                                    {SendAgainMessage}
                                </Button>
                            )
                        }
                        <Button
                            type='secondary'
                            onClick={() => setShowOrganizationForm(true)}
                            className='initial-organization-invite-buttons'
                        >
                            {CreateOtherOrganizationMessage}
                        </Button>
                    </Space>
                </Space>
            )
        } else {
            content = (
                <Space size={40} direction='vertical'>
                    <Space size={24} direction='vertical'>
                        <Typography.Title level={2}>
                            {
                                intl.formatMessage(
                                    { id: 'organization.createOrganizationForm.request.title' },
                                    { organizationName: lastOrganizationEmployeeRequest?.organizationName }
                                )
                            }
                        </Typography.Title>
                        <Typography.Text type='secondary'>
                            {OrganizationEmployeeRequestDescription}
                        </Typography.Text>
                        <Alert
                            showIcon
                            type='info'
                            description={OrganizationEmployeeRequestAlert}
                        />
                    </Space>
                    <Button
                        type='secondary'
                        onClick={() => setShowOrganizationForm(true)}
                        className='initial-organization-invite-buttons'
                    >
                        {CreateOtherOrganizationMessage}
                    </Button>
                </Space>
            )
        }
    }

    if (!showOrganizationForm && lastInvite) {
        content = (
            <Space size={40} direction='vertical' align='center' className='initial-organization-invite'>
                <Space size={24} direction='vertical'>
                    <Typography.Title level={2}>
                        {
                            intl.formatMessage({
                                id: 'organization.createOrganizationForm.invite.title',
                            }, { organizationName: lastInvite?.organization?.name })
                        }
                    </Typography.Title>
                    <Typography.Text type='secondary' size='large'>
                        {InviteEmployeeDescription}
                    </Typography.Text>
                </Space>
                <Space size={20} direction='vertical' className='initial-organization-invite-buttons'>
                    <Button type='primary' onClick={() => handleAcceptOrReject(true, false)}>
                        {Accept}
                    </Button>
                    <Button type='secondary' onClick={() => handleAcceptOrReject(false, true)}>
                        {Reject}
                    </Button>
                </Space>
            </Space>
        )
    }

    if (pageDataLoading) {
        content = <Loader fill size='large'/>
    }

    return (
        <>
            <Head>
                <title>{CreateOrganizationTitle}</title>
            </Head>
            <LayoutWithPoster
                headerAction={<WelcomeHeaderTitle userType='staff'/>}
                Poster={AuthPoster}
            >
                <div className='create-organization-content-wrapper'>
                    {content}
                </div>
            </LayoutWithPoster>
        </>
    )
}
