import React, { useState } from 'react'
const { gql } = require('graphql-tag')
import { useQuery } from '@apollo/client'
import { Spin, Button } from 'antd'
import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'

/*
    Example usage of `fetchMore` feature of Apollo Client
    Create a ticket and update it more than 2 times to have
    TicketChange created for it.
    Then open this page and test loading using `fetchMore`

    If you see following error:
    > TypeError: Cannot read property 'fetchMore' of undefined
    It is a result of a Hot Module Reloading.
    Refresh browser page manually.
 */

const TestPage = () => {
    console.log('rendering TestPage')
    return (
        <PageWrapper>
            <PageContent>
                <Ticket/>
            </PageContent>
        </PageWrapper>
    )
}

const Ticket = () => {
    const { loading, data } = useQuery(TICKETS_QUERY)

    if (loading) {
        return <Spin/>
    }
    console.log('rendering Ticket')

    const ticket = data.allTickets[0]

    return (
        <div>
            <div>
                Ticket <strong>{ticket.id}</strong>
            </div>
            <TicketChanges ticket={ticket}/>
        </div>
    )
}

const TicketChanges = ({ticket}) => {
    const { loading, error, data, fetchMore } = useQuery(TICKET_CHANGES_QUERY, {
        variables: {
            ticketId: ticket.id,
            first: CHANGES_PER_CHUNK,
            skip: 0,
        }
    })
    const [isLoadingMore, setIsLoadingMore] = useState(false)

    if (loading && isLoadingMore) {
        return <Spin/>
    }
    if (error) return <p>ERROR</p>
    if (!data) return <p>Not found</p>

    const remaining = data._allTicketChangesMeta.count - data.allTicketChanges.length

    console.log('rendering TicketChanges')

    return (
        <>
            <ul>
                {data.allTicketChanges.map(change => (
                    <TicketChange ticketChange={change}/>
                ))}
            </ul>
            {remaining > 0 ? (
                <Button
                    onClick={() => {
                        setIsLoadingMore(true)
                        fetchMore({
                            variables: {
                                skip: data.allTicketChanges.length,
                                first: CHANGES_PER_CHUNK,
                            }
                        })
                        setIsLoadingMore(false)
                    }}
                >
                    Fetch more&nbsp;<small>{remaining} remaining</small>
                </Button>
            ) : (
                <p>All changes are loaded</p>
            )}
        </>
    )
}

const TicketChange = ({ticketChange}) => (
    <li>
        <small>Change <strong>{ticketChange.id}</strong></small>
    </li>
)

const CHANGES_PER_CHUNK = 2

const TICKETS_QUERY = gql`
    query {
        allTickets(first: 1) {
            id
            details
        }
    }
`;

const TICKET_CHANGES_QUERY = gql`
    query GetTicketChanges(
        $ticketId: ID!,
        $first: Int,
        $skip: Int
    ){
        allTicketChanges(
            where: {
                ticket: {
                    id: $ticketId
                }
            },
            first: $first,
            skip: $skip
        ) {
            id
            detailsFrom
            detailsTo
        }
        _allTicketChangesMeta(
            where: {
                ticket: {
                    id: $ticketId
                }
            }
        ) {
            count
        }
    }
`

export default TestPage