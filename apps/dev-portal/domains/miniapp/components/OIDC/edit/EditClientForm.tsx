import React from 'react'
import { useIntl } from 'react-intl'

import { SubSection, Section } from '@/domains/miniapp/components/AppSettings'
import { EditCredentialsForm } from '@/domains/miniapp/components/OIDC/edit/EditCredentialsForm'


type EditClientFormProps = {
    id: string
    clientId?: string | null
}

export const EditClientForm: React.FC<EditClientFormProps> = ({ id, clientId }) => {
    const intl = useIntl()
    const CredentialsSectionTitle = intl.formatMessage({ id: 'apps.b2c.sections.oidc.editCredentialsSubsection.title' })

    return (
        <Section>
            <SubSection title={CredentialsSectionTitle}>
                <EditCredentialsForm id={id} clientId={clientId}/>
            </SubSection>
            <SubSection title='456'>
                123
            </SubSection>
        </Section>
    )
}