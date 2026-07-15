import { useGetB2BAppsWithBillingTabEmbeddingConfigQuery } from '@app/condo/gql'
import get from 'lodash/get'
import getConfig from 'next/config'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Radio, Tabs } from '@open-condo/ui'
import type { TabItem } from '@open-condo/ui'

import { VIEW_TYPES, ViewTypes } from '@condo/domains/acquiring/utils/clientSchema'
import { AccrualsTab } from '@condo/domains/billing/components/BillingPageContent/AccrualsTab'
import { B2BAppBillingTab } from '@condo/domains/billing/components/BillingPageContent/B2BAppBillingTab'
import { useBillingAndAcquiringContexts } from '@condo/domains/billing/components/BillingPageContent/ContextProvider'
import { EmptyContent } from '@condo/domains/billing/components/BillingPageContent/EmptyContent'
import { PaymentsTab } from '@condo/domains/billing/components/BillingPageContent/PaymentsTab'
import { ACCRUALS_TAB_KEY, CONTEXT_FINISHED_STATUS, EXTENSION_TAB_KEY, PAYMENTS_TAB_KEY } from '@condo/domains/billing/constants/constants'
import { DEFAULT_COMBINED_VIEW_TYPES, useCombinedViewAvailability } from '@condo/domains/billing/hooks/useCombinedViewAvailability'
import { updateQuery } from '@condo/domains/common/utils/helpers'
import { parseQuery } from '@condo/domains/common/utils/tables.utils'
import { B2BAppFrame } from '@condo/domains/miniapp/components/B2BAppFrame'

import type { BillingIntegrationOrganizationContext } from '@app/condo/schema'


const { publicRuntimeConfig: { registryUploadIntegrationId, sppConfig } } = getConfig()
// TODO(@abshnko): DOMA-13420 remove one integration when we merge them into one
const accrualsRegistryIntegrationIds = [registryUploadIntegrationId, sppConfig?.BillingIntegrationId]
    .filter(Boolean)

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

function buildBillingAppFromContext (context: BillingIntegrationOrganizationContext): ExtensionTabType {
    return {
        id: context.id,
        label: get(context, ['integration', 'billingPageTitle']) || get(context, ['integration', 'name'], ''),
        integrationId: get(context, ['integration', 'id'], null),
        appUrl: get(context, ['integration', 'appUrl'], '') || '',
    }
}

const IframeTab: React.FC<RegistryIframeProps> = ({ appUrl, shortDescription, isB2BApp, appId }) => {
    if (!appUrl) return <EmptyContent />

    if (isB2BApp && appId) {
        return <B2BAppBillingTab appId={appId} appUrl={appUrl} shortDescription={shortDescription} />
    }

    return <B2BAppFrame src={appUrl} actions={true} />
}

export const CombinedViewSwitch: React.FC<{ activeTab: string, availableTypes: ViewTypes[] }> = ({ activeTab, availableTypes }) => {
    const intl = useIntl()
    const PaymentsTypeListTitle = intl.formatMessage({ id: 'accrualsAndPayments.payments.type.list' })
    const PaymentsTypeRegistryTitle = intl.formatMessage({ id: 'accrualsAndPayments.payments.type.registry' })

    const router = useRouter()
    const { type } = parseQuery(router.query)
    const activeType = availableTypes.includes(type as ViewTypes) ? type : availableTypes[0]

    const handleRadioChange = useCallback(async (event) => {
        await updateQuery(
            router,
            { newParameters: { type: event.target.value, tab: activeTab } },
            { resetOldParameters: true, routerAction: 'replace', shallow: true }
        )
    }, [activeTab, router])

    return (
        <Radio.Group optionType='button' value={activeType} onChange={handleRadioChange}>
            {availableTypes.includes(VIEW_TYPES.registry) && (
                <Radio
                    key={VIEW_TYPES.registry}
                    value={VIEW_TYPES.registry}
                    label={PaymentsTypeRegistryTitle}
                />
            )}
            {availableTypes.includes(VIEW_TYPES.list) && (
                <Radio
                    key={VIEW_TYPES.list}
                    value={VIEW_TYPES.list}
                    label={PaymentsTypeListTitle}
                />
            )}
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
    const { billingContexts, acquiringContexts } = useBillingAndAcquiringContexts()
    const hasLastReport = billingContexts.some(({ lastReport }) => !!lastReport)
    const activeBillingContexts = useMemo(() => {
        return billingContexts.filter(({ status }) => status === CONTEXT_FINISHED_STATUS)
    }, [billingContexts])

    const billingIntegrationsExtensionTabs: ExtensionTabType[] = useMemo(() => {
        return activeBillingContexts
            .filter(({ integration }) => !!integration?.appUrl && !!integration?.extendsBillingPage)
            .map(buildBillingAppFromContext)
    }, [activeBillingContexts])

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
        ...billingIntegrationsExtensionTabs.filter(({ integrationId }) => !accrualsRegistryIntegrationIds.includes(integrationId)),
        ...b2bAppsExtensionTabs,
    ].filter(({ appUrl }) => !!appUrl), [b2bAppsExtensionTabs, billingIntegrationsExtensionTabs])
    const extensionTabKeys = useMemo(() => extensionAppTabs.map(({ id }) => `${EXTENSION_TAB_KEY}-${id}`), [extensionAppTabs])

    const availableTabs = useMemo(() => [
        canReadPayments && PAYMENTS_TAB_KEY,
        canReadBillingReceipts && ACCRUALS_TAB_KEY,
        ...extensionTabKeys,
    ].filter(Boolean), [canReadBillingReceipts, canReadPayments, extensionTabKeys])
    const activeTab = useMemo(() => availableTabs.includes(tab) ? tab : availableTabs[0], [availableTabs, tab])

    const {
        availableTypesByTab,
        availableTypesForActiveTab,
        activeType,
    } = useCombinedViewAvailability({
        activeTab,
        type,
        billingContexts,
        acquiringContexts,
    })

    const registryUploadContext = useMemo(() => (
        activeBillingContexts
            .find(({ integration }) => Boolean(integration?.appUrl && accrualsRegistryIntegrationIds.includes(integration.id)))
    ), [activeBillingContexts])

    const registryUploadApp = useMemo(() => {
        if (!registryUploadContext) return null

        return buildBillingAppFromContext(registryUploadContext)
    }, [registryUploadContext])
    const isExtensionTabActive = extensionTabKeys.includes(activeTab)

    useEffect(() => {
        if (isExtensionTabActive) return
        if (!type || type !== activeType) {
            updateQuery(
                router,
                { newParameters: { tab: activeTab, type: activeType } },
                { resetOldParameters: true, routerAction: 'replace', shallow: true }
            )
        }
    }, [activeTab, activeType, isExtensionTabActive, router, type])

    const handleTabChange = useCallback(async (activeTab) => {
        const nextAvailableTypes = availableTypesByTab[activeTab] || DEFAULT_COMBINED_VIEW_TYPES
        const nextType = nextAvailableTypes.includes(type as ViewTypes) ? type : nextAvailableTypes[0]

        await updateQuery(
            router,
            { newParameters: { tab: activeTab, type: nextType } },
            { resetOldParameters: true, routerAction: 'replace', shallow: true }
        )
    }, [availableTypesByTab, router, type])

    const accrualsTabContent = useMemo(() => {
        if (activeType === VIEW_TYPES.registry) {
            return (
                <IframeTab
                    appUrl={registryUploadApp?.appUrl}
                    appId={registryUploadApp?.id}
                    shortDescription={registryUploadApp?.shortDescription}
                    isB2BApp={registryUploadApp?.isB2BApp}
                />
            )
        }

        return hasLastReport ? <AccrualsTab /> : <EmptyContent />
    }, [activeType, hasLastReport, registryUploadApp])

    const items = useMemo<Array<TabItem>>(() => {
        const result: Array<TabItem> = [
            canReadPayments && {
                label: PaymentsTabTitle,
                key: PAYMENTS_TAB_KEY,
                children: <PaymentsTab type={activeType as ViewTypes} />,
            },
            canReadBillingReceipts && {
                label: AccrualsTabTitle,
                key: ACCRUALS_TAB_KEY,
                children: accrualsTabContent,
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
    }, [AccrualsTabTitle, PaymentsTabTitle, accrualsTabContent, activeType, canReadBillingReceipts, canReadPayments, extensionAppTabs])

    return (
        <Tabs
            id='combined-billing-tabs'
            activeKey={activeTab}
            onChange={handleTabChange}
            items={items}
            destroyInactiveTabPane
            tabBarExtraContent={!isExtensionTabActive && availableTypesForActiveTab.length > 1 && (
                <CombinedViewSwitch activeTab={activeTab} availableTypes={availableTypesForActiveTab} />
            )}
        />
    )
}
