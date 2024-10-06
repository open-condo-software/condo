import { NetworkStatus } from '@apollo/client'
import { initializeApollo, prepareSSRContext } from '@/domains/common/utils/next/apollo'
import { useRouter } from 'next/router'
import React, { useMemo, useState } from 'react'

import { useCachePersistor } from '@open-condo/apollo'


import type { GetServerSideProps } from 'next'

import {
    GetAllContactsDocument,
    GetAllContactsQuery,
    GetAllContactsQueryVariables,
    useGetAllContactsQuery,
} from '@/gql'
import { prefetchAuthOrRedirect } from '@/domains/common/utils/next/auth'
import { prefetchOrganizationEmployee } from '@/domains/common/utils/next/organization'
import { extractSSRState } from '@/domains/common/utils/next/ssr'
import { SortContactsBy } from '@/schema'


// const GET_CONTACTS = gql`
// query getAllContacts($where: ContactWhereInput, $first: Int = 100, $skip: Int, $sortBy: [SortContactsBy!]) {
//   objs: allContacts(where: $where, first: $first, skip: $skip, sortBy: $sortBy) {
//     organization {
//       id
//       name
//     }
//     property {
//       id
//       address
//     }
//     name
//     phone
//     unitName
//     unitType
//     email
//     role {
//       id
//       name
//     }
//     quota
//     isVerified
//     id
//     deletedAt
//     createdBy {
//       id
//       name
//     }
//     updatedBy {
//       id
//       name
//     }
//     createdAt
//     updatedAt
//   }
//
//   meta: _allContactsMeta(where: $where) {
//     count
//   }
// }
// `


const ApolloPage = () => {
    const router = useRouter()

    const [inputValue, setInputValue] = useState<string>('')
    const [search, setSearch] = useState<string>('')
    const [page, setPage] = useState<number>(0)

    const { persistor } = useCachePersistor()

    const { loading, error, data, refetch, networkStatus, fetchMore } = useGetAllContactsQuery( {
        variables: {
            where: {
                name_contains_i: search,
            },
            first: 3,
            skip: page * 3,
        },
        skip: !persistor,
        // notifyOnNetworkStatusChange: true,
        // fetchPolicy: 'network-only',
        // nextFetchPolicy: 'cache-only'
        // skip: !search,

    })

    const Content = useMemo(() => {
        if (networkStatus === NetworkStatus.refetch) return <div>Refetching...</div>
        if (loading) return <div>Loading...</div>
        if (error) return <div>{`Error! ${error.message}`}</div>

        if (!data?.objs?.length) return 'Not found :-('

        console.log('::ApolloPage:: >>> ', {
            data,
        })

        return (
            <>
                <ul>
                    {data.objs.map((contact) => (
                        <li key={contact.id}>{contact.name} | {contact.id} | {contact.phone} | {contact.email} <a onClick={() => router.push(`/apollo/${contact.id}/update`)}>(Open)</a></li>
                    ))}
                </ul>
            </>
        )
    }, [data?.objs, error, loading, networkStatus])

    return (
        <div style={{ width: '100%', padding: 24 }}>
            <div>Hello Apollo!</div>
            <div>
                <input value={inputValue} onChange={(e) => setInputValue(e.target.value)}/>
                <button onClick={() => setSearch(inputValue)}>Search</button>
                <button onClick={() => {
                    setInputValue('')
                    setSearch('')
                    setPage(0)
                }}>Clear</button>
                <button onClick={() => refetch()}>Refetch</button>
            </div>
            <div>
                <button disabled={page < 1} onClick={async () => {
                    setPage(prev => prev - 1)
                }}>Back
                </button>
                <button disabled={data?.meta?.count <= (page + 1) * 3} onClick={async () => {
                    setPage(prev => prev + 1)
                }}>Next
                </button>
            </div>
            <div>
                {Content}
            </div>
        </div>
    )
}

export default ApolloPage

export const getServerSideProps: GetServerSideProps = async (context) => {
    const { req, res } = context

    // @ts-ignore In Next 9 the types (only!) do not match the expected types
    const { headers } = prepareSSRContext(req, res)
    const client = initializeApollo({ headers })

    const { redirect, user } = await prefetchAuthOrRedirect(client, context)
    if (redirect) return redirect

    const { activeEmployee } = await prefetchOrganizationEmployee({ client, context, userId: user.id })

    const result = await client.query<GetAllContactsQuery, GetAllContactsQueryVariables>({
        query: GetAllContactsDocument,
        variables: {
            where: {
                name_contains_i: '',
            },
            first: 3,
            skip: 0,
            sortBy: [SortContactsBy.CreatedAtAsc],
        },
    })

    console.log('::result:: >>> ', result)

    return extractSSRState(client, req, res, {
        props: {},
    })
}
