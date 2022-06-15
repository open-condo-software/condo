import { Typography } from 'antd'
import { useRouter } from 'next/router'
import React from 'react'
import { useIntl } from '@core/next/intl'
import { useOrganization } from '@core/next/organization'
import ActionBar from '../../../common/components/ActionBar'
import { Button } from '../../../common/components/Button'
import { Loader } from '../../../common/components/Loader'
import { convertToUIFormState } from '../../../division/utils/clientSchema/Division'
import { Ticket, TicketHint } from '../../utils/clientSchema'
import { BaseTicketHintForm } from './BaseTicketHintForm'

export const UpdateTicketHintForm = ({ id }) => {
    const intl = useIntl()
    const SaveLabel = intl.formatMessage({ id: 'Save' })

    const { organization } = useOrganization()

    const router = useRouter()
    const { obj: ticketHint, loading, refetch, error } = TicketHint.useObject({ where: { id } })
    const action = TicketHint.useUpdate({ organization: organization.id }, () => {
        router.push('/settings?tab=hint')
    })
    const updateAction = (value) => action(value, ticketHint)

    if (loading) {
        return (
            <Loader fill size={'large'}/>
        )
    }

    return (
        <BaseTicketHintForm
            action={updateAction}
            organization={organization}
            initialValues={TicketHint.convertToUIFormState(ticketHint)}
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
        </BaseTicketHintForm>
    )
}