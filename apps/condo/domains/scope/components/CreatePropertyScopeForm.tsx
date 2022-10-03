import { get } from 'lodash'
import React, { useMemo } from 'react'
import { useIntl } from '@condo/next/intl'
import { useOrganization } from '@condo/next/organization'

import ActionBar from '@condo/domains/common/components/ActionBar'
import { Button } from '@condo/domains/common/components/Button'
import { PropertyScope } from '@condo/domains/scope/utils/clientSchema'

import { BasePropertyScopeForm } from './BasePropertyScopeForm'


export const CreateTicketPropertyHintForm = () => {
    const intl = useIntl()
    const SaveLabel = intl.formatMessage({ id: 'Save' })

    const { organization } = useOrganization()
    const action = PropertyScope.useCreate({ organization: { connect: { id: organization.id } } })

    const organizationId = useMemo(() => get(organization, 'id'), [organization])

    return (
        <BasePropertyScopeForm
            action={action}
            organizationId={organizationId}
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