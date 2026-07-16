import { useGetB2BAppsWithBillingTabEmbeddingConfigQuery } from '@app/condo/gql'
import { Image } from 'antd'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo, useState, CSSProperties } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { RadioGroup, Tabs, Radio } from '@open-condo/ui'
import type { TabItem } from '@open-condo/ui'

import { VIEW_TYPES, ViewTypes } from '@condo/domains/acquiring/utils/clientSchema'
import { AccrualsTab } from '@condo/domains/billing/components/BillingPageContent/AccrualsTab'
import { B2BAppBillingTab } from '@condo/domains/billing/components/BillingPageContent/B2BAppBillingTab'
import { BillingTabTourStep } from '@condo/domains/billing/components/BillingPageContent/BillingTabTourStep'
import { useBillingAndAcquiringContexts } from '@condo/domains/billing/components/BillingPageContent/ContextProvider'
import { EmptyContent } from '@condo/domains/billing/components/BillingPageContent/EmptyContent'
import { PaymentsTab } from '@condo/domains/billing/components/BillingPageContent/PaymentsTab'
import { ACCRUALS_TAB_KEY, PAYMENTS_TAB_KEY, EXTENSION_TAB_KEY } from '@condo/domains/billing/constants/constants'
import { useQueryParams } from '@condo/domains/billing/hooks/useQueryParams'
import { useTourStepsConfig } from '@condo/domains/common/hooks/useTourStepsConfig'
import { updateQuery } from '@condo/domains/common/utils/helpers'
import { B2BAppFrame } from '@condo/domains/miniapp/components/B2BAppFrame'


type PaymentTypeSwitchProps = {
    defaultValue: ViewTypes
    activeTab: string
}

const IMAGE_STYLES: CSSProperties = { objectFit: 'contain', height: 20, width: 20 }
const FALLBACK_IMAGE_URL = '/logoHouse.svg'
const IMAGE_WRAPPER_STYLES: CSSProperties = { height: 28 }

export const PaymentTypeSwitch = ({ defaultValue, activeTab }: PaymentTypeSwitchProps): JSX.Element => {
    const intl = useIntl()
    const PaymentsTypeListTitle = intl.formatMessage({ id: 'accrualsAndPayments.payments.type.list' })
    const PaymentsTypeRegistryTitle = intl.formatMessage({ id: 'accrualsAndPayments.payments.type.registry' })

    const router = useRouter()
    const type = get(router.query, 'type', VIEW_TYPES.list) as string

    const isListSelected = type === VIEW_TYPES.list
    const isRegistrySelected = type === VIEW_TYPES.registry

    const [value, setValue] = useState<ViewTypes>(VIEW_TYPES.list)
    useEffect(() => {
        if (isListSelected) {
            setValue(VIEW_TYPES.list)
        } else if (isRegistrySelected) {
            setValue(VIEW_TYPES.registry)
        }
    }, [isListSelected, isRegistrySelected, setValue])


    const handleRadioChange = useCallback(async (event) => {
        const value = event.target.value
        setValue(value)
        await updateQuery(
            router,
            { newParameters: { type: value, tab: activeTab } },
            { resetOldParameters: true, routerAction: 'replace', shallow: true }
        )
    }, [activeTab, router])

    return (
        <RadioGroup optionType='button' value={value} onChange={handleRadioChange} defaultValue={defaultValue}>
            <Radio
                key={VIEW_TYPES.list}
                value={VIEW_TYPES.list}
                label={PaymentsTypeListTitle}
            />
            <Radio
                key={VIEW_TYPES.registry}
                value={VIEW_TYPES.registry}
                label={PaymentsTypeRegistryTitle}
            />
        </RadioGroup>
    )
}

type MainContentProps = {
    uploadComponent?: React.ReactElement
}

type ExtensionTabType = {
    id: string
    appUrl: string
    label: string
    iconUrl?: string
    shortDescription?: string | null
    isB2BApp?: boolean
}

export const MainContent: React.FC<MainContentProps> = ({
    uploadComponent,
}) => {
    const intl = useIntl()
    const AccrualsTabTitle = intl.formatMessage({ id: 'Accruals' })
    const PaymentsTabTitle = intl.formatMessage({ id: 'Payments' })

    const userOrganization = useOrganization()
    const canReadBillingReceipts = get(userOrganization, ['link', 'role', 'canReadBillingReceipts'], false)
    const canReadPayments = get(userOrganization, ['link', 'role', 'canReadPayments'], false)

    const { billingContexts } = useBillingAndAcquiringContexts()
    const billingIntegrationsExtensionTabs: ExtensionTabType[] = useMemo(() => {
        return billingContexts
            .filter(({ integration }) => !!integration.appUrl && !!integration.extendsBillingPage)
            .map(context => {
                return {
                    id: context.id,
                    label: get(context, ['integration', 'billingPageTitle']) || get(context, ['integration', 'name'], ''),
                    appUrl: get(context, ['integration', 'appUrl'], '') || '',
                    iconUrl: get(context, ['integration', 'billingPageIcon', 'publicUrl'], null),
                }
            })
    }, [billingContexts])

    const { data } = useGetB2BAppsWithBillingTabEmbeddingConfigQuery()
    const b2bAppsExtensionTabs: ExtensionTabType[] = useMemo(() => {
        if (!data?.b2bApps) return []

        return data?.b2bApps?.map((b2bApp) => {
            return {
                id: b2bApp.id,
                label: b2bApp.name,
                appUrl: b2bApp?.billingEmbeddingConfig?.tabUrl,
                shortDescription: b2bApp?.shortDescription,
                isB2BApp: true,
            }
        })
    }, [data?.b2bApps])

    const extensionAppTabs: ExtensionTabType[] = useMemo(() => [
        ...billingIntegrationsExtensionTabs,
        ...b2bAppsExtensionTabs,
    ], [b2bAppsExtensionTabs, billingIntegrationsExtensionTabs])
    const extensionTabKeys = useMemo(() => extensionAppTabs.map(({ id }) => `${EXTENSION_TAB_KEY}-${id}`), [extensionAppTabs])
    const hasLastReport = billingContexts.find(({ lastReport }) => !!lastReport)

    const tourStepsConfig = useTourStepsConfig()

    const [currentTab, currentType, onTabChange] = useQueryParams(extensionTabKeys)
    const renderTabIcon = useCallback((iconUrl: string | null) => {
        if (!iconUrl) return null

        return (
            <Image
                src={iconUrl || FALLBACK_IMAGE_URL}
                fallback={FALLBACK_IMAGE_URL}
                preview={false}
                style={IMAGE_STYLES}
                draggable={false}
                wrapperStyle={IMAGE_WRAPPER_STYLES}
            />
        )
    }, [])

    const items = useMemo(() => {
        const result: Array<TabItem> = [
            canReadBillingReceipts && {
                label: AccrualsTabTitle,
                key: ACCRUALS_TAB_KEY,
                children: hasLastReport ? <AccrualsTab uploadComponent={uploadComponent} /> : <EmptyContent uploadComponent={uploadComponent} />,
            },
            canReadPayments && {
                label: PaymentsTabTitle,
                key: PAYMENTS_TAB_KEY,
                children: <PaymentsTab type={currentType} />,
            },
        ]

        extensionAppTabs.forEach((extensionAppTab) => {
            const { appUrl, id, label, iconUrl, shortDescription, isB2BApp } = extensionAppTab
            if (!appUrl) return

            result.push({
                label,
                key: `${EXTENSION_TAB_KEY}-${id}`,
                children: isB2BApp ? (
                    <B2BAppBillingTab appId={id} appUrl={appUrl} shortDescription={shortDescription} />
                ) : (
                    <B2BAppFrame src={appUrl}/>
                ),
                icon: renderTabIcon(iconUrl),
            })
        })

        return result
    }, [canReadBillingReceipts, AccrualsTabTitle, hasLastReport, uploadComponent, canReadPayments, PaymentsTabTitle, currentType, extensionAppTabs, renderTabIcon])

    return (
        <>
            <Tabs
                id='billing-tabs'
                activeKey={currentTab}
                onChange={onTabChange}
                items={items}
                destroyInactiveTabPane
                tabBarExtraContent={currentTab === PAYMENTS_TAB_KEY && <PaymentTypeSwitch defaultValue={VIEW_TYPES.list} activeTab={currentTab} />}
            />
            {extensionAppTabs.map(({ id }) => {
                const tourStep = tourStepsConfig[id]
                if (!tourStep) return null
                return <BillingTabTourStep key={id} id={id} tabsId='billing-tabs' title={tourStep.title} message={tourStep.message} />
            })}
        </>
    )
}
