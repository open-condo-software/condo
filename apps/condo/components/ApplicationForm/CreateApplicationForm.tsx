import React from 'react'
import { useOrganization } from '@core/next/organization'
import { useRouter } from 'next/router'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { useCreate } from '../../schema/Application.uistate'
import { BaseApplicationForm } from './BaseApplicationForm'

const OPEN_STATUS = '6ef3abc4-022f-481b-90fb-8430345ebfc2'

export const CreateApplicationForm = () => {
    const { organization } = useOrganization()
    const router = useRouter()

    const action = useCreate({ organization: organization.id, status: OPEN_STATUS }, (application) => {
        router.push(`/application/${application.id}`)
    })

    return (<BaseApplicationForm action={action} initialValues={{}} organization={organization}/>)
}
