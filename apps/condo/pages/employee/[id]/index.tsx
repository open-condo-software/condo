import { ArrowLeftOutlined, DeleteFilled, EditFilled } from '@ant-design/icons'
import { Button } from '@condo/domains/common/components/Button'
import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { FrontLayerContainer } from '@condo/domains/common/components/FrontLayerContainer'
import { EmployeeInviteRetryButton } from '@condo/domains/organization/components/EmployeeInviteRetryButton'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { canManageEmployee, canReinviteEmployee } from '@condo/domains/organization/permissions'
import { OrganizationEmployee } from '@condo/domains/organization/utils/clientSchema'
import { NotDefinedField } from '@condo/domains/user/components/NotDefinedField'
import { UserAvatar } from '@condo/domains/user/components/UserAvatar'
import { useIntl } from '@core/next/intl'
import { useOrganization } from '@core/next/organization'
import { Alert, Button as AntButton, Col, Row, Space, Switch, Tag, Typography } from 'antd'
import Modal from 'antd/lib/modal/Modal'
import Router from 'next/router'
import get from 'lodash/get'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useState } from 'react'
import { LinkWithIcon } from '../../../domains/common/components/LinkWithIcon'
import { colors } from '../../../domains/common/constants/style'

export const EmployeeInfoPage = () => {
    const intl = useIntl()
    const PhoneMessage = intl.formatMessage({ id: 'Phone' })
    const EmailMessage = intl.formatMessage({ id: 'field.EMail' })
    const UpdateMessage = intl.formatMessage({ id: 'Edit' })
    const RoleMessage = intl.formatMessage({ id: 'employee.Role' })
    const EmployeeDidntEnteredMessage = intl.formatMessage({ id: 'employee.EmployeeDidntEntered' })
    const BlockUserMessage = intl.formatMessage({ id: 'employee.BlockUser' })
    const DeletePropertyLabel = intl.formatMessage({ id: 'Delete' })
    const ConfirmDeleteTitle = intl.formatMessage({ id: 'employee.ConfirmDeleteTitle' })
    const ConfirmDeleteMessage = intl.formatMessage({ id: 'employee.ConfirmDeleteMessage' })
    const UpdateEmployeeMessage = intl.formatMessage({ id: 'employee.UpdateTitle' })
    const ErrorMessage = intl.formatMessage({ id: 'errors.PdfGenerationError' })

    const [isConfirmVisible, setIsConfirmVisible] = useState(false)

    const { query } = useRouter()
    const { link } = useOrganization()

    const employeeId = get(query, 'id', '')
    const { obj: employee, loading, error, refetch } = OrganizationEmployee.useObject({ where: { id: String(employeeId) } })
    const updateEmployeeAction = OrganizationEmployee.useUpdate({}, () => refetch())
    const softDeleteAction = OrganizationEmployee.useSoftDelete({}, () => Router.push('/employee/'))

    const showConfirm = () => setIsConfirmVisible(true)
    const handleOk = () => {
        setIsConfirmVisible(false)
        softDeleteAction({}, employee)
    }
    const handleCancel = () => setIsConfirmVisible(false)

    if (error || loading) {
        return <LoadingOrErrorPage title={UpdateEmployeeMessage} loading={loading} error={ErrorMessage ? 'Error' : null}/>
    }

    const isEmployeeEditable = canManageEmployee(link, employee)
    const isEmployeeReinvitable = canReinviteEmployee(link, employee)
    const isEmployeeBlocked = get(employee, 'isBlocked')

    const name = get(employee, 'name')

    const handleEmployeeBlock = (blocked) => {
        if (!isEmployeeEditable) {
            return
        }

        updateEmployeeAction({ isBlocked: blocked }, employee)
    }

    return (
        <>
            <Head>
                <title>{name}</title>
            </Head>
            <PageWrapper>
                <OrganizationRequired>
                    <PageContent>
                        <Row gutter={[0, 40]}>
                            <Col span={3}>
                                <UserAvatar borderRadius={24} isBlocked={isEmployeeBlocked}/>
                            </Col>
                            <Col span={20} push={1}>
                                <Row gutter={[0, 60]}>
                                    <Col span={24}>
                                        <Row gutter={[0, 40]}>
                                            <Col span={24}>
                                                <Typography.Title
                                                    level={1}
                                                    style={{ margin: 0, fontWeight: 'bold' }}
                                                >
                                                    {name}
                                                </Typography.Title>
                                                <NotDefinedField
                                                    showMessage={false}
                                                    value={get(employee, ['position'])}
                                                    render={(value) => (
                                                        <Typography.Title
                                                            level={2}
                                                            style={{ margin: '8px 0 0', fontWeight: 400 }}
                                                        >
                                                            {value}
                                                        </Typography.Title>
                                                    )}
                                                />
                                            </Col>
                                            {isEmployeeReinvitable && (
                                                <Alert showIcon type='warning' message={
                                                    <>
                                                        {EmployeeDidntEnteredMessage}
                                                        .&nbsp;
                                                        <EmployeeInviteRetryButton employee={employee}/>
                                                    </>
                                                }/>
                                            )}
                                            {isEmployeeEditable && (
                                                <Col span={24}>
                                                    <label>
                                                        <Space direction={'horizontal'} size={8}>
                                                            <Switch
                                                                onChange={handleEmployeeBlock}
                                                                defaultChecked={isEmployeeBlocked}
                                                            />
                                                            <Typography.Text type='danger' style={{ fontSize: '16px' }}>
                                                                {BlockUserMessage}
                                                            </Typography.Text>
                                                        </Space>
                                                    </label>
                                                </Col>
                                            )}
                                            <Col span={24}>
                                                <FrontLayerContainer showLayer={isEmployeeBlocked}>
                                                    <Row gutter={[0, 24]}>
                                                        <Col span={3}>
                                                            <Typography.Text type='secondary'>
                                                                {PhoneMessage}
                                                            </Typography.Text>
                                                        </Col>
                                                        <Col span={19} push={2}>
                                                            <NotDefinedField value={get(employee, 'phone')}/>
                                                        </Col>

                                                        <Col span={3}>
                                                            <Typography.Text type='secondary'>
                                                                {RoleMessage}
                                                            </Typography.Text>
                                                        </Col>
                                                        <Col span={19} push={2}>
                                                            <NotDefinedField
                                                                value={get(employee, ['role', 'name'])}
                                                                render={
                                                                    (roleName) => (
                                                                        <Tag color='default'>{roleName}</Tag>
                                                                    )
                                                                }
                                                            />
                                                        </Col>

                                                        <Col span={3}>
                                                            <Typography.Text type='secondary'>
                                                                {EmailMessage}
                                                            </Typography.Text>
                                                        </Col>
                                                        <Col span={19} push={2}>
                                                            <NotDefinedField value={get(employee, 'email')}/>
                                                        </Col>
                                                    </Row>
                                                </FrontLayerContainer>
                                            </Col>
                                            {isEmployeeEditable && (
                                                <Col span={24}>
                                                    <Space direction={'horizontal'} size={40}>
                                                        <Link href={`/employee/${employeeId}/update`}>
                                                            <Button
                                                                color={'green'}
                                                                type={'sberPrimary'}
                                                                secondary
                                                                icon={<EditFilled />}
                                                            >
                                                                {UpdateMessage}
                                                            </Button>
                                                        </Link>
                                                        <AntButton danger onClick={showConfirm}>
                                                            <DeleteFilled />
                                                        </AntButton>
                                                    </Space>
                                                </Col>
                                            )}
                                        </Row>
                                    </Col>
                                </Row>
                            </Col>
                        </Row>
                        <Modal
                            title={
                                <Typography.Title style={{ fontSize: '24px', lineHeight: '32px' }}>
                                    {ConfirmDeleteTitle}
                                </Typography.Title>
                            }
                            visible={isConfirmVisible}
                            onCancel={handleCancel}
                            footer={[
                                <Button
                                    key='submit'
                                    type='sberDanger'
                                    onClick={handleOk}
                                    style={{ margin: '15px' }}
                                >
                                    {DeletePropertyLabel}
                                </Button>,
                            ]}
                        >
                            <Typography.Text>
                                {ConfirmDeleteMessage}
                            </Typography.Text>
                        </Modal>
                    </PageContent>
                </OrganizationRequired>
            </PageWrapper>
        </>
    )
}

const HeaderAction = () => {
    const intl = useIntl()
    const BackButtonLabel = intl.formatMessage({ id: 'pages.condo.employee.PageTitle' })

    return (
        <LinkWithIcon
            icon={<ArrowLeftOutlined style={{ color: colors.white }}/>}
            path={'/employee/'}
        >
            {BackButtonLabel}
        </LinkWithIcon>
    )
}

EmployeeInfoPage.headerAction = <HeaderAction/>

export default EmployeeInfoPage
