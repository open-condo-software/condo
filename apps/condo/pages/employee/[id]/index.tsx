import { useGetOrganizationEmployeeTicketsCountForReassignmentQuery } from '@app/condo/gql'
import { OrganizationEmployee as OrganizationEmployeeType, OrganizationEmployeeUpdateInput } from '@app/condo/schema'
import { Col, Row, Space, Switch } from 'antd'
import { map } from 'lodash'
import get from 'lodash/get'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useCallback } from 'react'

import { useCachePersistor } from '@open-condo/apollo'
import { IUseSoftDeleteActionType, IUseUpdateActionType } from '@open-condo/codegen/generate.hooks'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar, Alert, Button, Tag, Typography } from '@open-condo/ui'

import {
    PageContent,
    PageWrapper,
    useLayoutContext,
} from '@condo/domains/common/components/containers/BaseLayout'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { DeleteButtonWithConfirmModal } from '@condo/domains/common/components/DeleteButtonWithConfirmModal'
import { FieldPairRow as BaseFieldPairRow, FieldPairRowProps } from '@condo/domains/common/components/FieldPairRow'
import { FrontLayerContainer } from '@condo/domains/common/components/FrontLayerContainer'
import { PageComponentType } from '@condo/domains/common/types'
import { DeleteEmployeeButtonWithReassignmentModel } from '@condo/domains/organization/components/DeleteEmployeeButtonWithReassignmentModel'
import { EmployeeInviteRetryButton } from '@condo/domains/organization/components/EmployeeInviteRetryButton'
import { EmployeesReadPermissionRequired } from '@condo/domains/organization/components/PageAccess'
import { OrganizationEmployee } from '@condo/domains/organization/utils/clientSchema'
import { OrganizationEmployeeSpecialization } from '@condo/domains/organization/utils/clientSchema'
import { NotDefinedField } from '@condo/domains/user/components/NotDefinedField'
import { UserAvatar } from '@condo/domains/user/components/UserAvatar'

import styles from './index.module.css'

type EmployeePageContent = {
    employee: OrganizationEmployeeType
    isEmployeeEditable: boolean
    isEmployeeReinvitable: boolean
    activeTicketsOrganizationEmployeeCount: number
    updateEmployeeAction: IUseUpdateActionType<OrganizationEmployeeType, OrganizationEmployeeUpdateInput>
    softDeleteAction: IUseSoftDeleteActionType<OrganizationEmployeeType>
    phonePrefix?: string
}

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
            <div className={styles.employeeInviteRetryButtonContainer}>
                {EmployeeDidntEnteredMessage}&nbsp;
                <EmployeeInviteRetryButton employee={employee}/>
            </div>
        } />
    )
}

const EMPLOYEE_FIELD_PAIR_PROPS: Partial<FieldPairRowProps> = {
    titleColProps: { lg: 4, xs: 10 },
    valueColProps: { lg: 18, xs: 13, offset: 1 },
}

const FieldPairRow: React.FC<FieldPairRowProps> = (props) => (
    <BaseFieldPairRow
        {...EMPLOYEE_FIELD_PAIR_PROPS}
        {...props}
    />
)

export const EmployeePageContent: React.FC<EmployeePageContent> = ({
    employee,
    isEmployeeEditable,
    isEmployeeReinvitable,
    activeTicketsOrganizationEmployeeCount,
    updateEmployeeAction,
    softDeleteAction,
    phonePrefix = '',
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
    const AllSpecializationsMessage = intl.formatMessage({ id: 'employee.AllSpecializations' })
    const DeleteMessage = intl.formatMessage({ id: 'Delete' })

    const { user } = useAuth()
    const { breakpoints } = useLayoutContext()

    const employeeUserId = employee?.user?.id || null
    const userId = get(user, 'id')
    const isMyEmployee = userId && employeeUserId && userId === employeeUserId
    const isEmployeeBlocked = get(employee, 'isBlocked')

    const name = get(employee, 'name')
    const phone = get(employee, 'phone')
    const email = get(employee, 'email')
    const hasAllSpecializations = get(employee, 'hasAllSpecializations')

    const renderSpecializations = useCallback((specializations) => (
        <Typography.Text>
            {map(specializations, 'name').join(', ')}
        </Typography.Text>
    ), [])

    const handleEmployeeBlock = useCallback((blocked) => {
        if (!isEmployeeEditable) {
            return
        }

        updateEmployeeAction({ isBlocked: blocked }, employee)
    }, [employee, isEmployeeEditable, updateEmployeeAction])

    return (
        <>
            <Head>
                <title>{name}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <Row gutter={[0, 40]} justify='center'>
                        <Col xs={10} lg={3}>
                            <UserAvatar borderRadius={24} isBlocked={isEmployeeBlocked}/>
                        </Col>
                        <Col xs={24} lg={20} offset={!breakpoints.TABLET_LARGE ? 0 : 1}>
                            <Row gutter={[0, 60]}>
                                <Col span={24}>
                                    <Row gutter={[0, 40]}>
                                        <Col span={24}>
                                            <Typography.Title
                                                level={1}
                                            >
                                                {name}
                                            </Typography.Title>
                                            <NotDefinedField
                                                showMessage={false}
                                                value={get(employee, ['position'])}
                                                render={(value) => (
                                                    <Typography.Title
                                                        level={2}
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
                                                    <Space direction='horizontal' size={8}>
                                                        <Switch
                                                            onChange={handleEmployeeBlock}
                                                            defaultChecked={isEmployeeBlocked}
                                                            disabled={isMyEmployee}
                                                        />
                                                        <Typography.Text type='danger'>
                                                            {BlockUserMessage}
                                                        </Typography.Text>
                                                        {
                                                            (isMyEmployee) ?
                                                                <Typography.Text>
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
                                                    <FieldPairRow
                                                        fieldTitle={PhoneMessage}
                                                        fieldValue={phone}
                                                        href={`tel:${phonePrefix ? `${phonePrefix}${phone}` : phone}`}
                                                    />
                                                    <Col lg={4} xs={10}>
                                                        <Typography.Text type='secondary'>
                                                            {RoleMessage}
                                                        </Typography.Text>
                                                    </Col>
                                                    <Col lg={18} xs={13} offset={1}>
                                                        <NotDefinedField
                                                            value={get(employee, ['role', 'name'])}
                                                            render={
                                                                (roleName: string) => (
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
                                                                (value: string) => (
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
                                                        {
                                                            hasAllSpecializations ? AllSpecializationsMessage : (
                                                                <NotDefinedField
                                                                    value={get(employee, 'specializations')}
                                                                    render={renderSpecializations}
                                                                />
                                                            )
                                                        }
                                                    </Col>

                                                    {
                                                        email && <FieldPairRow
                                                            fieldTitle={EmailMessage}
                                                            fieldValue={email}
                                                            href={`mailto:${email}`}
                                                        />
                                                    }
                                                </Row>
                                            </FrontLayerContainer>
                                        </Col>
                                        {isEmployeeEditable && (
                                            <Col span={24}>
                                                <ActionBar
                                                    actions={[
                                                        <Link key='update' href={`/employee/${get(employee, 'id')}/update`}>
                                                            <Button
                                                                type='primary'
                                                                block
                                                            >
                                                                {UpdateMessage}
                                                            </Button>
                                                        </Link>,
                                                        !isMyEmployee && (activeTicketsOrganizationEmployeeCount > 0 ?
                                                            <DeleteEmployeeButtonWithReassignmentModel
                                                                key='delete'
                                                                softDeleteAction={() => softDeleteAction(employee)}
                                                                buttonContent={DeleteMessage}
                                                                employee={employee}
                                                                activeTicketsOrganizationEmployeeCount={activeTicketsOrganizationEmployeeCount}
                                                            /> :
                                                            <DeleteButtonWithConfirmModal
                                                                key='delete'
                                                                title={ConfirmDeleteTitle}
                                                                message={ConfirmDeleteMessage}
                                                                okButtonLabel={ConfirmDeleteButtonLabel}
                                                                action={() => softDeleteAction(employee)}
                                                                buttonContent={DeleteMessage}
                                                            />),
                                                    ]}
                                                />
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

export const EmployeeInfoPage: PageComponentType = () => {
    const { query, push } = useRouter()
    const { link } = useOrganization()
    const { persistor } = useCachePersistor()
    const intl = useIntl()
    const LoadingInProgressMessage = intl.formatMessage({ id: 'LoadingInProgress' })
    const ErrorMessage = intl.formatMessage({ id: 'errors.LoadingError' })
    const NotFoundMsg = intl.formatMessage({ id: 'NotFound' })
    const employeeId = String(get(query, 'id', ''))

    const { obj: employee, loading, error, refetch } = OrganizationEmployee.useObject(
        {
            where: {
                id: employeeId,
            },
        }
    )

    const { objs: organizationEmployeeSpecializations } = OrganizationEmployeeSpecialization.useObjects({
        where: {
            employee: { id: employeeId },
        },
    })

    const { data: activeTicketsOrganizationEmployeeCount, loading: loadingTicketsOrganizationEmployeeCount } = useGetOrganizationEmployeeTicketsCountForReassignmentQuery({
        variables: {
            userId: employee?.user?.id || null,
            organizationId: employee?.organization?.id || null,
        },
        skip: !persistor || !employee?.user?.id || !employee?.organization?.id,
    })

    const employeeWithSpecializations = { ...employee, specializations: organizationEmployeeSpecializations.map(scope => scope.specialization) }

    const updateEmployeeAction = OrganizationEmployee.useUpdate({}, () => refetch())
    const softDeleteAction = OrganizationEmployee.useSoftDelete(() => {
        if (window && window.location.pathname === `/employee/${employeeId}`) push('/employee')
    })

    const isEmployeeEditable = get(link, ['role', 'canManageEmployees'], false)
    const isEmployeeReinvitable = get(link, ['role', 'canInviteNewOrganizationEmployees'], false) && !get(employee, 'isAccepted')

    const errorToPrint = error ? ErrorMessage : ''

    if (error || loading || loadingTicketsOrganizationEmployeeCount || !persistor) return <LoadingOrErrorPage title={loading ? LoadingInProgressMessage : errorToPrint} loading={loading} error={errorToPrint}/>

    if (!loading && !employee) return <LoadingOrErrorPage title={NotFoundMsg} loading={loading} error={NotFoundMsg}/>

    return (
        <EmployeePageContent
            employee={employeeWithSpecializations}
            updateEmployeeAction={updateEmployeeAction}
            activeTicketsOrganizationEmployeeCount={activeTicketsOrganizationEmployeeCount?.meta?.count || 0}
            softDeleteAction={softDeleteAction}
            isEmployeeEditable={isEmployeeEditable}
            isEmployeeReinvitable={isEmployeeReinvitable}
        />
    )
}

EmployeeInfoPage.requiredAccess = EmployeesReadPermissionRequired

export default EmployeeInfoPage
