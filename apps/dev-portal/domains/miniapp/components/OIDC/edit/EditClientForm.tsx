import React from 'react'
import { useIntl } from 'react-intl'

import { SubSection, Section } from '@/domains/miniapp/components/AppSettings'
import { EditCredentialsForm } from '@/domains/miniapp/components/OIDC/edit/EditCredentialsForm'
import { EditURLsForm } from '@/domains/miniapp/components/OIDC/edit/EditURLsForm'


type EditClientFormProps = {
    id: string
    clientId?: string | null
    developmentRedirectUri?: string | null
    productionRedirectUri?: string | null
}

export const EditClientForm: React.FC<EditClientFormProps> = ({ id, clientId, developmentRedirectUri, productionRedirectUri }) => {
    const intl = useIntl()
    const CredentialsSectionTitle = intl.formatMessage({ id: 'apps.b2c.sections.oidc.editCredentialsSubsection.title' })
    const CallbackUrlsSectionTitle = intl.formatMessage({ id: 'apps.b2c.sections.oidc.editUrlsSubsection.title' })

    return (
        <Section>
            <SubSection title={CredentialsSectionTitle}>
                <EditCredentialsForm id={id} clientId={clientId}/>
            </SubSection>
            <SubSection title={CallbackUrlsSectionTitle}>
                <EditURLsForm
                    id={id}
                    developmentRedirectUri={developmentRedirectUri}
                    productionRedirectUri={productionRedirectUri}
                />
            </SubSection>
        </Section>
    )
}