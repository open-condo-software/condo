import { Image } from 'antd'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo, useState, CSSProperties } from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { RadioGroup, Tabs, Radio } from '@open-condo/ui'
import type { TabItem } from '@open-condo/ui'

import { PAYMENT_TYPES, PaymentTypes } from '@condo/domains/acquiring/utils/clientSchema'
import { AccrualsTab } from '@condo/domains/billing/components/BillingPageContent/AccrualsTab'
import { useBillingAndAcquiringContexts } from '@condo/domains/billing/components/BillingPageContent/ContextProvider'
import { EmptyContent } from '@condo/domains/billing/components/BillingPageContent/EmptyContent'
import { PaymentsTab } from '@condo/domains/billing/components/BillingPageContent/PaymentsTab'
import { ACCRUALS_TAB_KEY, PAYMENTS_TAB_KEY, EXTENSION_TAB_KEY } from '@condo/domains/billing/constants/constants'
import { useQueryParams } from '@condo/domains/billing/hooks/useQueryParams'
import { ACQUIRING_PAYMENTS_FILES_TABLE } from '@condo/domains/common/constants/featureflags'
import { updateQuery } from '@condo/domains/common/utils/helpers'
import { IFrame } from '@condo/domains/miniapp/components/IFrame'


type PaymentTypeSwitchProps = {
    defaultValue: PaymentTypes
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
    const type = get(router.query, 'type', PAYMENT_TYPES.list) as string

    const isListSelected = type === PAYMENT_TYPES.list
    const isRegistrySelected = type === PAYMENT_TYPES.registry

    const [value, setValue] = useState<PaymentTypes>(PAYMENT_TYPES.list)
    useEffect(() => {
        if (isListSelected) {
            setValue(PAYMENT_TYPES.list)
        } else if (isRegistrySelected) {
            setValue(PAYMENT_TYPES.registry)
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
                key={PAYMENT_TYPES.list}
                value={PAYMENT_TYPES.list}
                label={PaymentsTypeListTitle}
            />
            <Radio
                key={PAYMENT_TYPES.registry}
                value={PAYMENT_TYPES.registry}
                label={PaymentsTypeRegistryTitle}
            />
        </RadioGroup>
    )
}

type MainContentProps = {
    uploadComponent?: React.ReactElement
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
    const extensionAppTab = billingContexts.find(({ integration }) => !!integration.appUrl && !!integration.extendsBillingPage)
    const hasLastReport = billingContexts.find(({ lastReport }) => !!lastReport)


    const { useFlag } = useFeatureFlags()
    const isPaymentsFilesTableEnabled = useFlag(ACQUIRING_PAYMENTS_FILES_TABLE)

    const [currentTab, currentType, onTabChange] = useQueryParams(!!extensionAppTab)
    const customIconUrl = get(extensionAppTab, ['integration', 'billingPageIcon', 'publicUrl'], null)

    const CustomIconImage = useMemo(() => {
        return (
            <Image
                src={customIconUrl || FALLBACK_IMAGE_URL}
                fallback={FALLBACK_IMAGE_URL}
                preview={false}
                style={IMAGE_STYLES}
                draggable={false}
                wrapperStyle={IMAGE_WRAPPER_STYLES}
            />
        )
    }, [customIconUrl])

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
            }]

        if (extensionAppTab) {
            const appUrl = get(extensionAppTab, ['integration', 'appUrl'], '') || ''
            if (appUrl) {
                result.push({
                    label: get(extensionAppTab, ['integration', 'billingPageTitle']) || get(extensionAppTab, ['integration', 'name'], ''),
                    key: EXTENSION_TAB_KEY,
                    children: <IFrame src={appUrl} reloadScope='organization' withPrefetch withLoader withResize />,
                    icon: customIconUrl ? CustomIconImage : null,
                })
            }
        }

        return result
    }, [canReadBillingReceipts, AccrualsTabTitle, hasLastReport, uploadComponent, canReadPayments, PaymentsTabTitle, currentType, extensionAppTab, customIconUrl, CustomIconImage])

    return (
        <Tabs
            activeKey={currentTab}
            onChange={onTabChange}
            items={items}
            destroyInactiveTabPane
            tabBarExtraContent={isPaymentsFilesTableEnabled && currentTab === PAYMENTS_TAB_KEY && <PaymentTypeSwitch defaultValue={PAYMENT_TYPES.list} activeTab={currentTab} />}
        />
    )
}