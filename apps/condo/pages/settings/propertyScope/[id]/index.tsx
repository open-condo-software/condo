import { Col, Row, Typography } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import get from 'lodash/get'
import uniq from 'lodash/uniq'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { CSSProperties, useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar, Button } from '@open-condo/ui'

import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import {
    DeleteButtonWithConfirmModal,
} from '@condo/domains/common/components/DeleteButtonWithConfirmModal'
import { renderBlockedObject } from '@condo/domains/common/components/GraphQlSearchInput'
import { Loader } from '@condo/domains/common/components/Loader'
import { PageFieldRow } from '@condo/domains/common/components/PageFieldRow'
import { SETTINGS_TAB_PROPERTY_SCOPE } from '@condo/domains/common/constants/settingsTabs'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { OrganizationEmployeeSpecialization } from '@condo/domains/organization/utils/clientSchema'
import {
    EmployeeNameAndSpecializations,
    getEmployeeSpecializationsMessage,
} from '@condo/domains/organization/utils/clientSchema/Renders'
import {
    PropertyScope,
    PropertyScopeOrganizationEmployee,
    PropertyScopeProperty,
} from '@condo/domains/scope/utils/clientSchema'
import { getAddressRender } from '@condo/domains/ticket/utils/clientSchema/Renders'


const BIG_VERTICAL_GUTTER: [Gutter, Gutter] = [0, 60]
const MEDIUM_VERTICAL_GUTTER: [Gutter, Gutter] = [0, 24]
const PARAGRAPH_STYLES: CSSProperties = { margin: 0 }

const PropertyScopeIdPage = () => {
    const intl = useIntl()
    const PropertyScopeTitle = intl.formatMessage({ id: 'settings.propertyScope' })
    const NameMessage = intl.formatMessage({ id: 'field.name' })
    const PropertiesMessage = intl.formatMessage({ id: 'settings.propertyScope.properties' })
    const EmployeesMessage = intl.formatMessage({ id: 'settings.propertyScope.employees' })
    const DeleteMessage = intl.formatMessage({ id: 'delete' })
    const EditMessage = intl.formatMessage({ id: 'edit' })
    const ConfirmDeleteTitle = intl.formatMessage({ id: 'settings.propertyScope.alert.delete.title' })
    const ConfirmDeleteMessage = intl.formatMessage({ id: 'settings.propertyScope.alert.delete.message' })
    const AllPropertiesMessage = intl.formatMessage({ id: 'settings.propertyScope.allProperties' })
    const AllEmployeesMessage = intl.formatMessage({ id: 'settings.propertyScope.allEmployees' })
    const DeletedMessage = intl.formatMessage({ id: 'deleted' })

    const router = useRouter()
    const { link } = useOrganization()
    const canManagePropertyScopes = useMemo(() => get(link, ['role', 'canManagePropertyScopes']), [link])

    const scopeId = get(router, ['query', 'id'], null)
    const { loading, obj: propertyScope } = PropertyScope.useObject({
        where: { id: scopeId },
    })

    const handleDeleteAction = PropertyScope.useSoftDelete(() => router.push(`/settings?tab=${SETTINGS_TAB_PROPERTY_SCOPE}`))

    const { objs: propertyScopeProperties } = PropertyScopeProperty.useAllObjects({
        where: {
            propertyScope: { id: scopeId, deletedAt: null },
            deletedAt: null,
        },
    })
    const properties = useMemo(() => propertyScopeProperties.map(propertyScopeProperty => propertyScopeProperty.property), [propertyScopeProperties])
    const { objs: propertyScopeEmployees } = PropertyScopeOrganizationEmployee.useAllObjects({
        where: {
            propertyScope: { id: scopeId },
        },
    })
    const employees = useMemo(() => propertyScopeEmployees
        .map(propertyScopeEmployee => propertyScopeEmployee.employee)
        .filter(Boolean), [propertyScopeEmployees])
    const propertyScopesEmployeeIds: string[] = useMemo(() => uniq(
        employees
            .map(employee => employee.id)
            .filter(Boolean)
    ), [employees])
    const {
        objs: organizationEmployeeSpecializations,
    } = OrganizationEmployeeSpecialization.useAllObjects({
        where: {
            employee: { id_in: propertyScopesEmployeeIds },
        },
    })
    const propertyScopeName = useMemo(() => get(propertyScope, 'name'), [propertyScope])

    const renderPropertyScopeProperties = useMemo(() => {
        if (get(propertyScope, 'hasAllProperties')) {
            return AllPropertiesMessage
        }

        return properties.map(property => {
            const isDeleted = !!get(property, 'deletedAt')
            const propertyMessage = getAddressRender(property, null, DeletedMessage)

            return (
                <Typography.Paragraph
                    key={property.id}
                    style={PARAGRAPH_STYLES}
                >
                    {
                        isDeleted ? (
                            <>
                                {propertyMessage}
                            </>
                        ) : (
                            <Typography.Link
                                href={`/property/${get(property, 'id')}`}
                            >
                                {propertyMessage}
                            </Typography.Link>
                        )
                    }
                </Typography.Paragraph>
            )
        })
    }, [AllPropertiesMessage, DeletedMessage, properties, propertyScope])

    const renderPropertyScopeEmployees = useMemo(() => {
        if (get(propertyScope, 'hasAllEmployees')) {
            return AllEmployeesMessage
        }

        return employees.map(employee => {
            const { SpecializationsMessage } = getEmployeeSpecializationsMessage(intl, employee, organizationEmployeeSpecializations)

            return (
                <Typography.Paragraph
                    key={employee.id}
                    style={PARAGRAPH_STYLES}
                >
                    <Typography.Link
                        href={`/employee/${get(employee, 'id')}`}
                    >
                        <Typography.Text>
                            {
                                employee.isBlocked ? renderBlockedObject(intl, employee.name) : (
                                    <EmployeeNameAndSpecializations
                                        employee={employee}
                                        organizationEmployeeSpecializations={organizationEmployeeSpecializations}
                                    />
                                )
                            }
                        </Typography.Text>
                    </Typography.Link>
                </Typography.Paragraph>
            )
        })
    }, [AllEmployeesMessage, employees, intl, propertyScope, organizationEmployeeSpecializations])

    const handleDeleteButtonClick = useCallback(async () => {
        await handleDeleteAction(propertyScope)
    }, [handleDeleteAction, propertyScope])

    if (loading) {
        return <Loader />
    }

    return (
        <>
            <Head>
                <title>{PropertyScopeTitle}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <Row gutter={BIG_VERTICAL_GUTTER}>
                        <Col span={24}>
                            <Typography.Title>{PropertyScopeTitle}</Typography.Title>
                        </Col>
                        <Col span={24}>
                            <Row gutter={MEDIUM_VERTICAL_GUTTER}>
                                <Col span={24}>
                                    <PageFieldRow title={NameMessage}>
                                        {propertyScopeName}
                                    </PageFieldRow>
                                </Col>
                                <Col span={24}>
                                    <PageFieldRow title={PropertiesMessage}>
                                        {renderPropertyScopeProperties}
                                    </PageFieldRow>
                                </Col>
                                <Col span={24}>
                                    <PageFieldRow title={EmployeesMessage}>
                                        {renderPropertyScopeEmployees}
                                    </PageFieldRow>
                                </Col>
                            </Row>
                        </Col>
                        {
                            canManagePropertyScopes && (
                                <Col span={24}>
                                    <ActionBar
                                        actions={[
                                            <Link key='edit' href={`/settings/propertyScope/${scopeId}/update`}>
                                                <Button
                                                    type='primary'
                                                    id='PropertyScopeVisitUpdate'
                                                >
                                                    {EditMessage}
                                                </Button>
                                            </Link>,
                                            <DeleteButtonWithConfirmModal
                                                key='delete'
                                                title={ConfirmDeleteTitle}
                                                message={ConfirmDeleteMessage}
                                                okButtonLabel={DeleteMessage}
                                                action={handleDeleteButtonClick}
                                                buttonContent={DeleteMessage}
                                            />,
                                        ]}
                                    />
                                </Col>
                            )
                        }
                    </Row>
                </PageContent>
            </PageWrapper>
        </>
    )
}

PropertyScopeIdPage.requiredAccess = OrganizationRequired

export default PropertyScopeIdPage
