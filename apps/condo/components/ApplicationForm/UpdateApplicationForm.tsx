import React from 'react'
import { useOrganization } from '@core/next/organization'
import { Typography } from 'antd'
import { useIntl } from '@core/next/intl'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { useObject, useUpdate, convertGQLItemToFormState } from '../../schema/Application.uistate'
import { BaseApplicationForm } from './BaseApplicationForm'

interface IUpdateApplicationForm {
    id: string
}

export const UpdateApplicationForm:React.FunctionComponent<IUpdateApplicationForm> = ({ id }) => {
    const intl = useIntl()
    const LoadingMsg = intl.formatMessage({ id: 'Loading' })

    const { organization } = useOrganization()
    const { obj, refetch, loading, error } = useObject({ where: { id } }, false)

    const action = useUpdate({}, refetch)
    const updateAction = (value) => action(value, obj)

    if (error || loading) {
        return (
            <>
                {(loading) ? <Typography.Title>{LoadingMsg}</Typography.Title> : null}
                {(error) ? <Typography.Title>{error}</Typography.Title> : null}
            </>
        )
    }

    return (
        <BaseApplicationForm
            action={updateAction}
            initialValues={convertGQLItemToFormState(obj)}
            organization={organization}
        />
    )
}
