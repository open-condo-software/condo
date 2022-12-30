/** @jsx jsx */
import React from 'react'
import { useIntl } from '@open-condo/next/intl'
import { Row, Col, Typography, Space, RowProps, Image } from 'antd'
import { useRouter } from 'next/router'
import dayjs from 'dayjs'
import get from 'lodash/get'
import isNull from 'lodash/isNull'
import { jsx } from '@emotion/react'
import styled from '@emotion/styled'
import Head from 'next/head'
import Link from 'next/link'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { Property } from '@condo/domains/property/utils/clientSchema'
import { DeleteFilled } from '@ant-design/icons'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { PROPERTY_BANK_ACCOUNT } from '@condo/domains/common/constants/featureflags'
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
import { List, Card } from '@open-condo/ui'

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
const PROPERTY_INFO_PANEL_MESSAGE_STYLE: React.CSSProperties = {
    fontSize: '24px',
    lineHeight: '32px',
    fontWeight: 'bold',
}
const PROPERTY_INFO_PANEL_MESSAGE_TEXT_STYLE: React.CSSProperties = {
    ...PROPERTY_INFO_PANEL_MESSAGE_STYLE,
    fontSize: '20px',
}

const PropertyInfoPanel: React.FC<IPropertyInfoPanelProps> = ({ title, message, type, large = false }) => (
    <FocusContainer style={PROPERTY_INFO_PANEL_STYLE}>
        <Space direction='vertical' size={8}>
            <Typography.Text
                {...{ type }}
                style={large ? PROPERTY_INFO_PANEL_MESSAGE_STYLE : PROPERTY_INFO_PANEL_MESSAGE_TEXT_STYLE}
            >
                {message}
            </Typography.Text>
            <Typography.Text type='secondary'>{title}</Typography.Text>
        </Space>
    </FocusContainer>
)

const PropertyReportCardBottomWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: end;
  margin-top: 36px;
  //flex-wrap: wrap-reverse;
  
  & > div {
    max-width: 50%;
  }
  
  @media screen and (max-width: 550px) {
    flex-direction: column-reverse;
    align-items: start;
    
    & > div {
      max-width: unset;
    }
    
    & > div:first-child {
      margin-top: 24px;
    }
  }
`

const ImageWrapper = styled.div`
  display: flex;
  justify-content: end;
  align-content: center;
`

const PROPERTY_PAGE_CONTENT_ROW_GUTTER: RowProps['gutter'] = [12, 40]
const PROPERTY_PAGE_CONTENT_ROW_CARDS_GUTTER: RowProps['gutter'] = [24, 40]
const PROPERTY_PAGE_CONTENT_ROW_INFO_BLOCK_GUTTER: RowProps['gutter'] = [52, 0]
const PROPERTY_PAGE_CONTENT_ROW_INFO_BLOCK_STYLE: React.CSSProperties = { marginTop: '80px' }
const PROPERTY_PAGE_CONTENT_ROW_STYLE: React.CSSProperties = { marginTop: '40px' }
const PROPERTY_PAGE_ACTION_BAR_SPACE_STYLE: React.CSSProperties = { marginBottom: 0 }
const DELETE_BUTTON_CUSTOM_PROPS: IDeleteActionButtonWithConfirmModal['buttonCustomProps'] = {
    type: 'sberDangerGhost',
    icon: <DeleteFilled />,
}

export const PropertyPageContent = ({ property, role }) => {
    const intl = useIntl()
    const UnitsCountTitle = intl.formatMessage({ id: 'pages.condo.property.id.UnitsCount' })
    const UninhabitedUnitsCountTitle = intl.formatMessage({ id: 'pages.condo.property.id.UninhabitedUnitsCountTitle' })
    const TicketsClosedTitle = intl.formatMessage({ id: 'pages.condo.property.id.TicketsClosed' })
    const TicketsInWorkTitle = intl.formatMessage({ id: 'pages.condo.property.id.TicketsInWork' })
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

    const { push } = useRouter()
    const softDeleteAction = Property.useSoftDelete( () => push('/property/'))
    const yearOfConstructionCardLabel = property.yearOfConstruction
        ? dayjs(property.yearOfConstruction).format('YYYY')
        : UnknownValueTitle

    const { useFlag } = useFeatureFlags()

    const propertyBankAccountPage = useFlag(PROPERTY_BANK_ACCOUNT)
    const canManageProperties = get(role, 'canManageProperties', false)

    return (
        <>
            <Row gutter={PROPERTY_PAGE_CONTENT_ROW_GUTTER} align='top'>
                <Col span={24}>
                    <Typography.Title level={1} style={{ margin: 0 }}>{property.address}</Typography.Title>
                    {
                        property.name ?
                            <Typography.Title level={4} type='secondary'>«{property.name}»</Typography.Title> :
                            null
                    }
                </Col>
            </Row>
            {propertyBankAccountPage ? (
                <Row
                    gutter={PROPERTY_PAGE_CONTENT_ROW_INFO_BLOCK_GUTTER}
                    style={PROPERTY_PAGE_CONTENT_ROW_INFO_BLOCK_STYLE}
                >
                    <Col xl={12} md={24} sm={24}>
                        <List
                            title={PropertyInformationTitle}
                            dataSource={[
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
                            ]}
                        />
                        <List
                            title={TicketsTitle}
                            dataSource={[
                                {
                                    label: TicketsInWorkTitle,
                                    value: property.ticketsInWork,
                                    valueTextType: 'warning',
                                },
                                {
                                    label: TicketsClosedTitle,
                                    value: property.ticketsClosed,
                                    valueTextType: 'success',
                                },
                            ]}
                        />
                    </Col>
                    <Col xl={12} md={24} sm={24}>
                        <Card>
                            <div style={{ padding: '16px' }}>
                                <Space direction='vertical' size={12}>
                                    <Typography.Title level={4}>{PropertyReportTitle}</Typography.Title>
                                    <Typography.Text>{PropertyReportDescription}</Typography.Text>
                                </Space>
                                <PropertyReportCardBottomWrapper>
                                    <Space direction='vertical' size={12}>
                                        <Button type='sberDefaultGradient'>
                                            {SetupReportTitle}
                                        </Button>
                                        <Button type='sberDefaultGradient' secondary>
                                            {BecomeSberClientTitle}
                                        </Button>
                                    </Space>
                                    <ImageWrapper>
                                        <Image
                                            src='/property-empty-report.png'
                                            preview={false}
                                            width={156}
                                            height={204}
                                        />
                                    </ImageWrapper>
                                </PropertyReportCardBottomWrapper>
                            </div>
                        </Card>
                    </Col>
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
                    <Col flex={0} >
                        <PropertyInfoPanel title={UnitsCountTitle} message={property.unitsCount} large />
                    </Col>
                    <Col flex={0} >
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
                    role={link.role}
                />
            </PageContent>
        </PageWrapper>
    </>
}

PropertyIdPage.requiredAccess = OrganizationRequired

export default PropertyIdPage
