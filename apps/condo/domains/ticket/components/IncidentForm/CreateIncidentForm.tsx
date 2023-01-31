import get from 'lodash/get'
import React, { ComponentProps, useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Button } from '@open-condo/ui'

import ActionBar from '@condo/domains/common/components/ActionBar'
import { Incident } from '@condo/domains/ticket/utils/clientSchema'

import { BaseIncidentForm, BaseIncidentFormProps } from './BaseIncidentForm'


export const CreateIncidentActionBar: React.FC<ComponentProps<BaseIncidentFormProps['ActionBar']>> = (props) => {
    const intl = useIntl()
    const SaveLabel = intl.formatMessage({ id: 'incident.form.save.label' })

    const { handleSave, isLoading } = props

    return (
        <ActionBar>
            <Button
                type='primary'
                children={SaveLabel}
                onClick={handleSave}
                disabled={isLoading}
            />
        </ActionBar>
    )
}


export const CreateIncidentForm: React.FC = () => {
    const { organization } = useOrganization()
    const organizationId = useMemo(() => get(organization, 'id'), [organization])

    const createIncident = Incident.useCreate({ organization: { connect: { id: organizationId } } })
    const action: BaseIncidentFormProps['action'] = useCallback(async (values) => await createIncident(values), [createIncident])

    return (
        <BaseIncidentForm
            action={action}
            organizationId={organizationId}
            ActionBar={CreateIncidentActionBar}
        />
    )
}
