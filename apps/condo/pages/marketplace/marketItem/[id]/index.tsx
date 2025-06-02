import { Col, Row, RowProps } from 'antd'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import uniq from 'lodash/uniq'
import uniqBy from 'lodash/uniqBy'
import getConfig from 'next/config'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useCallback, useMemo, useState } from 'react'

import { ChevronDown, ChevronUp } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar, Button, Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { DeleteButtonWithConfirmModal } from '@condo/domains/common/components/DeleteButtonWithConfirmModal'
import { FocusContainer } from '@condo/domains/common/components/FocusContainer'
import { ImagesUploadList } from '@condo/domains/common/components/ImagesUploadList'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { Loader } from '@condo/domains/common/components/Loader'
import { PageFieldRow } from '@condo/domains/common/components/PageFieldRow'
import { PageComponentType } from '@condo/domains/common/types'
import { getObjectCreatedMessage } from '@condo/domains/common/utils/date.utils'
import { getAddressDetails } from '@condo/domains/common/utils/helpers'
import { MarketItemReadPermissionRequired } from '@condo/domains/marketplace/components/PageAccess'
import { MarketItem, MarketItemFile, MarketPriceScope } from '@condo/domains/marketplace/utils/clientSchema'
import { getMoneyRender } from '@condo/domains/marketplace/utils/clientSchema/Invoice'
import { convertFilesToUploadType, PriceMeasuresType } from '@condo/domains/marketplace/utils/clientSchema/MarketItem'
import { Property } from '@condo/domains/property/utils/clientSchema'
import { UserNameField } from '@condo/domains/user/components/UserNameField'


const MARKET_ITEM_CONTENT_VERTICAL_GUTTER: RowProps['gutter'] = [0, 60]
const MEDIUM_VERTICAL_GUTTER: RowProps['gutter'] = [0, 40]
const SMALL_VERTICAL_GUTTER: RowProps['gutter'] = [0, 24]
const ELLIPSIS_CONFIG = { rows: 2 }

const { publicRuntimeConfig: { defaultCurrencyCode } } = getConfig()

const MarketItemHeader = ({ title, marketItem }) => {
    const intl = useIntl()
    const MarketItemAuthorMessage = intl.formatMessage({ id: 'Author' })

    const MarketItemCreationDate = useMemo(() => getObjectCreatedMessage(intl, marketItem), [intl, marketItem])

    const createdBy = useMemo(() => get(marketItem, ['createdBy']), [marketItem])

    return (
        <Row gutter={SMALL_VERTICAL_GUTTER} align='middle'>
            <Col span={24}>
                <Typography.Title level={1}>{title}</Typography.Title>
            </Col>
            <Col span={24}>
                <Typography.Text size='small'>
                    <Typography.Text type='secondary' size='small'>
                        {MarketItemCreationDate},&nbsp;{MarketItemAuthorMessage}&nbsp;
                    </Typography.Text>
                    <UserNameField user={createdBy}>
                        {({ name, postfix }) => (
                            <Typography.Text size='small'>
                                {name}
                                {postfix && (
                                    <Typography.Text type='secondary' size='small' ellipsis>&nbsp;{postfix}</Typography.Text>
                                )}
                            </Typography.Text>
                        )}
                    </UserNameField>
                </Typography.Text>
            </Col>
        </Row>
    )
}

const PAGE_FIELD_ROW_PROPS = { ellipsis: ELLIPSIS_CONFIG, labelSpan: 8 }

const MarketItemFields = ({ marketItem }) => {
    const intl = useIntl()
    const SkuFieldMessage = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.form.field.sku' })
    const CategoryFieldMessage = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.form.field.parentCategory' })
    const SubCategoryFieldMessage = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.form.field.marketCategory' })
    const DescriptionFieldMessage = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.form.field.description' })

    return (
        <Row gutter={SMALL_VERTICAL_GUTTER}>
            <PageFieldRow title={SkuFieldMessage} {...PAGE_FIELD_ROW_PROPS}>
                {get(marketItem, 'sku', '—')}
            </PageFieldRow>
            <PageFieldRow title={CategoryFieldMessage} {...PAGE_FIELD_ROW_PROPS}>
                {get(marketItem, 'marketCategory.parentCategory.name', '—')}
            </PageFieldRow>
            <PageFieldRow title={SubCategoryFieldMessage} {...PAGE_FIELD_ROW_PROPS}>
                {get(marketItem, 'marketCategory.name', '—')}
            </PageFieldRow>
            <PageFieldRow title={DescriptionFieldMessage} {...PAGE_FIELD_ROW_PROPS}>
                {get(marketItem, 'description', '—')}
            </PageFieldRow>
        </Row>
    )
}

type AddressesPriceType = {
    price: string
    addresses: string[]
    shortMeasureMessage?: string
}

type PriceScopePropsType = {
    addressesPrice: AddressesPriceType
    closable: boolean
}

const PRICE_COL_STYLE = { display: 'flex', alignItems: 'center' }
const CHEVRON_COL_STYLE = { display: 'flex', alignItems: 'center' }
const ADDRESS_ROW_STYLE = { margin: 0, width: '100%' }
const LINE_COL_STYLE = { borderBottom: `1px solid ${colors.gray[5]}`, flexGrow: 1 }

const PriceScope: React.FC<PriceScopePropsType> = ({ addressesPrice, closable }) => {
    const [opened, setOpened] = useState(!closable)

    const handlePriceBlockClick = useCallback(() => {
        if (closable) {
            setOpened(prev => !prev)
        }
    }, [closable])

    const priceBlockStyle = useMemo(() => ({
        backgroundColor: colors.gray[1], padding: '8px 16px', borderRadius: '8px', cursor: closable ? 'pointer' : 'inherit',
    }), [closable])

    return (
        <Row gutter={[0, 12]}>
            <Col span={24}>
                <Row justify='space-between' onClick={handlePriceBlockClick} style={priceBlockStyle}>
                    <Col style={PRICE_COL_STYLE}>
                        <Typography.Text size='medium'>{addressesPrice.price}{(addressesPrice.shortMeasureMessage && `/${addressesPrice.shortMeasureMessage}`)}</Typography.Text>
                    </Col>
                    {
                        closable && (
                            <Col style={CHEVRON_COL_STYLE}>
                                {
                                    opened ? <ChevronUp /> :
                                        <ChevronDown />
                                }
                            </Col>
                        )
                    }
                </Row>
            </Col>
            {
                opened && addressesPrice.addresses?.map((address, index) => (
                    <Row key={index} gutter={[8, 0]} style={ADDRESS_ROW_STYLE}>
                        <Col style={LINE_COL_STYLE} />
                        <Col>
                            <Typography.Text type='secondary'>{address}</Typography.Text>
                        </Col>
                    </Row>
                ))
            }
        </Row>
    )
}

const PricesBlock = ({ marketItemId }) => {
    const intl = useIntl()
    const AllPropertiesMessage = intl.formatMessage({ id: 'pages.condo.settings.propertyScope.allProperties' })
    const AddressesAndPricesMessage = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.id.addressesAndPrices' })
    const ServiceNotAvailableMessage = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.id.noPriceForAddresses' })

    const { organization } = useOrganization()
    const organizationId = useMemo(() => get(organization, 'id'), [organization])

    const { count: propertiesCount } = Property.useCount({
        where: {
            organization: { id: organizationId },
        },
    }, { skip: !organizationId })

    const { objs: properties } = Property.useObjects(
        {
            where: {
                organization: { id: organizationId },
            },
        }, { skip: propertiesCount !== 1 }
    )

    const { objs: priceScopes, loading: priceScopesLoading } = MarketPriceScope.useAllObjects({
        where: {
            marketItemPrice: { marketItem: { id: marketItemId } },
        },
    }, { skip: !marketItemId })
    const uniquePrices = useMemo(() =>
        uniqBy(priceScopes.map(priceScope => get(priceScope, 'marketItemPrice')), 'id'),
    [priceScopes])
    const propertyIdsInScopes = useMemo(() =>
        uniq(priceScopes.map(priceScope => get(priceScope, 'property.id')).filter(Boolean)),
    [priceScopes])

    const { objs: propertiesWithoutPrices, loading: propertiesLoading } = Property.useAllObjects({
        where: {
            organization: { id: organizationId },
            id_not_in: propertyIdsInScopes,
        },
    }, { skip: !organizationId || propertyIdsInScopes.length < 2 })

    const addressesPrices: AddressesPriceType[] = useMemo(() => {
        const resultAddressesPrices: AddressesPriceType[] = uniquePrices.map(priceObj => {
            const firstPrice =  get(priceObj, 'price.0')
            const price = getMoneyRender(intl, get(firstPrice, 'currency', defaultCurrencyCode))(get(firstPrice, 'price'), get(firstPrice, 'isMin'))
            const measure: PriceMeasuresType = get(firstPrice, 'measure')

            let shortMeasureMessage = null
            if (measure) {
                shortMeasureMessage = intl.formatMessage({ id: `pages.condo.marketplace.measure.${measure}.short` })
            }

            const scopesWithSamePrice = priceScopes
                .filter(scope => get(scope, 'marketItemPrice.id') === get(priceObj, 'id'))
            const addresses = scopesWithSamePrice.map(scope => {
                const property = get(scope, 'property')
                if (!property) {
                    if (properties.length === 1) {
                        const { streetPart } = getAddressDetails(get(properties, '0'))
                        return streetPart
                    } else {
                        return AllPropertiesMessage
                    }
                }

                const { streetPart } = getAddressDetails(property)
                return streetPart
            })

            return { price, shortMeasureMessage, addresses }
        })

        const addressesWithoutPrices = propertiesWithoutPrices.map(property => {
            const { streetPart } = getAddressDetails(property)
            return streetPart
        })
        if (!isEmpty(addressesWithoutPrices)) {
            resultAddressesPrices.push({ price: ServiceNotAvailableMessage, addresses: addressesWithoutPrices })
        }

        return resultAddressesPrices
    }, [AllPropertiesMessage, ServiceNotAvailableMessage, intl, priceScopes, propertiesWithoutPrices, uniquePrices])

    if (priceScopesLoading || propertiesLoading) {
        return <Loader />
    }

    if (priceScopes.length == 0) {
        return null
    }

    return (
        <FocusContainer padding='40px'>
            <Row gutter={SMALL_VERTICAL_GUTTER}>
                <Col span={24}>
                    <Typography.Title level={3}>{AddressesAndPricesMessage}</Typography.Title>
                </Col>
                {
                    addressesPrices.map(
                        (addressesPrice, index) => (
                            <Col span={24} key={index}>
                                <PriceScope
                                    addressesPrice={addressesPrice}
                                    closable={addressesPrices.length > 1}
                                />
                            </Col>
                        )
                    )
                }
            </Row>
        </FocusContainer>
    )
}

const MarketItemIdPage: PageComponentType = () => {
    const intl = useIntl()
    const ServerErrorMessage = intl.formatMessage({ id: 'ServerError' })
    const EditMessage = intl.formatMessage({ id: 'Edit' })
    const DeleteMessage = intl.formatMessage({ id: 'Delete' })
    const NotFoundErrorTitle = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.notFoundError.title' })
    const NotFoundDescription = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.notFoundError.description' })
    const ConfirmDeleteTitle = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.id.deleteAlert.title' })
    const ConfirmDeleteMessage = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.id.deleteAlert.message' })

    const { isLoading: employeeLoading, organization, link } = useOrganization()
    const canManageMarketItems = get(link, 'role.canManageMarketItems', false)

    const router = useRouter()
    const { query: { id } } = router as { query: { [key: string]: string } }

    const { loading: marketItemLoading, obj: marketItem, error } = MarketItem.useObject({
        where: {
            id,
            organization: { id: get(organization, 'id', null) },
        },
    }, { skip: !organization })

    const marketItemId = useMemo(() => get(marketItem, 'id'), [marketItem])

    const { objs: marketItemFiles, loading: filesLoading } = MarketItemFile.useObjects({
        where: {
            marketItem: { id: marketItemId },
        },
    }, { skip: !marketItemId })

    const Title = useMemo(() => get(marketItem, 'name'), [marketItem])

    const loading = marketItemLoading || employeeLoading || filesLoading

    const handleClickEdit = useCallback(async () => {
        await router.push(`/marketplace/marketItem/${marketItemId}/update`)
    }, [marketItemId, router])

    const softDeleteMarketItem = MarketItem.useSoftDelete(() => router.replace('/marketplace?tab=services'))
    const handleClickDelete = useCallback(async () => {
        await softDeleteMarketItem(marketItem)
    }, [marketItem, softDeleteMarketItem])

    const { breakpoints } = useLayoutContext()
    const isSmallScreen = useMemo(() => !breakpoints.DESKTOP_SMALL, [breakpoints.DESKTOP_SMALL])
    const contentAndPriceInfoRowGutter: RowProps['gutter'] = useMemo(
        () => isSmallScreen ? [0, 40] : [100, 0],
        [isSmallScreen])

    if (!marketItem) {
        if (!error && !loading) {
            return (
                <LoadingOrErrorPage
                    title={NotFoundErrorTitle}
                    error={NotFoundDescription}
                />
            )
        }

        return (
            <LoadingOrErrorPage
                loading={loading}
                error={error && ServerErrorMessage}
            />
        )
    }

    return (
        <>
            <Head>
                <title>{Title}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <Row gutter={MARKET_ITEM_CONTENT_VERTICAL_GUTTER}>
                        <Col span={24}>
                            <MarketItemHeader
                                title={Title}
                                marketItem={marketItem}
                            />
                        </Col>
                        <Col span={24}>
                            <Row justify='space-between' gutter={contentAndPriceInfoRowGutter}>
                                <Col xs={24} lg={11}>
                                    <Row gutter={MEDIUM_VERTICAL_GUTTER}>
                                        <Col span={24}>
                                            <MarketItemFields
                                                marketItem={marketItem}
                                            />
                                        </Col>
                                        <Col span={24}>
                                            <ImagesUploadList
                                                type='view'
                                                fileList={convertFilesToUploadType(marketItemFiles)}
                                            />
                                        </Col>
                                    </Row>
                                </Col>
                                <Col xs={24} lg={11}>
                                    <PricesBlock
                                        marketItemId={marketItemId}
                                    />
                                </Col>
                            </Row>
                        </Col>
                        {
                            canManageMarketItems && (
                                <Col span={24}>
                                    <ActionBar
                                        actions={[
                                            <Button
                                                key='edit'
                                                onClick={handleClickEdit}
                                                type='primary'
                                            >
                                                {EditMessage}
                                            </Button>,
                                            <DeleteButtonWithConfirmModal
                                                key='delete'
                                                title={ConfirmDeleteTitle}
                                                message={ConfirmDeleteMessage}
                                                okButtonLabel={DeleteMessage}
                                                action={handleClickDelete}
                                                buttonContent={DeleteMessage}
                                            />,
                                        ]}
                                    />
                                </Col>
                            )
                        }
                    </Row>
                </PageContent>
            </PageWrapper>
        </>
    )
}

MarketItemIdPage.requiredAccess = MarketItemReadPermissionRequired

export default MarketItemIdPage
