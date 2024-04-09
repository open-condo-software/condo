import dayjs from 'dayjs'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { ComponentProps, useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { ActionBar, Button } from '@open-condo/ui'

import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { Incident, IncidentProperty, IncidentClassifierIncident } from '@condo/domains/ticket/utils/clientSchema'

import { BaseIncidentForm, BaseIncidentFormProps } from './BaseIncidentForm'


export interface IUpdateIncidentForm {
    id: string
    showOrganization?: boolean
}

export const UpdateIncidentActionBar: React.FC<ComponentProps<BaseIncidentFormProps['ActionBar']>> = (props) => {
    const intl = useIntl()
    const UpdateLabel = intl.formatMessage({ id: 'incident.form.save.label' })
    const CancelLabel = intl.formatMessage({ id: 'Cancel' })

    const { handleSave, isLoading } = props
    const router = useRouter()
    const incidentId = get(router, 'query.id')
    const onCancel = useCallback(async () => {
        incidentId && await router.push(`/incident/${incidentId}`)
    }, [incidentId, router])

    return (
        <ActionBar
            actions={[
                <Button
                    key='update'
                    type='primary'
                    children={UpdateLabel}
                    onClick={handleSave}
                    disabled={isLoading}
                />,
                <Button
                    key='cancel'
                    onClick={onCancel}
                    type='secondary'
                >
                    {CancelLabel}
                </Button>,
            ]}
        />
    )
}

export const UpdateIncidentForm: React.FC<IUpdateIncidentForm> = (props) => {
    const intl = useIntl()
    const ServerErrorMessage = intl.formatMessage({ id: 'ServerError' })
    const PageTitle = intl.formatMessage({ id: 'incident.update.title' })

    const { id, showOrganization } = props

    const router = useRouter()

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
        allDataLoaded: incidentPropertyAllDataLoaded,
    } = IncidentProperty.useAllObjects({
        where: { incident: { id } },
    })

    const {
        objs: incidentClassifiers,
        error: incidentClassifiersError,
        allDataLoaded: incidentClassifiersAllDataLoaded,
    } = IncidentClassifierIncident.useAllObjects({
        where: { incident: { id } },
    })

    const organizationId = useMemo(() => get(incident, 'organization.id', null), [incident])

    const updateIncident = Incident.useUpdate({})
    const action: BaseIncidentFormProps['action'] = useCallback(
        async (values) => await updateIncident(values, incident),
        [incident, updateIncident])
    const afterAction: BaseIncidentFormProps['afterAction'] = useCallback(
        async () => await router.push(`/incident/${id}`),
        [id, router])

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

    const error = useMemo(
        () => incidentError || incidentPropertyError || incidentClassifiersError,
        [incidentClassifiersError, incidentError, incidentPropertyError])

    const loading = incidentLoading || !incidentPropertyAllDataLoaded || !incidentClassifiersAllDataLoaded

    if (loading && !incident) {
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
            afterAction={afterAction}
            showOrganization={showOrganization}
        />
    )
}
