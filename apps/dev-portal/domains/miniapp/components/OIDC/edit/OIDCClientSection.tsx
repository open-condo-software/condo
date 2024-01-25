import { Spin } from 'antd'
import React from 'react'

import { CreateClientForm } from './CreateClientForm'
import { EditClientForm } from './EditClientForm'
import styles from './OIDCClientSection.module.css'
import { SecretContextProvider } from './SecretContextProvider'

import { useGetOidcClientInfoQuery } from '@/lib/gql'

export const OIDCClientSection: React.FC<{ id: string }> = ({ id }) => {
    const { data, loading } = useGetOidcClientInfoQuery({ variables: { where: { b2cApp: { id } } } })
    const client = data?.clients?.length ? data.clients[0] : null

    return (
        <SecretContextProvider>
            {loading ? (
                <Spin className={styles.fullWidthSpinner} size='large'/>
            ) : (
                client ? (
                    <EditClientForm
                        id={client.id}
                        clientId={client.clientId}
                        developmentRedirectUri={client.developmentRedirectUri}
                        productionRedirectUri={client.productionRedirectUri}
                    />
                ) : (
                    <CreateClientForm appId={id}/>
                )
            )}
        </SecretContextProvider>
    )
}