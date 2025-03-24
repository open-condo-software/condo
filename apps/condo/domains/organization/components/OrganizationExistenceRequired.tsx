import {
    useAcceptOrRejectOrganizationInviteMutation,
    useGetLastEmployeeInviteQuery,
    useGetLastUserOrganizationEmployeeRequestQuery,
    useGetOrganizationEmployeeExistenceQuery, useSendOrganizationEmployeeRequestMutation,
} from '@app/condo/gql'
import { OrganizationTypeType } from '@app/condo/schema'
import pickBy from 'lodash/pickBy'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { ReactNode, useCallback, useMemo, useState } from 'react'

import { useCachePersistor } from '@open-condo/apollo'
import { useAuth } from '@open-condo/next/auth'
import { useOrganization } from '@open-condo/next/organization'
import { Alert, Button, Modal, Space, Typography } from '@open-condo/ui'

import { LayoutWithPoster } from '@condo/domains/common/components/containers/LayoutWithPoster'
import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'
import { AuthPoster } from '@condo/domains/user/components/containers/AuthPoster'
import { WelcomeHeaderTitle } from '@condo/domains/user/components/UserWelcomeTitle'

import './OrganizationExistenceRequired.css'
import { useMutationErrorHandler } from '@condo/domains/common/hooks/useMutationErrorHandler'

import { CreateOrganizationForm } from './CreateOrganizationForm'

import { Loader } from '../../common/components/Loader'


import { MAX_ORGANIZATION_EMPLOYEE_REQUEST_RETRIES } from '@condo/domains/organization/constants/common'


type OrganizationExistenceRequiredProps = {
    children: ReactNode
}

export const OrganizationExistenceRequired: React.FC<OrganizationExistenceRequiredProps> = ({ children }) => {
    const router = useRouter()
    const { persistor } = useCachePersistor()
    const { user, isLoading: userLoading, signOut } = useAuth()
    const { organization, isLoading: organizationLoading, selectEmployee } = useOrganization()

    const [showOrganizationForm, setShowOrganizationForm] = useState<boolean>(false)
    const [isCancelModalOpen, setIsCancelModalOpen] = useState<boolean>(false)

    const initialDataLoading = userLoading || organizationLoading

    // skip queries if user is not logged in or he has organization already
    // skip => initialDataLoading || !user || !!organization
    const skipQueryStatement = !persistor || initialDataLoading || !user || !!organization

    const onError = useMutationErrorHandler()

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

        // process errors

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

    // If user has employee => skip this screens
    if (initialDataLoading || !user || !!organization) {
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
                title='Передумали создавать организацию?'
                footer={(
                    <Space size={16} direction='horizontal'>
                        <Button
                            type='secondary'
                            danger
                            onClick={handleCancelOrganizationCreation}
                        >
                            Уйти
                        </Button>
                        <Button type='secondary' onClick={() => setIsCancelModalOpen(false)}>
                            Остаться
                        </Button>
                    </Space>
                )}
            >
                <Typography.Text type='secondary'>
                    Вход на платформу будет доступен только после создания организации. Если вы уйдете с этой страницы
                    данные об организации не сохраняться.
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
                            Организация {lastOrganizationEmployeeRequest?.organizationName} отклонила ваш запрос
                        </Typography.Title>
                        <Typography.Text type='secondary'>
                            Обратитесь к администратору организации и попробуйте отправить запрос еще раз
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
                                    Отправить еще раз
                                </Button>
                            )
                        }
                        <Button
                            type='secondary'
                            onClick={() => setShowOrganizationForm(true)}
                            className='initial-organization-invite-buttons'
                        >
                            Создать другую организацию
                        </Button>
                    </Space>
                </Space>
            )
        } else {
            content = (
                <Space size={40} direction='vertical'>
                    <Space size={24} direction='vertical'>
                        <Typography.Title level={2}>
                            Запрос в {lastOrganizationEmployeeRequest?.organizationName} отправлен
                        </Typography.Title>
                        <Typography.Text type='secondary'>
                            Как только администратор одобрит ваш запрос, вам придет СМС-подтверждение и откроется доступ к платформе
                        </Typography.Text>
                        <Alert
                            showIcon
                            type='info'
                            description='Если запрос долго не подтверджают, обратитесь в вашу организацию или напишите в чат поддержки'
                        />
                    </Space>
                    <Button
                        type='secondary'
                        onClick={() => setShowOrganizationForm(true)}
                        className='initial-organization-invite-buttons'
                    >
                        Создать другую организацию
                    </Button>
                </Space>
            )
        }
    }

    // If user has invites => show last invite to him
    if (!showOrganizationForm && lastInvite) {
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

    if (pageDataLoading) {
        content = <Loader fill size='large'/>
    }

    return (
        <>
            <Head>
                <title>Создание организации</title>
            </Head>
            <LayoutWithPoster
                headerAction={<WelcomeHeaderTitle userType='staff'/>}
                Poster={AuthPoster}
            >
                <div style={{ maxWidth: '350px' }}>
                    {content}
                </div>
            </LayoutWithPoster>
        </>
    )
}
