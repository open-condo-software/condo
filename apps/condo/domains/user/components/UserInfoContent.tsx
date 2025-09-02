import { useStartConfirmEmailActionMutation } from '@app/condo/gql'
import { ConfirmEmailActionMessageType } from '@app/condo/schema'
import { Col, Row } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import Link from 'next/link'
import React, { useCallback } from 'react'

import { getClientSideSenderInfo } from '@open-condo/codegen/utils/userId'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { ActionBar, Button, Typography, Alert } from '@open-condo/ui'

import { useHCaptcha } from '@condo/domains/common/components/HCaptcha'
import { useMutationErrorHandler } from '@condo/domains/common/hooks/useMutationErrorHandler'
import { NotDefinedField } from '@condo/domains/user/components/NotDefinedField'
import { UserOrganizationsList, UserOrganizationsListProps } from '@condo/domains/user/components/UserOrganizationsList'


const ROW_GUTTER_BIG: [Gutter, Gutter] = [0, 60]
const ROW_GUTTER_MID: [Gutter, Gutter] = [0, 40]

export type UserInfoContentProps = {
    useAllOrganizationEmployee: UserOrganizationsListProps['useAllOrganizationEmployee']
}

export const UserInfoContent: React.FC<UserInfoContentProps> = ({ useAllOrganizationEmployee }) => {
    const intl = useIntl()
    const PhoneMessage = intl.formatMessage({ id: 'Phone' })
    const EmailMessage = intl.formatMessage({ id: 'field.EMail' })
    const PasswordMessage = intl.formatMessage({ id: 'pages.auth.signin.field.Password' })
    const UpdateMessage = intl.formatMessage({ id: 'Edit' })
    const VerifyEmailTitle = intl.formatMessage({ id: 'pages.user.index.alert.verifyEmail.title' })
    const VerifyEmailDescription = intl.formatMessage({ id: 'pages.user.index.alert.verifyEmail.description' })
    const SendVerifyEmailMessage = intl.formatMessage({ id: 'pages.user.index.alert.verifyEmail.send' })

    const { user } = useAuth()

    const email = user?.email || '—'
    const phone = user?.phone || '—'

    const { executeCaptcha } = useHCaptcha()
    const errorHandler = useMutationErrorHandler()

    const [startConfirmEmailActionMutation] = useStartConfirmEmailActionMutation({
        onError: errorHandler,
    })

    const handleStartConfirmEmailAction = useCallback(async () => {
        const sender = getClientSideSenderInfo()
        const captcha = await executeCaptcha()

        await startConfirmEmailActionMutation({
            variables: {
                data: {
                    dv: 1,
                    sender,
                    captcha,
                    email: user.email,
                    messageType: ConfirmEmailActionMessageType.VerifyUserEmail,
                },
            },
        })
    }, [user?.email])

    const renderEmail = useCallback((value: string) => {
        if (user?.email && !user?.isEmailVerified) {
            return <Typography.Text type='warning'>{value}</Typography.Text>
        }

        return <Typography.Text>{value}</Typography.Text>
    }, [user?.email, user?.isEmailVerified])

    return (
        <Row gutter={ROW_GUTTER_BIG}>
            <Col span={24}>
                <Row gutter={ROW_GUTTER_MID} justify='center'>
                    <Col span={24}>
                        <Row gutter={ROW_GUTTER_BIG}>
                            <Col span={24}>
                                <Row gutter={ROW_GUTTER_MID}>
                                    <Col span={24}>
                                        <Row gutter={[0, 16]}>
                                            <Col lg={5} xs={10}>
                                                <Typography.Text type='secondary'>
                                                    {PhoneMessage}
                                                </Typography.Text>
                                            </Col>
                                            <Col lg={18} xs={10} offset={1}>
                                                <NotDefinedField value={phone}/>
                                            </Col>
                                            <Col lg={5} xs={10}>
                                                <Typography.Text type='secondary'>
                                                    {EmailMessage}
                                                </Typography.Text>
                                            </Col>
                                            <Col lg={18} xs={10} offset={1}>
                                                <NotDefinedField value={email} render={renderEmail} />
                                            </Col>

                                            {
                                                (user?.email && !user?.isEmailVerified) && (
                                                    <>
                                                        <Col lg={18} span={24}>
                                                            <Alert
                                                                type='warning'
                                                                showIcon
                                                                message={VerifyEmailTitle}
                                                                description={
                                                                    <Row gutter={[0, 8]}>
                                                                        <Col span={24}>
                                                                            <Typography.Text size='medium'>
                                                                                {VerifyEmailDescription}
                                                                            </Typography.Text>
                                                                        </Col>
                                                                        <Col span={24}>
                                                                            <Typography.Link size='medium' onClick={handleStartConfirmEmailAction}>
                                                                                {SendVerifyEmailMessage}
                                                                            </Typography.Link>
                                                                        </Col>
                                                                    </Row>
                                                                }
                                                            />
                                                        </Col>
                                                        <Col lg={6} span={0} />
                                                    </>
                                                )
                                            }

                                            <Col lg={5} xs={10}>
                                                <Typography.Text type='secondary'>
                                                    {PasswordMessage}
                                                </Typography.Text>
                                            </Col>
                                            <Col lg={18} xs={10} offset={1}>
                                                <NotDefinedField value='******'/>
                                            </Col>
                                        </Row>
                                    </Col>
                                </Row>
                            </Col>
                            <Col span={24}>
                                <UserOrganizationsList
                                    useAllOrganizationEmployee={useAllOrganizationEmployee}
                                />
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </Col>
            <Col span={24}>
                <ActionBar
                    actions={[
                        <Link key='update' href='/user/update'>
                            <Button
                                type='primary'
                            >
                                {UpdateMessage}
                            </Button>
                        </Link>,
                    ]}
                />
            </Col>
        </Row>
    )
}
