import {
    useAcceptOrRejectOrganizationInviteMutation,
    useGetLastEmployeeInviteQuery,
    useGetLastUserOrganizationEmployeeRequestQuery, useGetUserOrganizationEmployeeExistsQuery,
    useSendOrganizationEmployeeRequestMutation,
} from '@app/condo/gql'
import { OrganizationTypeType } from '@app/condo/schema'
import { Col, Row } from 'antd'
import pickBy from 'lodash/pickBy'
import getConfig from 'next/config'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo, useState } from 'react'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { useApolloClient } from '@open-condo/next/apollo'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Alert, Button, Modal, Space, Typography } from '@open-condo/ui'

import { Loader } from '@condo/domains/common/components/Loader'
import { useMutationErrorHandler } from '@condo/domains/common/hooks/useMutationErrorHandler'
import { isSafeUrl } from '@condo/domains/common/utils/url.utils'
import { MAX_ORGANIZATION_EMPLOYEE_REQUEST_RETRIES } from '@condo/domains/organization/constants/common'
import { SecondaryLink } from '@condo/domains/user/components/auth/SecondaryLink'

import { CreateOrganizationForm } from './CreateOrganizationForm'


const {
    publicRuntimeConfig: { HelpRequisites },
} = getConfig()

export const CreateOrganizationPageContent: React.FC = () => {
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
    const SupportChatMessage = intl.formatMessage({ id: 'organization.createOrganizationForm.supportChat' })
    const OrganizationEmployeeRequestAlert = intl.formatMessage({ id: 'organization.createOrganizationForm.request.alert.description' }, {
        chatBotLink: (
            <SecondaryLink target='_blank' href={HelpRequisites?.support_bot ? `https://t.me/${HelpRequisites.support_bot}` : '#'}>
                {SupportChatMessage}
            </SecondaryLink>
        ),
    })
    const OrganizationRequestsLimitTitle = intl.formatMessage({ id: 'api.organization.sendOrganizationEmployeeRequest.REQUEST_TO_ORGANIZATION_LIMIT_REACHED' })
    const OrganizationRequestsLimitDescription = intl.formatMessage({ id: 'organization.createOrganizationForm.limit.description' }, {
        chatBotLink: (
            <SecondaryLink target='_blank' href={HelpRequisites?.support_bot ? `https://t.me/${HelpRequisites.support_bot}` : '#'}>
                {SupportChatMessage}
            </SecondaryLink>
        ),
    })
    const InviteEmployeeDescription = intl.formatMessage({ id: 'organization.createOrganizationForm.invite.description' })

    const client = useApolloClient()
    const { user, isLoading: userLoading, signOut } = useAuth()
    const { selectEmployee } = useOrganization()
    const router = useRouter()
    const { query: { next } } = router
    const isValidNextUrl = next && !Array.isArray(next) && isSafeUrl(next)
    const redirectUrl = isValidNextUrl ? next : '/'

    const [showOrganizationForm, setShowOrganizationForm] = useState<boolean>(false)
    const [isCancelModalOpen, setIsCancelModalOpen] = useState<boolean>(false)
    const [acceptOrRejectInviteLoading, setAcceptOrRejectInviteLoading] = useState<boolean>(false)

    const onError = useMutationErrorHandler()
    const {
        data: actualOrganizationEmployeesData,
        loading: organizationLoading,
    } = useGetUserOrganizationEmployeeExistsQuery({
        variables: {
            userId: user?.id,
        },
        onError,
        skip: userLoading || !user,
        fetchPolicy: 'network-only',
    })
    const hasEmployees = useMemo(() => actualOrganizationEmployeesData?.employees?.length > 0, [actualOrganizationEmployeesData?.employees?.length])
    const skipQueryStatement = userLoading || !user || organizationLoading || hasEmployees

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
        // For a better user experience, we display information about invites and organization requests immediately
        fetchPolicy: 'network-only',
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
        fetchPolicy: 'network-only',
    })
    const lastOrganizationEmployeeRequest = useMemo(() => lastOrganizationEmployeeRequestData?.requests?.filter(Boolean)?.[0], [lastOrganizationEmployeeRequestData?.requests])
    const hasRequestsLimitError = useMemo(() => lastOrganizationEmployeeRequest?.retries >= MAX_ORGANIZATION_EMPLOYEE_REQUEST_RETRIES - 1, [lastOrganizationEmployeeRequest?.retries])

    const [acceptOrRejectInvite] = useAcceptOrRejectOrganizationInviteMutation({ onError })
    const [sendOrganizationEmployeeRequest] = useSendOrganizationEmployeeRequestMutation({ onError })

    const handleAcceptOrReject = useCallback(async (isAccepted: boolean, isRejected: boolean) => {
        setAcceptOrRejectInviteLoading(true)

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
            client.cache.evict({ id: 'ROOT_QUERY', fieldName: 'allOrganizationEmployees' })
            client.cache.gc()

            await selectEmployee(invite.id)
            await router.push(redirectUrl)
        }

        await refetchLastInvite()
        setAcceptOrRejectInviteLoading(false)
    }, [acceptOrRejectInvite, client, lastInvite?.id, redirectUrl, refetchLastInvite, router, selectEmployee])

    const handleRetryOrganizationEmployeeRequest = useCallback(async () => {
        if (!lastOrganizationEmployeeRequest?.organizationId) {
            return
        }

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
        setIsCancelModalOpen(false)
        setShowOrganizationForm(false)

        await signOut()
        await router.push(isValidNextUrl ? `/auth/signin?next=${encodeURIComponent(next)}` : '/auth/signin')
    }, [isValidNextUrl, next, router, signOut])

    const pageDataLoading = lastInviteLoading || lastOrganizationEmployeeRequestLoading || acceptOrRejectInviteLoading

    if (userLoading || organizationLoading) {
        return <Loader fill size='large' />
    }

    let content = (
        <>
            <CreateOrganizationForm
                type='form'
                onSendOrganizationRequest={async () => {
                    await refetchLastOrganizationEmployeeRequest()
                    setShowOrganizationForm(false)
                }}
                onEmployeeSelected={async () => {
                    setShowOrganizationForm(false)
                    await router.push(redirectUrl)
                }}
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
                        {
                            !hasRequestsLimitError ? (
                                <Typography.Text type='secondary'>
                                    {RejectedRequestMessage}
                                </Typography.Text>
                            ) : (
                                <Alert
                                    showIcon
                                    type='error'
                                    message={OrganizationRequestsLimitTitle}
                                    description={OrganizationRequestsLimitDescription}
                                />
                            )
                        }
                    </Space>
                    <Space size={24} direction='vertical' width='100%'>
                        {
                            !hasRequestsLimitError && (
                                <Button
                                    type='primary'
                                    block
                                    onClick={handleRetryOrganizationEmployeeRequest}
                                >
                                    {SendAgainMessage}
                                </Button>
                            )
                        }
                        <Button
                            type='secondary'
                            block
                            onClick={() => setShowOrganizationForm(true)}
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
                        block
                    >
                        {CreateOtherOrganizationMessage}
                    </Button>
                </Space>
            )
        }
    }

    if (!showOrganizationForm && lastInvite) {
        content = (
            <Row gutter={[0, 40]}>
                <Col span={24}>
                    <Space size={24} direction='vertical' width='100%'>
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
                </Col>
                <Col span={24}>
                    <Space size={20} direction='vertical' width='100%'>
                        <Button
                            type='primary'
                            block
                            loading={acceptOrRejectInviteLoading}
                            onClick={() => handleAcceptOrReject(true, false)}
                        >
                            {Accept}
                        </Button>
                        <Button
                            type='secondary'
                            block
                            onClick={() => handleAcceptOrReject(false, true)}
                        >
                            {Reject}
                        </Button>
                    </Space>
                </Col>
            </Row>
        )
    }

    if (pageDataLoading) {
        content = <Loader fill size='large'/>
    }

    return content
}
