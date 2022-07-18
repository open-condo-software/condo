import ActionBar from '@condo/domains/common/components/ActionBar'
import { Button } from '@condo/domains/common/components/Button'
import { Loader } from '@condo/domains/common/components/Loader'
import { ContactRole } from '@condo/domains/contact/utils/clientSchema'
import { useIntl } from '@core/next/intl'
import { get } from 'lodash'
import React, { useMemo } from 'react'
import { BaseContactRoleForm } from './BaseContactRoleForm'

export const UpdateContactRoleForm = ({ id }) => {
    const intl = useIntl()
    const SaveLabel = intl.formatMessage({ id: 'Save' })

    const { obj: contactRole, loading } = ContactRole.useObject({ where: { id } })
    const action = ContactRole.useUpdate({})
    const updateAction = (value) => {
        if (value.organization) {
            value.organization = { connect: { id: value.organization } }
        }
        action(value, contactRole)
    }
    const organizationId = useMemo(() => get(contactRole, ['organization', 'id']), [contactRole])

    if (loading) {
        return (
            <Loader fill size="large"/>
        )
    }

    return (
        <BaseContactRoleForm
            action={updateAction}
            organizationId={organizationId}
            initialValues={{
                ...contactRole,
                organization: get(ContactRole, ['organization', 'id']),
            }}
            mode="update"
        >
            {({ handleSave, isLoading }) => (
                <ActionBar>
                    <Button
                        key="submit"
                        onClick={handleSave}
                        type="sberDefaultGradient"
                        loading={isLoading}
                    >
                        {SaveLabel}
                    </Button>
                </ActionBar>
            )}
        </BaseContactRoleForm>
    )
}
