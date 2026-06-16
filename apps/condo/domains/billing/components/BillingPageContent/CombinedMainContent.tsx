import { useGetB2BAppsWithBillingTabEmbeddingConfigQuery } from '@app/condo/gql'
import get from 'lodash/get'
import getConfig from 'next/config'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Radio, Tabs } from '@open-condo/ui'
import type { TabItem } from '@open-condo/ui'

import { PAYMENT_TYPES, PaymentTypes } from '@condo/domains/acquiring/utils/clientSchema'
import { AccrualsTab } from '@condo/domains/billing/components/BillingPageContent/AccrualsTab'
import { B2BAppBillingTab } from '@condo/domains/billing/components/BillingPageContent/B2BAppBillingTab'
import { useBillingAndAcquiringContexts } from '@condo/domains/billing/components/BillingPageContent/ContextProvider'
import { EmptyContent } from '@condo/domains/billing/components/BillingPageContent/EmptyContent'
import { PaymentsTab } from '@condo/domains/billing/components/BillingPageContent/PaymentsTab'
import { ACCRUALS_TAB_KEY, EXTENSION_TAB_KEY, PAYMENTS_TAB_KEY } from '@condo/domains/billing/constants/constants'
import { updateQuery } from '@condo/domains/common/utils/helpers'
import { parseQuery } from '@condo/domains/common/utils/tables.utils'
import { IFrame } from '@condo/domains/miniapp/components/IFrame'


const VIEW_TYPES = [PAYMENT_TYPES.registry, PAYMENT_TYPES.list]
const { publicRuntimeConfig: { registryUploadIntegrationId } } = getConfig()

type ExtensionTabType = {
    id: string
    appUrl: string
    label: string
    integrationId?: string | null
    shortDescription?: string | null
    isB2BApp?: boolean
}

type RegistryIframeProps = {
    appUrl?: string
    shortDescription?: string | null
    isB2BApp?: boolean
    appId?: string
}

const IframeTab: React.FC<RegistryIframeProps> = ({ appUrl, shortDescription, isB2BApp, appId }) => {
    if (!appUrl) return <EmptyContent />

    if (isB2BApp && appId) {
        return <B2BAppBillingTab appId={appId} appUrl={appUrl} shortDescription={shortDescription} />
    }

    return <IFrame src={appUrl} reloadScope='organization' withPrefetch withLoader withResize/>
}

export const CombinedViewSwitch: React.FC<{ activeTab: string }> = ({ activeTab }) => {
    const intl = useIntl()
    const PaymentsTypeListTitle = intl.formatMessage({ id: 'accrualsAndPayments.payments.type.list' })
    const PaymentsTypeRegistryTitle = intl.formatMessage({ id: 'accrualsAndPayments.payments.type.registry' })

    const router = useRouter()
    const { type } = parseQuery(router.query)
    const activeType = VIEW_TYPES.includes(type as PaymentTypes) ? type : PAYMENT_TYPES.registry

    const handleRadioChange = useCallback(async (event) => {
        await updateQuery(
            router,
            { newParameters: { type: event.target.value, tab: activeTab } },
            { resetOldParameters: true, routerAction: 'replace', shallow: true }
        )
    }, [activeTab, router])

    return (
        <Radio.Group optionType='button' value={activeType} onChange={handleRadioChange}>
            <Radio
                key={PAYMENT_TYPES.registry}
                value={PAYMENT_TYPES.registry}
                label={PaymentsTypeRegistryTitle}
            />
            <Radio
                key={PAYMENT_TYPES.list}
                value={PAYMENT_TYPES.list}
                label={PaymentsTypeListTitle}
            />
        </Radio.Group>
    )
}

export const CombinedMainContent: React.FC = () => {
    const intl = useIntl()
    const PaymentsTabTitle = intl.formatMessage({ id: 'Payments' })
    const AccrualsTabTitle = intl.formatMessage({ id: 'Accruals' })
    const userOrganization = useOrganization()
    const canReadBillingReceipts = get(userOrganization, ['link', 'role', 'canReadBillingReceipts'], false)
    const canReadPayments = get(userOrganization, ['link', 'role', 'canReadPayments'], false)

    const router = useRouter()
    const { tab, type } = parseQuery(router.query)
    const { billingContexts } = useBillingAndAcquiringContexts()
    const hasLastReport = billingContexts.some(({ lastReport }) => !!lastReport)

    const billingIntegrationsExtensionTabs: ExtensionTabType[] = useMemo(() => {
        return billingContexts
            .filter(({ integration }) => !!integration.appUrl && !!integration.extendsBillingPage)
            .map(context => ({
                id: context.id,
                label: get(context, ['integration', 'billingPageTitle']) || get(context, ['integration', 'name'], ''),
                integrationId: get(context, ['integration', 'id'], null),
                appUrl: get(context, ['integration', 'appUrl'], '') || '',
            }))
    }, [billingContexts])

    const { data } = useGetB2BAppsWithBillingTabEmbeddingConfigQuery()
    const b2bAppsExtensionTabs: ExtensionTabType[] = useMemo(() => {
        if (!data?.b2bApps) return []

        return data.b2bApps.filter(Boolean).map((b2bApp) => ({
            id: b2bApp.id,
            label: b2bApp.name || '',
            appUrl: b2bApp?.billingEmbeddingConfig?.tabUrl || '',
            shortDescription: b2bApp?.shortDescription,
            isB2BApp: true,
        }))
    }, [data?.b2bApps])

    const extensionAppTabs = useMemo(() => [
        ...billingIntegrationsExtensionTabs.filter(({ integrationId }) => integrationId !== registryUploadIntegrationId),
        ...b2bAppsExtensionTabs,
    ].filter(({ appUrl }) => !!appUrl), [b2bAppsExtensionTabs, billingIntegrationsExtensionTabs])
    const extensionTabKeys = useMemo(() => extensionAppTabs.map(({ id }) => `${EXTENSION_TAB_KEY}-${id}`), [extensionAppTabs])
    const availableTabs = useMemo(() => [
        canReadPayments && PAYMENTS_TAB_KEY,
        canReadBillingReceipts && ACCRUALS_TAB_KEY,
        ...extensionTabKeys,
    ].filter(Boolean), [canReadBillingReceipts, canReadPayments, extensionTabKeys])
    const activeTab = useMemo(() => availableTabs.includes(tab) ? tab : availableTabs[0], [availableTabs, tab])
    const activeType = VIEW_TYPES.includes(type as PaymentTypes) ? type : PAYMENT_TYPES.registry

    const registryUploadApp = useMemo(() => (
        billingIntegrationsExtensionTabs.find(({ integrationId }) => integrationId === registryUploadIntegrationId)
    ), [billingIntegrationsExtensionTabs])

    const isExtensionTabActive = extensionTabKeys.includes(activeTab)

    const handleTabChange = useCallback(async (activeTab) => {
        await updateQuery(
            router,
            { newParameters: { tab: activeTab, type: activeType } },
            { resetOldParameters: true, routerAction: 'replace', shallow: true }
        )
    }, [activeType, router])

    const items = useMemo<Array<TabItem>>(() => {
        const result: Array<TabItem> = [
            canReadPayments && {
                label: PaymentsTabTitle,
                key: PAYMENTS_TAB_KEY,
                children: <PaymentsTab type={activeType as PaymentTypes} />,
            },
            canReadBillingReceipts && {
                label: AccrualsTabTitle,
                key: ACCRUALS_TAB_KEY,
                children: activeType === PAYMENT_TYPES.registry
                    ? <IframeTab
                        appUrl={registryUploadApp?.appUrl}
                        appId={registryUploadApp?.id}
                        shortDescription={registryUploadApp?.shortDescription}
                        isB2BApp={registryUploadApp?.isB2BApp}
                    />
                    : (hasLastReport ? <AccrualsTab /> : <EmptyContent />),
            },
        ].filter(Boolean) as Array<TabItem>

        extensionAppTabs.forEach(({ appUrl, id, label, shortDescription, isB2BApp }) => {
            if (!appUrl) return

            result.push({
                label,
                key: `${EXTENSION_TAB_KEY}-${id}`,
                children: (
                    <IframeTab
                        appUrl={appUrl}
                        appId={id}
                        shortDescription={shortDescription}
                        isB2BApp={isB2BApp}
                    />
                ),
            })
        })

        return result
    }, [AccrualsTabTitle, PaymentsTabTitle, activeType, canReadBillingReceipts, canReadPayments, extensionAppTabs, hasLastReport, registryUploadApp])

    return (
        <Tabs
            id='combined-billing-tabs'
            activeKey={activeTab}
            onChange={handleTabChange}
            items={items}
            destroyInactiveTabPane
            tabBarExtraContent={!isExtensionTabActive && <CombinedViewSwitch activeTab={activeTab} />}
        />
    )
}
