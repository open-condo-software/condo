import React from 'react'

import { Spin } from '@/domains/common/components/Spin'

import { CreateClientForm } from './CreateClientForm'
import { EditClientForm } from './EditClientForm'
import { SecretContextProvider } from './SecretProvider'

import { AppEnvironment, useGetOidcClientQuery } from '@/lib/gql'

type ClientSettingsSubsectionProps = {
    id: string
    environment: AppEnvironment
}

export const ClientSettingsSubsection: React.FC<ClientSettingsSubsectionProps> = ({ id, environment }) => {
    const { data, loading } = useGetOidcClientQuery({
        variables: {
            data: {
                environment,
                app: { id },
            },
        },
        fetchPolicy: 'cache-and-network',
    })

    if (loading) {
        return (
            <Spin size='large'/>
        )
    }

    return (
        <SecretContextProvider>
            {data?.client ? (
                <EditClientForm id={id} environment={environment} client={data.client}/>
            ) : (
                <CreateClientForm id={id} environment={environment}/>
            )}
        </SecretContextProvider>
    )
}