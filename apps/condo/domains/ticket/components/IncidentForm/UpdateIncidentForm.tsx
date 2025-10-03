import {
    useGetIncidentByIdQuery,
    useGetIncidentClassifierIncidentByIncidentIdQuery,
    useGetIncidentPropertiesByIncidentIdQuery,
    useUpdateIncidentMutation,
    GetIncidentByIdDocument,
    GetIncidentPropertiesByIncidentIdDocument,
    GetIncidentChangesByIncidentIdDocument,
} from '@app/condo/gql'
import dayjs from 'dayjs'
import { useRouter } from 'next/router'
import React, { ComponentProps, useCallback, useMemo } from 'react'

import { useCachePersistor } from '@open-condo/apollo'
import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
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
    const router = useRouter()
    const incidentId =  typeof router.query?.id === 'string' ? router.query?.id : null
    const onCancel = useCallback(async () => {
        incidentId && await router.push(`/incident/${incidentId}`)
    }, [incidentId, router.push])

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

    const { id: incidentId, showOrganization } = props

    const { push } = useRouter()
    const { persistor } = useCachePersistor()

    const {
        loading: incidentLoading,
        data: incidentData,
        error: incidentError,
    } = useGetIncidentByIdQuery({
        variables: {
            incidentId,
        },
        skip: !incidentId || !persistor,
    })

    const incident = useMemo(() => incidentData?.incident || null, [incidentData?.incident])
    const organizationId = useMemo(() => incident?.organization?.id || null, [incident])

    const {
        loading: incidentPropertyLoading,
        data: incidentPropertiesData,
        error: incidentPropertyError,
    } = useGetIncidentPropertiesByIncidentIdQuery({
        variables: {
            incidentId,
        },
        skip: !incidentId || !persistor,
    })
    const incidentProperties = useMemo(() => incidentPropertiesData?.incidentProperties?.filter(Boolean) || [], [incidentPropertiesData?.incidentProperties])

    const {
        loading: incidentClassifiersLoading,
        data: incidentClassifiersData,
        error: incidentClassifiersError,
    } = useGetIncidentClassifierIncidentByIncidentIdQuery({
        variables: {
            incidentId,
        },
        skip: !incidentId || !persistor,
    })

    const incidentClassifiers = useMemo(() => incidentClassifiersData?.incidentClassifierIncident?.filter(Boolean) || [], [incidentClassifiersData?.incidentClassifierIncident])

    const [updateIncident] = useUpdateIncidentMutation({
        refetchQueries: [
            { query: GetIncidentByIdDocument, variables: { incidentId } },
            { query: GetIncidentPropertiesByIncidentIdDocument, variables: { incidentId } },
            { query: GetIncidentChangesByIncidentIdDocument, variables: { incidentId } },
        ],
    })
    const action: BaseIncidentFormProps['action'] = useCallback(
        async (values) => await updateIncident({
            variables: {
                id: incidentId,
                data: {
                    ...values,
                    sender: getClientSideSenderInfo(),
                    dv: 1,
                },
            },
        }),
        [incidentId, updateIncident]
    )

    const workStart = useMemo(() => incident?.workStart || null, [incident])
    const workFinish = useMemo(() => incident?.workFinish || null, [incident])
    const placeClassifier = useMemo(() => incidentClassifiers[0]?.classifier?.id || null, [incidentClassifiers])

    const initialValues: BaseIncidentFormProps['initialValues'] = useMemo(() => ({
        ...incident,
        incidentProperties,
        incidentClassifiers,
        workStart: workStart ? dayjs(workStart) : null,
        workFinish: workFinish ? dayjs(workFinish) : null,
        placeClassifier,
    }), [incident, incidentClassifiers, incidentProperties, placeClassifier, workFinish, workStart])

    const error = useMemo(
        () => incidentError || incidentPropertyError || incidentClassifiersError,
        [incidentClassifiersError, incidentError, incidentPropertyError]
    )

    const loading = incidentLoading || incidentPropertyLoading || incidentClassifiersLoading

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
            afterAction={async () => {
                await push(`/incident/${incidentId}`)
            }}
            ActionBar={UpdateIncidentActionBar}
            initialValues={initialValues}
            loading={loading}
            showOrganization={showOrganization}
        />
    )
}
