import { get } from 'lodash'
import React, { useMemo } from 'react'

import { useIntl } from '@core/next/intl'

import ActionBar from '@condo/domains/common/components/ActionBar'
import { Button } from '@condo/domains/common/components/Button'
import { Loader } from '@condo/domains/common/components/Loader'
import { TicketPropertyHint } from '@condo/domains/ticket/utils/clientSchema'

import { BaseTicketPropertyHintForm } from './BaseTicketPropertyHintForm'

export const UpdateTicketPropertyHintForm = ({ id }) => {
    const intl = useIntl()
    const SaveLabel = intl.formatMessage({ id: 'Save' })

    const { obj: ticketPropertyHint, loading } = TicketPropertyHint.useNewObject({ where: { id } })
    const action = TicketPropertyHint.useNewUpdate({})
    const updateAction = (value) => {
        if (value.organization) {
            value.organization = { connect: { id: value.organization } }
        }
        action(value, ticketPropertyHint)
    }
    const organizationId = useMemo(() => get(ticketPropertyHint, ['organization', 'id']), [ticketPropertyHint])

    if (loading) {
        return (
            <Loader fill size={'large'}/>
        )
    }

    return (
        <BaseTicketPropertyHintForm
            action={updateAction}
            organizationId={organizationId}
            initialValues={{
                ...ticketPropertyHint,
                organization: get(TicketPropertyHint, ['organization', 'id']),
            }}
            mode={'update'}
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