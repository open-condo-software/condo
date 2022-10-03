import { get } from 'lodash'
import React, { useCallback, useMemo } from 'react'

import { useIntl } from '@condo/next/intl'

import ActionBar from '@condo/domains/common/components/ActionBar'
import { Button } from '@condo/domains/common/components/Button'
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
    const { objs: propertyScopeProperties, loading: scopePropertiesLoading } = PropertyScopeProperty.useObjects({
        where: {
            propertyScope: { id: propertyScopeId },
        },
    })
    const { objs: propertyScopeEmployees, loading: scopeEmployeesLoading } = PropertyScopeOrganizationEmployee.useObjects({
        where: {
            propertyScope: { id: propertyScopeId },
        },
    })
    const organizationId = useMemo(() => get(propertyScope, ['organization', 'id']), [propertyScope])

    const action = PropertyScope.useUpdate({})
    const updateAction = useCallback((values) => action(values, propertyScope), [action, propertyScope])

    const initialValues = useMemo(() => ({
        id: get(propertyScope, 'id'),
        name: get(propertyScope, 'name'),
        propertyScopeProperties,
        propertyScopeEmployees,
    }), [propertyScope, propertyScopeEmployees, propertyScopeProperties])

    const loading = scopeLoading || scopePropertiesLoading || scopeEmployeesLoading

    return (
        <BasePropertyScopeForm
            action={updateAction}
            organizationId={organizationId}
            initialValues={initialValues}
            loading={loading}
        >
            {({ handleSave, isLoading }) => (
                <ActionBar>
                    <Button
                        key='submit'
                        onClick={handleSave}
                        type='sberDefaultGradient'
                        loading={isLoading}
                    >
                        {SaveLabel}
                    </Button>
                </ActionBar>
            )}
        </BasePropertyScopeForm>
    )
}