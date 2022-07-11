import { EditFilled } from '@ant-design/icons'
import { Button } from '@condo/domains/common/components/Button'
import { PageContent, PageWrapper, useLayoutContext } from '@condo/domains/common/components/containers/BaseLayout'
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
import { Alert, Col, Row, Space, Switch, Tag, Typography } from 'antd'
import Router from 'next/router'
import get from 'lodash/get'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React from 'react'
import { DeleteButtonWithConfirmModal } from '@condo/domains/common/components/DeleteButtonWithConfirmModal'
import { fontSizes } from '@condo/domains/common/constants/style'
import { map } from 'lodash'
import { useAuth } from '@core/next/auth'

const ReInviteActionAlert = ({ employee }) => {
    const intl = useIntl()
    const EmployeeDidntEnteredMessage = intl.formatMessage({ id: 'employee.EmployeeDidntEntered' })
    const EmployeeRejectedMessage = intl.formatMessage({ id: 'pages.users.status.Rejected' })

    const isEmployeeRejected = get(employee, 'isRejected')

    if (isEmployeeRejected) {
        return (
            <Alert showIcon type='warning' message={EmployeeRejectedMessage}/>
        )
    }

    return (
        <Alert showIcon type='warning' message={
            <>
                {EmployeeDidntEnteredMessage}&nbsp;
                <EmployeeInviteRetryButton employee={employee}/>
            </>
        } />
    )
}

export const EmployeePageContent = ({
    employee,
    isEmployeeEditable,
    isEmployeeReinvitable,
    updateEmployeeAction,
    softDeleteAction,
}) => {
    const intl = useIntl()
    const PhoneMessage = intl.formatMessage({ id: 'Phone' })
    const EmailMessage = intl.formatMessage({ id: 'field.EMail' })
    const UpdateMessage = intl.formatMessage({ id: 'Edit' })
    const RoleMessage = intl.formatMessage({ id: 'employee.Role' })
    const PositionMessage = intl.formatMessage({ id: 'employee.Position' })
    const SpecializationsMessage = intl.formatMessage({ id: 'employee.Specializations' })
    const BlockUserMessage = intl.formatMessage({ id: 'employee.BlockUser' })
    const CanNotBlockYourselfMessage = intl.formatMessage({ id: 'employee.CanNotBlockYourself' })
    const ConfirmDeleteButtonLabel = intl.formatMessage({ id: 'Delete' })
    const ConfirmDeleteTitle = intl.formatMessage({ id: 'employee.ConfirmDeleteTitle' })
    const ConfirmDeleteMessage = intl.formatMessage({ id: 'employee.ConfirmDeleteMessage' })

    const { user } = useAuth()
    const { isSmall } = useLayoutContext()

    const userId = get(user, 'id')
    const employeeUserId = get(employee, 'user.id')
    const isMyEmployee = userId && employeeUserId && userId === employeeUserId
    const isEmployeeBlocked = get(employee, 'isBlocked')

    const name = get(employee, 'name')
    const email = get(employee, 'email')

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
                <PageContent>
                    <Row gutter={[0, 40]} justify={'center'}>
                        <Col xs={10} lg={3}>
                            <UserAvatar borderRadius={24} isBlocked={isEmployeeBlocked}/>
                        </Col>
                        <Col xs={24} lg={20} offset={isSmall ? 0 : 1}>
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
                                            <ReInviteActionAlert employee={employee} />
                                        )}
                                        {isEmployeeEditable && (
                                            <Col span={24}>
                                                <label>
                                                    <Space direction={'horizontal'} size={8}>
                                                        <Switch
                                                            onChange={handleEmployeeBlock}
                                                            defaultChecked={isEmployeeBlocked}
                                                            disabled={isMyEmployee}
                                                        />
                                                        <Typography.Text type='danger' style={{ fontSize: fontSizes.content }}>
                                                            {BlockUserMessage}
                                                        </Typography.Text>
                                                        {
                                                            (isMyEmployee) ?
                                                                <Typography.Text style={{ fontSize: fontSizes.content }}>
                                                                    {CanNotBlockYourselfMessage}
                                                                </Typography.Text>
                                                                :
                                                                null
                                                        }
                                                    </Space>
                                                </label>
                                            </Col>
                                        )}
                                        <Col span={24}>
                                            <FrontLayerContainer showLayer={isEmployeeBlocked}>
                                                <Row gutter={[0, 24]}>
                                                    <Col lg={4} xs={10}>
                                                        <Typography.Text type='secondary'>
                                                            {PhoneMessage}
                                                        </Typography.Text>
                                                    </Col>
                                                    <Col lg={18} xs={13} offset={1}>
                                                        <NotDefinedField value={get(employee, 'phone')}/>
                                                    </Col>

                                                    <Col lg={4} xs={10}>
                                                        <Typography.Text type='secondary'>
                                                            {RoleMessage}
                                                        </Typography.Text>
                                                    </Col>
                                                    <Col lg={18} xs={13} offset={1}>
                                                        <NotDefinedField
                                                            value={get(employee, ['role', 'name'])}
                                                            render={
                                                                (roleName) => (
                                                                    <Tag color='default'>{roleName}</Tag>
                                                                )
                                                            }
                                                        />
                                                    </Col>

                                                    <Col lg={4} xs={10}>
                                                        <Typography.Text type='secondary'>
                                                            {PositionMessage}
                                                        </Typography.Text>
                                                    </Col>
                                                    <Col lg={18} xs={13} offset={1}>
                                                        <NotDefinedField
                                                            value={get(employee, 'position')}
                                                            render={
                                                                (value) => (
                                                                    <Tag color='default'>{value}</Tag>
                                                                )
                                                            }
                                                        />
                                                    </Col>

                                                    <Col lg={4} xs={10}>
                                                        <Typography.Text type='secondary'>
                                                            {SpecializationsMessage}
                                                        </Typography.Text>
                                                    </Col>
                                                    <Col lg={18} xs={13} offset={1}>
                                                        <NotDefinedField
                                                            value={get(employee, 'specializations')}
                                                            render={
                                                                (specializations) => (
                                                                    <Typography.Text>
                                                                        {map(specializations, 'name').join(', ')}
                                                                    </Typography.Text>
                                                                )
                                                            }
                                                        />
                                                    </Col>
                                                    {
                                                        email && <>
                                                            <Col lg={4} xs={10}>
                                                                <Typography.Text type='secondary'>
                                                                    {EmailMessage}
                                                                </Typography.Text>
                                                            </Col>
                                                            <Col lg={18} xs={13} offset={1}>
                                                                <NotDefinedField value={email}/>
                                                            </Col>
                                                        </>
                                                    }
                                                </Row>
                                            </FrontLayerContainer>
                                        </Col>
                                        {isEmployeeEditable && (
                                            <Col span={24}>
                                                <Space direction={'horizontal'} size={40}>
                                                    <Link href={`/employee/${get(employee, 'id')}/update`}>
                                                        <Button
                                                            color={'green'}
                                                            type={'sberPrimary'}
                                                            secondary
                                                            icon={<EditFilled />}
                                                        >
                                                            {UpdateMessage}
                                                        </Button>
                                                    </Link>
                                                    {(!isMyEmployee) ?
                                                        <DeleteButtonWithConfirmModal
                                                            title={ConfirmDeleteTitle}
                                                            message={ConfirmDeleteMessage}
                                                            okButtonLabel={ConfirmDeleteButtonLabel}
                                                            action={() => softDeleteAction(employee)}
                                                        />
                                                        : null}
                                                </Space>
                                            </Col>
                                        )}
                                    </Row>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </PageContent>
            </PageWrapper>
        </>
    )
}

export const EmployeeInfoPage = () => {
    const { query } = useRouter()
    const { link } = useOrganization()
    const intl = useIntl()
    const UpdateEmployeeMessage = intl.formatMessage({ id: 'employee.UpdateTitle' })
    const ErrorMessage = intl.formatMessage({ id: 'errors.LoadingError' })

    const employeeId = get(query, 'id', '')
    const { obj: employee, loading, error, refetch } = OrganizationEmployee.useNewObject(
        {
            where: {
                id: String(employeeId),
            },
        }
    )

    const updateEmployeeAction = OrganizationEmployee.useNewUpdate({}, () => refetch())
    const softDeleteAction = OrganizationEmployee.useNewSoftDelete(() => Router.push('/employee/'))

    const isEmployeeEditable = canManageEmployee(link, employee)
    const isEmployeeReinvitable = canReinviteEmployee(link, employee)

    if (error || loading) {
        return <LoadingOrErrorPage title={UpdateEmployeeMessage} loading={loading} error={error ? ErrorMessage : null}/>
    }

    return (
        <EmployeePageContent
            employee={employee}
            updateEmployeeAction={updateEmployeeAction}
            softDeleteAction={softDeleteAction}
            isEmployeeEditable={isEmployeeEditable}
            isEmployeeReinvitable={isEmployeeReinvitable}
        />
    )
}

EmployeeInfoPage.requiredAccess = OrganizationRequired

export default EmployeeInfoPage
