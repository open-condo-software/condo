import { get } from 'lodash'
import React, { useMemo } from 'react'

import { useOrganization } from '@core/next/organization'
import { useIntl } from '@core/next/intl'

import ActionBar from '@condo/domains/common/components/ActionBar'
import { Button } from '@condo/domains/common/components/Button'

import { TicketPropertyHint } from '@condo/domains/ticket/utils/clientSchema'

import { BaseTicketPropertyHintForm } from './BaseTicketPropertyHintForm'

export const CreateTicketPropertyHintForm = () => {
    const intl = useIntl()
    const SaveLabel = intl.formatMessage({ id: 'Save' })

    const { organization } = useOrganization()
    const action = TicketPropertyHint.useCreate({ organization: { connect: { id: organization.id } } })

    const organizationId = useMemo(() => get(organization, 'id'), [organization])

    return (
        <BaseTicketPropertyHintForm
            action={action}
            organizationId={organizationId}
            initialValues={{}}
            mode={'create'}
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
        </BaseTicketPropertyHintForm>
    )
}