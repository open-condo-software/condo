import get from 'lodash/get'
import React, { useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { ActionBar, Button } from '@open-condo/ui'

import {
    PropertyScope,
    PropertyScopeOrganizationEmployee,
    PropertyScopeProperty,
} from '@condo/domains/scope/utils/clientSchema'

import { BasePropertyScopeForm } from './BasePropertyScopeForm'


export const UpdatePropertyScopeForm = ({ id }) => {
    const intl = useIntl()
    const SaveLabel = intl.formatMessage({ id: 'Save' })

    const { obj: propertyScope, loading: scopeLoading } = PropertyScope.useObject({ where: { id } })
    const propertyScopeId = get(propertyScope, 'id', null)
    const { objs: propertyScopeProperties, loading: scopePropertiesLoading } = PropertyScopeProperty.useAllObjects({
        where: {
            propertyScope: { id: propertyScopeId, deletedAt: null },
            deletedAt: null,
        },
    })
    const { objs: propertyScopeEmployees, loading: scopeEmployeesLoading } = PropertyScopeOrganizationEmployee.useAllObjects({
        where: {
            propertyScope: { id: propertyScopeId },
        },
    })
    const organizationId = useMemo(() => get(propertyScope, ['organization', 'id']), [propertyScope])

    const action = PropertyScope.useUpdate({})
    const updateAction = useCallback((values) => action(values, propertyScope), [action, propertyScope])

    const name = get(propertyScope, 'name')
    const initialValues = useMemo(() => ({
        id: get(propertyScope, 'id'),
        name: name && intl.formatMessage({ id: name as FormatjsIntl.Message['ids'] }) || name,
        propertyScopeProperties,
        propertyScopeEmployees,
        hasAllProperties: get(propertyScope, 'hasAllProperties'),
        hasAllEmployees: get(propertyScope, 'hasAllEmployees'),
    }), [intl, name, propertyScope, propertyScopeEmployees, propertyScopeProperties])

    const loading = scopeLoading || scopePropertiesLoading || scopeEmployeesLoading

    return (
        <BasePropertyScopeForm
            action={updateAction}
            organizationId={organizationId}
            initialValues={initialValues}
            loading={loading}
        >
            {({ handleSave, isLoading }) => (
                <ActionBar
                    actions={[
                        <Button
                            key='submit'
                            onClick={handleSave}
                            type='primary'
                            loading={isLoading}
                            id='PropertyScopeClickUpdate'
                        >
                            {SaveLabel}
                        </Button>,
                    ]}
                />
            )}
        </BasePropertyScopeForm>
    )
}