import React, { ComponentProps, useCallback, useMemo } from 'react'
import { BaseIncidentForm, BaseIncidentFormProps } from '../BaseIncidentForm'
import { useOrganization } from '@open-condo/next/organization'
import get from 'lodash/get'
import ActionBar from '../../../common/components/ActionBar'
import { Button } from '@open-condo/ui'
import { Incident } from '@condo/domains/ticket/utils/clientSchema'


const CreateIncidentActionBar: React.FC<ComponentProps<BaseIncidentFormProps['ActionBar']>> = (props) => {
    const { handleSave, isLoading, form } = props

    const SaveLabel = 'SaveLabel'

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

    return <BaseIncidentForm
        action={action}
        organizationId={organizationId}
        ActionBar={CreateIncidentActionBar}
    />
}
