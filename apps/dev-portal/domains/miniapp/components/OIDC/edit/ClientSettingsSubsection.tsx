import { Spin } from 'antd'
import React from 'react'

import styles from './ClientSettingsSubsection.module.css'
import { CreateClientForm } from './CreateClientForm'
import { EditClientForm } from './EditClientForm'
import { SecretContextProvider } from './SecretProvider'

import { AppEnvironment, useGetOidccLientQuery } from '@/lib/gql'

type ClientSettingsSubsectionProps = {
    id: string
    environment: AppEnvironment
}

export const ClientSettingsSubsection: React.FC<ClientSettingsSubsectionProps> = ({ id, environment }) => {
    const { data, loading } = useGetOidccLientQuery({
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
            <Spin size='large' className={styles.spinnerContainer}/>
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