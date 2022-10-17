import { getEmployeeSpecializationsMessage } from '@condo/domains/organization/utils/clientSchema/Renders'
import { Gutter } from 'antd/es/grid/row'
import uniq from 'lodash/uniq'
import React, { CSSProperties, useCallback, useMemo } from 'react'
import { Col, Row, Typography } from 'antd'
import get from 'lodash/get'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'

import { useIntl } from '@condo/next/intl'
import { useOrganization } from '@condo/next/organization'

import ActionBar from '@condo/domains/common/components/ActionBar'
import { Button } from '@condo/domains/common/components/Button'
import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import {
    DeleteButtonWithConfirmModal,
    IDeleteActionButtonWithConfirmModal,
} from '@condo/domains/common/components/DeleteButtonWithConfirmModal'
import { Loader } from '@condo/domains/common/components/Loader'
import { PageFieldRow } from '@condo/domains/common/components/PageFieldRow'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { getAddressRender } from '@condo/domains/ticket/utils/clientSchema/Renders'

import { SETTINGS_TAB_PROPERTY_SCOPE } from '@condo/domains/common/constants/settingsTabs'
import {
    PropertyScope,
    PropertyScopeOrganizationEmployee,
    PropertyScopeProperty,
} from '@condo/domains/scope/utils/clientSchema'
import { OrganizationEmployeeSpecialization } from '@condo/domains/organization/utils/clientSchema'

const DELETE_BUTTON_CUSTOM_PROPS: IDeleteActionButtonWithConfirmModal['buttonCustomProps'] = {
    type: 'sberDangerGhost',
}

const BIG_VERTICAL_GUTTER: [Gutter, Gutter] = [0, 60]
const MEDIUM_VERTICAL_GUTTER: [Gutter, Gutter] = [0, 24]
const PARAGRAPH_STYLES: CSSProperties = { margin: 0 }

const PropertyScopeIdPage = () => {
    const intl = useIntl()
    const PropertyScopeTitle = intl.formatMessage({ id: 'pages.condo.settings.propertyScope' })
    const NameMessage = intl.formatMessage({ id: 'field.Name' })
    const PropertiesMessage = intl.formatMessage({ id: 'pages.condo.settings.propertyScope.properties' })
    const EmployeesMessage = intl.formatMessage({ id: 'pages.condo.settings.propertyScope.employees' })
    const DeleteMessage = intl.formatMessage({ id: 'Delete' })
    const EditMessage = intl.formatMessage({ id: 'Edit' })
    const ConfirmDeleteTitle = intl.formatMessage({ id: 'pages.condo.settings.propertyScope.alert.delete.Title' })
    const ConfirmDeleteMessage = intl.formatMessage({ id: 'pages.condo.settings.propertyScope.alert.delete.Message' })
    const AllPropertiesMessage = intl.formatMessage({ id: 'pages.condo.settings.propertyScope.allProperties' })
    const AllEmployeesMessage = intl.formatMessage({ id: 'pages.condo.settings.propertyScope.allEmployees' })
    const DeletedMessage = intl.formatMessage({ id: 'Deleted' })

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
    const propertyScopeName = useMemo(() => {
        const name = get(propertyScope, 'name')

        return name && intl.formatMessage({ id: name }) || name
    }, [intl, propertyScope])

    const renderPropertyScopeProperties = useMemo(() => {
        if (get(propertyScope, 'hasAllProperties')) {
            return AllPropertiesMessage
        }

        return properties.map(property => {
            const isDeleted = !!get(property, 'deletedAt')
            const propertyMessage = property.name ? `\n${property.name}` : getAddressRender(property, DeletedMessage)

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
            const specializationsMessage = getEmployeeSpecializationsMessage(intl, employee, organizationEmployeeSpecializations)

            return (
                <Typography.Paragraph
                    key={employee.id}
                    style={PARAGRAPH_STYLES}
                >
                    <Typography.Link
                        href={`/employee/${get(employee, 'id')}`}
                    >
                        <Typography.Text>
                            {employee.name} {specializationsMessage && (
                                <Typography.Text>
                                ({specializationsMessage})
                                </Typography.Text>
                            )}
                        </Typography.Text>
                    </Typography.Link>
                </Typography.Paragraph>
            )
        })
    }, [AllEmployeesMessage, employees, intl, propertyScope, organizationEmployeeSpecializations])

    const handleDeleteButtonClick = useCallback(async () => {
        await handleDeleteAction(propertyScope)
    }, [handleDeleteAction, propertyScope])

    const deleteButtonContent = useMemo(() => <span>{DeleteMessage}</span>, [DeleteMessage])

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
                                    <ActionBar>
                                        <Link href={`/settings/propertyScope/${scopeId}/update`}>
                                            <Button
                                                color='green'
                                                type='sberDefaultGradient'
                                            >
                                                {EditMessage}
                                            </Button>
                                        </Link>
                                        <DeleteButtonWithConfirmModal
                                            title={ConfirmDeleteTitle}
                                            message={ConfirmDeleteMessage}
                                            okButtonLabel={DeleteMessage}
                                            action={handleDeleteButtonClick}
                                            buttonCustomProps={DELETE_BUTTON_CUSTOM_PROPS}
                                            buttonContent={deleteButtonContent}
                                        />
                                    </ActionBar>
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
