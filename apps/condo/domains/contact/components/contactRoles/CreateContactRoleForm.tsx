import get from 'lodash/get'
import React, { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar, Button } from '@open-condo/ui'

import { ContactRole } from '@condo/domains/contact/utils/clientSchema'

import { BaseContactRoleForm } from './BaseContactRoleForm'


export const CreateContactRoleForm = () => {
    const intl = useIntl()
    const SaveLabel = intl.formatMessage({ id: 'Save' })

    const { organization } = useOrganization()
    const action = ContactRole.useCreate({ organization: { connect: { id: organization.id } } })

    const organizationId = useMemo(() => get(organization, 'id'), [organization])

    return (
        <BaseContactRoleForm
            action={action}
            organizationId={organizationId}
            initialValues={{}}
            mode='create'
        >
            {({ handleSave, isLoading }) => (
                <ActionBar
                    actions={[
                        <Button
                            key='submit'
                            onClick={handleSave}
                            type='primary'
                            loading={isLoading}
                        >
                            {SaveLabel}
                        </Button>,
                    ]}
                >
                </ActionBar>
            )}
        </BaseContactRoleForm>
    )
}
