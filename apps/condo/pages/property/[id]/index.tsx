/** @jsx jsx */
import React, { useState, useMemo } from 'react'
import { useIntl } from '@open-condo/next/intl'
import { Row, Col, Space, RowProps, Image, notification } from 'antd'
import { useRouter } from 'next/router'
import dayjs from 'dayjs'
import get from 'lodash/get'
import isNull from 'lodash/isNull'
import { jsx } from '@emotion/react'
import styled from '@emotion/styled'
import Head from 'next/head'
import Link from 'next/link'
import cookie from 'js-cookie'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { useContainerSize } from '@condo/domains/common/hooks/useContainerSize'
import { Property } from '@condo/domains/property/utils/clientSchema'
import { DeleteFilled } from '@ant-design/icons'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { PROPERTY_BANK_ACCOUNT } from '@condo/domains/common/constants/featureflags'
import { CREATE_BANK_ACCOUNT_REQUEST_MUTATION } from '@condo/domains/banking/gql'
import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { Button } from '@condo/domains/common/components/Button'
import { FocusContainer } from '@condo/domains/common/components/FocusContainer'
import { PropertyPanels } from '@condo/domains/property/components/panels'
import { CustomScrollbarCss } from '@condo/domains/property/components/panels/Builder/BuildingPanelCommon'
import ActionBar from '@condo/domains/common/components/ActionBar'
import {
    DeleteButtonWithConfirmModal,
    IDeleteActionButtonWithConfirmModal,
} from '@condo/domains/common/components/DeleteButtonWithConfirmModal'
import { useOrganization } from '@open-condo/next/organization'
import { useAuth } from '@open-condo/next/auth'
import { useMutation } from '@open-condo/next/apollo'
import { List, Card, Modal, Typography } from '@open-condo/ui'
import type { ListProps } from '@open-condo/ui'
import { getClientSideSenderInfo } from '@open-condo/codegen/utils/userId'

interface IPropertyInfoPanelProps {
    title: string
    message: string
    type?:  'success' | 'warning'
    large?: boolean
}

const PROPERTY_INFO_PANEL_STYLE: React.CSSProperties = {
    margin: 'initial',
    padding: '16px 20px 20px 20px',
    width: '220px',
    height: '96px',
}

const PropertyInfoPanel: React.FC<IPropertyInfoPanelProps> = ({ title, message, type, large = false }) => (
    <FocusContainer style={PROPERTY_INFO_PANEL_STYLE}>
        <Space direction='vertical' size={8}>
            <Typography.Text
                {...{ type }}

                size={large ? 'large' : 'medium'}
            >
                {message}
            </Typography.Text>
            <Typography.Text size='medium' type='secondary'>{title}</Typography.Text>
        </Space>
    </FocusContainer>
)

const PROPERTY_CARD_WIDTH_THRESHOLD = 400

const PropertyReportCardBottomWrapper = styled.div<{ width: number }>`
  display: flex;
  justify-content: space-between;
  ${({ width }) => width >= PROPERTY_CARD_WIDTH_THRESHOLD ? 'align-items: end;' : 'align-items: start;'}
  ${({ width }) => width >= PROPERTY_CARD_WIDTH_THRESHOLD ? 'flex-direction: row;' : 'flex-direction: column-reverse;'}
  
  margin-top: 36px;
  
  & > div {
    ${({ width }) => width >= PROPERTY_CARD_WIDTH_THRESHOLD ? 'max-width: 50%;' : 'max-width: unset;'}
  }
  
  & > div:first-child {
    ${({ width }) => width >= PROPERTY_CARD_WIDTH_THRESHOLD ? 'margin-top: initial' : 'margin-top: 24px;'}
  }
`

const PropertyCardContent = styled.div`
  padding: 16px;
  
  & img {
    max-width: 156px;
    max-height: 204px;
  }
`

const ImageWrapper = styled.div`
  display: flex;
  justify-content: end;
  align-content: center;
`

const PROPERTY_PAGE_CONTENT_ROW_GUTTER: RowProps['gutter'] = [12, 40]
const PROPERTY_PAGE_CONTENT_ROW_CARDS_GUTTER: RowProps['gutter'] = [24, 40]
const PROPERTY_PAGE_CONTENT_ROW_INFO_BLOCK_GUTTER: RowProps['gutter'] = [52, 24]
const PROPERTY_PAGE_CONTENT_ROW_INFO_BLOCK_STYLE: React.CSSProperties = { marginTop: '80px' }
const PROPERTY_PAGE_CONTENT_ROW_STYLE: React.CSSProperties = { marginTop: '40px' }
const PROPERTY_PAGE_ACTION_BAR_SPACE_STYLE: React.CSSProperties = { marginBottom: 0 }
const PROPERTY_PAGE_SPACE_STYLE: React.CSSProperties = { width: '100%' }
const DELETE_BUTTON_CUSTOM_PROPS: IDeleteActionButtonWithConfirmModal['buttonCustomProps'] = {
    type: 'sberDangerGhost',
    icon: <DeleteFilled />,
}

export const PropertyPageContent = ({ property, link }) => {
    const intl = useIntl()
    const UnitsCountTitle = intl.formatMessage({ id: 'pages.condo.property.id.UnitsCount' })
    const UninhabitedUnitsCountTitle = intl.formatMessage({ id: 'pages.condo.property.id.UninhabitedUnitsCountTitle' })
    const TicketsClosedTitle = intl.formatMessage({ id: 'pages.condo.property.id.TicketsClosed' })
    const TicketsInWorkTitle = intl.formatMessage({ id: 'pages.condo.property.id.TicketsInWork' })
    const TicketsDeferredTitle = intl.formatMessage({ id: 'pages.condo.property.id.TicketsDeferred' })
    const DeletePropertyLabel = intl.formatMessage({ id: 'pages.condo.property.form.DeleteLabel' })
    const ConfirmDeleteTitle = intl.formatMessage({ id: 'pages.condo.property.form.ConfirmDeleteTitle' })
    const ConfirmDeleteMessage = intl.formatMessage({ id: 'pages.condo.property.form.ConfirmDeleteMessage' })
    const AreaTitle = intl.formatMessage({ id: 'pages.condo.property.form.AreaTitle' })
    const YearOfConstructionTitle = intl.formatMessage({ id: 'pages.condo.property.form.YearOfConstructionTitle' })
    const EditPropertyTitle = intl.formatMessage({ id: 'pages.condo.property.id.EditPropertyTitle' })
    const EditPropertyMapTitle = intl.formatMessage({ id: 'pages.condo.property.id.EditPropertyMapTitle' })
    const UnknownValueTitle = intl.formatMessage({ id: 'pages.condo.property.id.UnknownMessage' })
    const TicketsTitle = intl.formatMessage({ id: 'global.section.tickets' })
    const PropertyInformationTitle = intl.formatMessage({ id: 'pages.condo.property.id.PropertyInformationTitle' })
    const PropertyReportTitle = intl.formatMessage({ id: 'pages.condo.property.id.PropertyReportTitle' })
    const PropertyReportDescription = intl.formatMessage({ id: 'pages.condo.property.id.PropertyReportDescription' })
    const BecomeSberClientTitle = intl.formatMessage({ id: 'pages.condo.property.id.becomeSberClientTitle' })
    const SetupReportTitle = intl.formatMessage({ id: 'pages.condo.property.id.setupReportTitle' })
    const ParkingTitle = intl.formatMessage({ id: 'field.sectionType.parking' })
    const ParkingAvailableTitle = intl.formatMessage({ id: 'global.available' })
    const ParkingNotAvailableTitle = intl.formatMessage({ id: 'global.notAvailable' })
    const ModalTitle = intl.formatMessage({ id: 'pages.condo.property.id.ModalTitle' })
    const ModalDescription = intl.formatMessage({ id: 'pages.condo.property.id.ModalDescription' })
    const AlreadySentTitle = intl.formatMessage({ id: 'pages.condo.property.id.AlreadySentTitle' })
    const LoadingError = intl.formatMessage({ id: 'errors.LoadingError' })

    const { push } = useRouter()
    const { useFlag } = useFeatureFlags()
    const { user } = useAuth()
    const [{ width }, setRef] = useContainerSize<HTMLDivElement>()

    const softDeleteAction = Property.useSoftDelete( () => push('/property/'))
    const [createBankAccountRequest, { loading: createBankAccountRequestLoading }] = useMutation(CREATE_BANK_ACCOUNT_REQUEST_MUTATION)

    const [bankAccountModalVisible, setBankAccountModalVisible] = useState(false)

    const createBankAccountRequestCallback = async () => {
        const alreadySent = cookie.get('createBankAccountRequestSent')
        if (alreadySent) {
            notification.error({ message: AlreadySentTitle })
        } else {
            const { error } = await createBankAccountRequest({
                variables: {
                    data: {
                        dv: 1,
                        sender: getClientSideSenderInfo(),
                        organizationId: link.organization.id,
                        propertyAddress: property.address,
                        tin: link.organization.tin,
                        name: link.organization.name,
                        bankAccountClient: {
                            name: user.name,
                            phone: user.phone,
                            email: user.email,
                        },
                    },
                },
            })

            if (error) {
                notification.error({
                    message: LoadingError,
                })
            } else {
                cookie.set('createBankAccountRequestSent', true, { expires: 1 })
                setBankAccountModalVisible(true)
            }
        }
    }
    const closeBankAccountModal = () => setBankAccountModalVisible(false)

    const yearOfConstructionCardLabel = property.yearOfConstruction
        ? dayjs(property.yearOfConstruction).format('YYYY')
        : UnknownValueTitle
    const propertyInfoDataSource = useMemo<ListProps['dataSource']>(() => [
        {
            label: AreaTitle,
            value: property.area ? property.area : UnknownValueTitle,
        },
        {
            label: YearOfConstructionTitle,
            value: yearOfConstructionCardLabel,
        },
        {
            label: UnitsCountTitle,
            value: property.unitsCount,
        },
        {
            label: UninhabitedUnitsCountTitle,
            value: property.uninhabitedUnitsCount,
        },
        {
            label: ParkingTitle,
            value: get(property, ['map', 'parking', 'length']) ? ParkingAvailableTitle : ParkingNotAvailableTitle,
        },
    ], [AreaTitle, property, ParkingTitle, UnitsCountTitle, UninhabitedUnitsCountTitle, yearOfConstructionCardLabel,
        UnknownValueTitle, YearOfConstructionTitle, ParkingAvailableTitle, ParkingNotAvailableTitle])
    const propertyTicketDataSource = useMemo<ListProps['dataSource']>(() => [
        {
            label: TicketsInWorkTitle,
            value: property.ticketsInWork,
            valueTextType: 'warning',
        },
        {
            label: TicketsDeferredTitle,
            value: property.ticketsDeferred,
            valueTextType: 'info',
        },
        {
            label: TicketsClosedTitle,
            value: property.ticketsClosed,
            valueTextType: 'success',
        },
    ], [TicketsDeferredTitle, TicketsInWorkTitle, TicketsClosedTitle, property])

    const propertyBankAccountPage = useFlag(PROPERTY_BANK_ACCOUNT)
    const canManageProperties = get(link, 'role.canManageProperties', false)

    return (
        <>
            <Row gutter={PROPERTY_PAGE_CONTENT_ROW_GUTTER} align='top'>
                <Col span={24}>
                    <Space direction='vertical' size={20}>
                        <Typography.Title level={1}>{property.address}</Typography.Title>
                        {
                            property.name ?
                                <Typography.Title level={3} type='secondary'>«{property.name}»</Typography.Title> :
                                null
                        }
                    </Space>
                </Col>
            </Row>
            {propertyBankAccountPage ? (
                <Row
                    gutter={PROPERTY_PAGE_CONTENT_ROW_INFO_BLOCK_GUTTER}
                    style={PROPERTY_PAGE_CONTENT_ROW_INFO_BLOCK_STYLE}
                >
                    <Col xl={12} md={24} sm={24} xs={24}>
                        <Space direction='vertical' size={40} style={PROPERTY_PAGE_SPACE_STYLE}>
                            <List title={PropertyInformationTitle} dataSource={propertyInfoDataSource} />
                            <List title={TicketsTitle} dataSource={propertyTicketDataSource} />
                        </Space>
                    </Col>
                    <Col xl={12} md={24} sm={24} xs={24}>
                        <Card>
                            <PropertyCardContent>
                                <Space direction='vertical' size={12}>
                                    <Typography.Title level={4}>{PropertyReportTitle}</Typography.Title>
                                    <Typography.Text>{PropertyReportDescription}</Typography.Text>
                                </Space>
                                <PropertyReportCardBottomWrapper ref={setRef} width={width}>
                                    <Space direction='vertical' size={12}>
                                        <Button type='sberDefaultGradient'>
                                            {SetupReportTitle}
                                        </Button>
                                        <Button
                                            type='sberDefaultGradient'
                                            secondary
                                            onClick={createBankAccountRequestCallback}
                                            loading={createBankAccountRequestLoading}
                                        >
                                            {BecomeSberClientTitle}
                                        </Button>
                                    </Space>
                                    <ImageWrapper>
                                        <Image src='/property-empty-report.png' preview={false} />
                                    </ImageWrapper>
                                </PropertyReportCardBottomWrapper>
                            </PropertyCardContent>
                        </Card>
                    </Col>
                    <Modal
                        title={ModalTitle}
                        open={bankAccountModalVisible}
                        onCancel={closeBankAccountModal}
                    >
                        <Typography.Paragraph type='secondary'>
                            {ModalDescription}
                        </Typography.Paragraph>
                    </Modal>
                </Row>
            ) : (
                <Row
                    gutter={PROPERTY_PAGE_CONTENT_ROW_CARDS_GUTTER}
                    style={PROPERTY_PAGE_CONTENT_ROW_STYLE}
                    justify='start'
                >
                    <Col flex={0}>
                        <PropertyInfoPanel title={TicketsClosedTitle} message={property.ticketsClosed} type='success' large />
                    </Col>
                    <Col flex={0}>
                        <PropertyInfoPanel title={TicketsInWorkTitle} message={property.ticketsInWork}  type='warning' large />
                    </Col>
                    <Col flex={0}>
                        <PropertyInfoPanel title={AreaTitle} message={property.area ? property.area : UnknownValueTitle } />
                    </Col>
                    <Col flex={0}>
                        <PropertyInfoPanel title={YearOfConstructionTitle} message={yearOfConstructionCardLabel} />
                    </Col>
                    <Col flex={0}>
                        <PropertyInfoPanel title={UnitsCountTitle} message={property.unitsCount} large />
                    </Col>
                    <Col flex={0}>
                        <PropertyInfoPanel title={UninhabitedUnitsCountTitle} message={property.uninhabitedUnitsCount} large />
                    </Col>
                </Row>
            )}
            <Row gutter={PROPERTY_PAGE_CONTENT_ROW_GUTTER} style={PROPERTY_PAGE_CONTENT_ROW_STYLE}>
                <Col span={24} css={CustomScrollbarCss}>
                    <PropertyPanels
                        mode='view'
                        map={property.map}
                        address={property.address}
                        canManageProperties={canManageProperties}
                    />
                </Col>
            </Row>
            {
                canManageProperties ? (
                    <ActionBar>
                        <Space size={20} wrap style={PROPERTY_PAGE_ACTION_BAR_SPACE_STYLE}>
                            <Link href={`/property/${property.id}/update`}>
                                <span>
                                    <Button
                                        type='sberDefaultGradient'
                                        size='large'
                                    >
                                        {EditPropertyTitle}
                                    </Button>
                                </span>
                            </Link>
                            {
                                !isNull(get(property, 'map')) && (
                                    <Link href={`/property/${property.id}/map/update`}>
                                        <Button
                                            color='green'
                                            type='sberDefaultGradient'
                                            secondary
                                            size='large'
                                            data-cy='property-map__update-button'
                                        >
                                            {EditPropertyMapTitle}
                                        </Button>
                                    </Link>
                                )
                            }
                            <DeleteButtonWithConfirmModal
                                title={ConfirmDeleteTitle}
                                message={ConfirmDeleteMessage}
                                okButtonLabel={DeletePropertyLabel}
                                action={() => softDeleteAction(property)}
                                buttonCustomProps={DELETE_BUTTON_CUSTOM_PROPS}
                                buttonContent={<span>{DeletePropertyLabel}</span>}
                            />
                        </Space>
                    </ActionBar>
                ) : null
            }
        </>
    )
}

interface IPropertyIdPage extends React.FC {
    headerAction?: JSX.Element
    requiredAccess?: React.FC
}

const PropertyIdPage: IPropertyIdPage = () => {
    const intl = useIntl()
    const PageTitleMsg = intl.formatMessage({ id: 'pages.condo.property.id.PageTitle' })
    const ServerErrorMsg = intl.formatMessage({ id: 'ServerError' })

    const { query: { id } } = useRouter()
    const { loading, obj: property, error } = Property.useObject({ where: { id: id as string } })
    const { link } = useOrganization()

    if (error || loading) {
        return <LoadingOrErrorPage title={PageTitleMsg} loading={loading} error={error ? ServerErrorMsg : null}/>
    }

    return <>
        <Head>
            <title>{PageTitleMsg}</title>
        </Head>
        <PageWrapper>
            <PageContent>
                <PropertyPageContent
                    property={property}
                    link={link}
                />
            </PageContent>
        </PageWrapper>
    </>
}

PropertyIdPage.requiredAccess = OrganizationRequired

export default PropertyIdPage
