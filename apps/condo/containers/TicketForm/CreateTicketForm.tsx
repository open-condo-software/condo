import React from 'react'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { useOrganization } from '@core/next/organization'
import { useRouter } from 'next/router'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { Ticket } from '../../utils/clientSchema/Ticket'
import { BaseTicketForm } from '../../components/BaseTicketForm'

const OPEN_STATUS = '6ef3abc4-022f-481b-90fb-8430345ebfc2'

export const CreateTicketForm:React.FunctionComponent = () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { organization } = useOrganization()
    const router = useRouter()

    const action = Ticket.useCreate({ organization: organization.id, status: OPEN_STATUS }, (ticket) => {
        router.push(`/ticket/${ticket.id}`)
    })

    return (<BaseTicketForm action={action} initialValues={{}} organization={organization}/>)
}
