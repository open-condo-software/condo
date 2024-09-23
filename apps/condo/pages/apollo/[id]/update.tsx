import { gql, useQuery, NetworkStatus, useMutation } from '@apollo/client'
import { useRouter } from 'next/router'
import React, { useMemo, useState } from 'react'

import type { GetServerSideProps } from 'next'

import { initializeApollo } from '@/lib/apollo'
import { prefetchAuth } from '@/lib/auth'
import { extractSSRState } from '@/lib/ssr'


const GET_CONTACT = gql`
query getAllContacts($where: ContactWhereInput, $first: Int = 1) {
  obj: allContacts(where: $where, first: $first) {
    organization {
      id
      name
    }
    property {
      id
      address
    }
    name
    phone
    unitName
    unitType
    email
    role {
      id
      name
    }
    quota
    isVerified
    id
    deletedAt
    createdBy {
      id
      name
    }
    updatedBy {
      id
      name
    }
    createdAt
    updatedAt
  }
}
`

const UPDATE_CONTACT = gql`
mutation updateContact($id: ID!, $data: ContactUpdateInput) {
  obj: updateContact(id: $id, data: $data) {
    organization {
      id
      name
    }
    property {
      id
      address
    }
    name
    phone
    unitName
    unitType
    email
    role {
      id
      name
    }
    quota
    isVerified
    id
    deletedAt
    createdBy {
      id
      name
    }
    updatedBy {
      id
      name
    }
    createdAt
    updatedAt
  }
}
`


const ApolloUpdatePage = () => {
    const router = useRouter()
    const { query } = router

    const [name, setName] = useState<string>('')
    const [phone, setPhone] = useState<string>('')
    const [email, setEmail] = useState<string>('')

    const { loading, error, data } = useQuery(GET_CONTACT, {
        variables: {
            where: {
                id: query.id as string,
            },
        },
        onCompleted: (data) => {
            console.log('onCompleted', {
                data,
            })
            setName((data?.obj || [])[0]?.name || '')
            setPhone((data?.obj || [])[0]?.phone || '')
            setEmail((data?.obj || [])[0]?.email || '')
        },
        // notifyOnNetworkStatusChange: true,
        // fetchPolicy: 'network-only',
        // nextFetchPolicy: 'cache-only'
        // skip: !search,
    })

    const [updateContact, updatedResult] = useMutation(UPDATE_CONTACT, {
        variables: { id: query.id },
        onCompleted: () => {
            router.push('/apollo')
        },
    })


    const Content = useMemo(() => {
        if (loading) return <div>Loading...</div>
        if (error) return <div>{`Error! ${error.message}`}</div>
        if (!data?.obj?.length) return 'Not found :-('

        return (
            <div>
                <div>
                    <label>name</label>
                    <input type='text' name='name' value={name} onChange={e => setName(e.target.value)}/>
                </div>
                <div>
                    <label>phone</label>
                    <input type='text' name='phone' value={phone} onChange={e => setPhone(e.target.value)}/>
                </div>
                <div>
                    <label>email</label>
                    <input type='text' name='email' value={email} onChange={e => setEmail(e.target.value)}/>
                </div>
                <div>
                    <button
                        disabled={!data?.obj || loading || !!error || updatedResult.loading}
                        onClick={() => {
                            const dv = 1
                            const sender = { dv, fingerprint: 'tewsklsdnsal' }
                            // @ts-ignore
                            updateContact({ variables: { data: { name, phone, email, dv, sender } } })
                        }}
                    >Save
                    </button>
                </div>
            </div>
        )
    }, [data?.obj, email, error, loading, name, phone, updateContact, updatedResult.loading])

    return (
        <div style={{ width: '100%', padding: 24 }}>
            <div>Hello Apollo ID! {query.id}</div>
            <div>
                {Content}
            </div>
            <div>

            </div>
        </div>
    )
}

export default ApolloUpdatePage

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
    // @ts-ignore In Next 9 the types (only!) do not match the expected types
    const { headers } = prepareSSRContext(req, res)
    const client = initializeApollo({ headers })

    const user = await prefetchAuth(client)

    if (!user) {
        return {
            unstable_redirect: {
                destination: '/auth/signin',
                permanent: false,
            },
        }
    }

    return extractSSRState(client, req, res, {
        props: {},
    })
}
