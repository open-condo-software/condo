import React from 'react'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { useOrganization } from '@core/next/organization'
import { useRouter } from 'next/router'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { Ticket } from '../../utils/clientSchema/Ticket'
import { BaseTicketForm } from '../../components/BaseTicketForm'
import { OPEN as OPEN_STATUS } from '../../constants/statusIds'

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
