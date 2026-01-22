import get from 'lodash/get'
import React, { useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { ActionBar, Button } from '@open-condo/ui'

import { Loader } from '@condo/domains/common/components/Loader'
import { TicketPropertyHint } from '@condo/domains/ticket/utils/clientSchema'

import { BaseTicketPropertyHintForm } from './BaseTicketPropertyHintForm'

export const UpdateTicketPropertyHintForm = ({ id }) => {
    const intl = useIntl()
    const SaveLabel = intl.formatMessage({ id: 'Save' })

    const { obj: ticketPropertyHint, loading } = TicketPropertyHint.useObject({ where: { id } })
    const action = TicketPropertyHint.useUpdate({})
    const updateAction = useCallback(async (value) => {
        if (value.organization) {
            value.organization = { connect: { id: value.organization } }
        }
        await action(value, ticketPropertyHint)
    }, [ticketPropertyHint])
    const organizationId = useMemo(() => get(ticketPropertyHint, ['organization', 'id']), [ticketPropertyHint])

    if (loading) {
        return (
            <Loader fill size='large'/>
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
            mode='update'
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
                />
            )}
        </BaseTicketPropertyHintForm>
    )
}