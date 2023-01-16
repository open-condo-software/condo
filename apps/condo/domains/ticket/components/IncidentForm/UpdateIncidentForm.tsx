import React, { ComponentProps, useCallback, useMemo } from 'react'
import { BaseIncidentForm, BaseIncidentFormProps } from '../BaseIncidentForm'
import get from 'lodash/get'
import { Incident, IncidentProperty, IncidentTicketClassifier } from '@condo/domains/ticket/utils/clientSchema'
import { useOrganization } from '@open-condo/next/organization'
import ActionBar from '../../../common/components/ActionBar'
import { Button } from '@open-condo/ui'
import LoadingOrErrorPage from '../../../common/components/containers/LoadingOrErrorPage'
import { useIntl } from '@open-condo/next/intl'
import dayjs from 'dayjs'

interface IUpdateIncidentForm {
    id: string
}

const UpdateIncidentActionBar: React.FC<ComponentProps<BaseIncidentFormProps['ActionBar']>> = (props) => {
    const { handleSave, isLoading, form } = props

    const UpdateLabel = 'UpdateLabel'

    return (
        <ActionBar>
            <Button
                type='primary'
                children={UpdateLabel}
                onClick={handleSave}
                disabled={isLoading}
            />
        </ActionBar>
    )
}

export const UpdateIncidentForm: React.FC<IUpdateIncidentForm> = ({ id }) => {
    const intl = useIntl()
    const ServerErrorMessage = intl.formatMessage({ id: 'ServerError' })

    const { organization } = useOrganization()
    const organizationId = useMemo(() => get(organization, 'id'), [organization])

    const {
        loading: incidentLoading,
        obj: incident,
        error: incidentError,
    } = Incident.useObject({
        where: { id },
    })

    const {
        objs: incidentProperties,
        error: incidentPropertyError,
        loading: incidentPropertyLoading,
    } = IncidentProperty.useAllObjects({
        where: { incident: { id } },
    })

    const {
        objs: incidentClassifiers,
        error: incidentClassifiersError,
        loading: incidentClassifiersLoading,
    } = IncidentTicketClassifier.useAllObjects({
        where: { incident: { id } },
    })

    const updateIncident = Incident.useUpdate({})
    const action: BaseIncidentFormProps['action'] = useCallback(
        async (values) => await updateIncident(values, incident),
        [incident, updateIncident])

    const workStart = useMemo(() => get(incident, 'workStart', null), [incident])
    const workFinish = useMemo(() => get(incident, 'workFinish', null), [incident])
    const placeClassifier = useMemo(() => get(incidentClassifiers, [0, 'classifier', 'place', 'id']), [incidentClassifiers])

    const initialValues: BaseIncidentFormProps['initialValues'] = useMemo(() => ({
        ...incident,
        incidentProperties,
        incidentClassifiers,
        workStart: workStart ? dayjs(workStart) : null,
        workFinish: workFinish ? dayjs(workFinish) : null,
        placeClassifier: placeClassifier,
    }), [incident, incidentClassifiers, incidentProperties, placeClassifier, workFinish, workStart]) as any

    console.log({initialValues, incidentClassifiers})

    const error = useMemo(
        () => incidentError || incidentPropertyError || incidentClassifiersError,
        [incidentClassifiersError, incidentError, incidentPropertyError])

    const loading = incidentLoading || incidentPropertyLoading || incidentClassifiersLoading

    if (loading && !incident) {
        const PageTitle = 'Отключение'

        return (
            <LoadingOrErrorPage
                title={PageTitle}
                loading={loading}
                error={error && ServerErrorMessage}
            />
        )
    }

    return (
        <BaseIncidentForm
            organizationId={organizationId}
            action={action}
            ActionBar={UpdateIncidentActionBar}
            initialValues={initialValues}
            loading={loading}
        />
    )
}
