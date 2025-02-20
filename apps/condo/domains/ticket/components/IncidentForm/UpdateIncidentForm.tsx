import {
    useGetIncidentByIdQuery,
    useGetIncidentClassifierIncidentQuery,
    useGetIncidentPropertiesQuery,
    useUpdateIncidentMutation,
} from '@app/condo/gql'
import dayjs from 'dayjs'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { ComponentProps, useCallback, useMemo } from 'react'

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

    const { push } = useRouter()

    const {
        loading: incidentLoading,
        data: incident,
        error: incidentError,
    } = useGetIncidentByIdQuery({
        variables: {
            id,
        },
    })

    const {
        loading: incidentPropertyAllDataLoaded,
        data: incidentProperties,
        error: incidentPropertyError,
    } = useGetIncidentPropertiesQuery({
        variables: {
            where: {
                incident: { id },
            },
        },
    })

    const {
        loading: incidentClassifiersAllDataLoaded,
        data: incidentClassifiers,
        error: incidentClassifiersError,
    } = useGetIncidentClassifierIncidentQuery({
        variables: {
            where: { incident: { id } },
        },
    })

    const organizationId = useMemo(() => get(incident, 'organization.id', null), [incident])

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

    const workStart = useMemo(() => get(incident, 'workStart', null), [incident])
    const workFinish = useMemo(() => get(incident, 'workFinish', null), [incident])
    const placeClassifier = useMemo(() => get(incidentClassifiers, [0, 'classifier', 'place', 'id']), [incidentClassifiers])

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
