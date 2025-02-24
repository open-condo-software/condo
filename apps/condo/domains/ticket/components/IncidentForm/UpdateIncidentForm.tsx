import {
    useGetIncidentByIdQuery,
    useGetIncidentClassifierIncidentQuery,
    useGetIncidentPropertiesQuery,
    useUpdateIncidentMutation,
} from '@app/condo/gql'
import dayjs from 'dayjs'
import { useRouter } from 'next/router'
import React, { ComponentProps, useCallback, useMemo } from 'react'

import { useCachePersistor } from '@open-condo/apollo'
import { getClientSideSenderInfo } from '@open-condo/codegen/utils/userId'
import { useIntl } from '@open-condo/next/intl'
import { ActionBar, Button } from '@open-condo/ui'

import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'

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
    const { push, query } = useRouter()
    const incidentId = useMemo(() => query?.id, [query])
    const onCancel = useCallback(async () => {
        incidentId && await push(`/incident/${incidentId}`)
    }, [incidentId, push])

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

    const { push } = useRouter()
    const { persistor } = useCachePersistor()

    const {
        loading: incidentLoading,
        data: incidentData,
        error: incidentError,
    } = useGetIncidentByIdQuery({
        variables: {
            incidentId: id,
        },
        skip: !id || !persistor,
    })

    const incident = useMemo(() => incidentData?.incident || null, [incidentData?.incident])
    const organizationId = useMemo(() => incident?.organization?.id || null, [incident])

    const {
        loading: incidentPropertyAllDataLoaded,
        data: incidentPropertiesData,
        error: incidentPropertyError,
    } = useGetIncidentPropertiesQuery({
        variables: {
            where: {
                incident: { id },
            },
        },
        skip: !id || !persistor,
    })
    const incidentProperties = useMemo(() => incidentPropertiesData?.incidentProperties?.filter(Boolean) || [], [incidentPropertiesData?.incidentProperties])

    const {
        loading: incidentClassifiersAllDataLoaded,
        data: incidentClassifiersData,
        error: incidentClassifiersError,
    } = useGetIncidentClassifierIncidentQuery({
        variables: {
            where: { incident: { id } },
        },
        skip: !id || !persistor,
    })

    const incidentClassifiers = useMemo(() => incidentClassifiersData?.incidentClassifierIncident?.filter(Boolean) || [], [incidentClassifiersData?.incidentClassifierIncident])

    const [updateIncident] = useUpdateIncidentMutation({
        onCompleted: async () => await push(`/incident/${[id]}`),
    })
    const action: BaseIncidentFormProps['action'] = useCallback(
        async (values) => await updateIncident({
            variables: {
                id: id,
                data: {
                    ...values,
                    sender: getClientSideSenderInfo(),
                    dv: 1,
                },
            },
        }),
        [id, updateIncident])

    const workStart = useMemo(() => incident?.workStart || null, [incident])
    const workFinish = useMemo(() => incident?.workFinish || null, [incident])
    const placeClassifier = useMemo(() => incidentClassifiers[0]?.classifier?.id || null, [incidentClassifiers])

    const initialValues: BaseIncidentFormProps['initialValues'] = useMemo(() => ({
        ...incident,
        ...incidentProperties,
        ...incidentClassifiers,
        workStart: workStart ? dayjs(workStart) : null,
        workFinish: workFinish ? dayjs(workFinish) : null,
        placeClassifier: placeClassifier,
    }), [incident, incidentClassifiers, incidentProperties, placeClassifier, workFinish, workStart]) as any

    const error = useMemo(
        () => incidentError || incidentPropertyError || incidentClassifiersError,
        [incidentClassifiersError, incidentError, incidentPropertyError])

    const loading = incidentLoading || incidentPropertyAllDataLoaded || incidentClassifiersAllDataLoaded

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
            showOrganization={showOrganization}
        />
    )
}
