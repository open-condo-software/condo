import { get } from 'lodash'
import { useRouter } from 'next/router'
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

    const router = useRouter()
    const { obj: ticketPropertyHint, loading } = TicketPropertyHint.useObject({ where: { id } })
    const action = TicketPropertyHint.useUpdate({}, () => {
        router.push('/settings?tab=hint')
    })
    const updateAction = (value) => action(value, ticketPropertyHint)
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
            initialValues={TicketPropertyHint.convertToUIFormState(ticketPropertyHint)}
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