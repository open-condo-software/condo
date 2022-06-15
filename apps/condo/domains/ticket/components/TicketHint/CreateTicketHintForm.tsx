import { Form } from 'antd'
import { useRouter } from 'next/router'
import React  from 'react'
import { useOrganization } from '@core/next/organization'
import { useIntl } from '@core/next/intl'
import ActionBar from '../../../common/components/ActionBar'
import { Button } from '../../../common/components/Button'
import { TicketHint } from '../../utils/clientSchema'
import { BaseTicketHintForm } from './BaseTicketHintForm'

export const CreateTicketHintForm = () => {
    const intl = useIntl()
    const SaveLabel = intl.formatMessage({ id: 'Save' })

    const { organization } = useOrganization()

    const router = useRouter()
    const action = TicketHint.useCreate({ organization: organization.id }, () => {
        router.push('/settings?tab=hint')
    })

    return (
        <BaseTicketHintForm
            action={action}
            organization={organization}
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
        </BaseTicketHintForm>
    )
}