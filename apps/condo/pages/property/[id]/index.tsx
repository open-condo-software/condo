import React from 'react'
import { useIntl } from '@core/next/intl'
import { Row, Col, Typography, Tag, Space, RowProps } from 'antd'
import { useRouter } from 'next/router'
import dayjs from 'dayjs'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { useObject, useSoftDelete } from '@condo/domains/property/utils/clientSchema/Property'
import { DeleteFilled } from '@ant-design/icons'
import { colors } from '@condo/domains/common/constants/style'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import Head from 'next/head'
import Link from 'next/link'
import { Button } from '@condo/domains/common/components/Button'
import { FocusContainer } from '@condo/domains/common/components/FocusContainer'
import { PropertyPanels } from '@condo/domains/property/components/panels'
import ActionBar from '@condo/domains/common/components/ActionBar'
import { ReturnBackHeaderAction } from '@condo/domains/common/components/HeaderActions'
import {
    DeleteButtonWithConfirmModal,
    IDeleteActionButtonWithConfirmModal,
} from '@condo/domains/common/components/DeleteButtonWithConfirmModal'
import { useOrganization } from '@core/next/organization'

interface IPropertyInfoPanelProps {
    title: string
    message: string
    type?:  'success' | 'warning'
}

const PropertyInfoPanel: React.FC<IPropertyInfoPanelProps> = ({ title, message, type }) => {

    return (
        <FocusContainer style={{ margin: 'initial', width: '180px', height: '105px' }}>
            <Space direction={'vertical'} size={8}>
                <Typography.Text type={'secondary'}>{title}</Typography.Text>
                <Typography.Text {...{ type }} style={{ fontSize: '20px', fontWeight: 'bold' }}>{message}</Typography.Text>
            </Space>
        </FocusContainer>
    )

}

const PROPERTY_PAGE_CONTENT_ROW_GUTTER: RowProps['gutter'] = [12, 40]
const PROPERTY_PAGE_CONTENT_ROW_CARDS_GUTTER: RowProps['gutter'] = [24, 40]
const PROPERTY_PAGE_CONTENT_ROW_STYLE: React.CSSProperties = { marginTop: '40px' }
const DELETE_BUTTON_CUSTOM_PROPS: IDeleteActionButtonWithConfirmModal['buttonCustomProps'] = {
    type: 'sberDangerGhost',
    icon: <DeleteFilled />,
}

export const PropertyPageContent = ({ property, role }) => {
    const intl = useIntl()
    const UnitsCountTitle = intl.formatMessage({ id: 'pages.condo.property.id.UnitsCount' })
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

    const { push } = useRouter()
    const softDeleteAction = useSoftDelete({}, () => push('/property/'))
    const yearOfConstructionCardLabel = property.yearOfConstruction
        ? dayjs(property.yearOfConstruction).format('YYYY')
        : UnknownValueTitle

    return (
        <>
            <Row gutter={PROPERTY_PAGE_CONTENT_ROW_GUTTER} align='top'>
                <Col span={24}>
                    <Typography.Title level={1} style={{ margin: 0 }}>{property.address}</Typography.Title>
                    {
                        property.name ?
                            <Tag style={{ marginTop: '25px', borderColor: 'transparent', backgroundColor: colors.ultraLightGrey }}>{property.name}</Tag> :
                            null
                    }
                </Col>
            </Row>
            <Row
                gutter={PROPERTY_PAGE_CONTENT_ROW_CARDS_GUTTER}
                style={PROPERTY_PAGE_CONTENT_ROW_STYLE}
                justify='start'
            >
                <Col flex={0} >
                    <PropertyInfoPanel title={UnitsCountTitle} message={property.unitsCount} />
                </Col>
                <Col flex={0}>
                    <PropertyInfoPanel title={TicketsClosedTitle} message={property.ticketsClosed} type='success' />
                </Col>
                <Col flex={0}>
                    <PropertyInfoPanel title={TicketsInWorkTitle} message={property.ticketsInWork}  type='warning' />
                </Col>
                <Col flex={0}>
                    <PropertyInfoPanel title={AreaTitle} message={property.area ? property.area : UnknownValueTitle } />
                </Col>
                <Col flex={0}>
                    <PropertyInfoPanel title={YearOfConstructionTitle} message={yearOfConstructionCardLabel} />
                </Col>
            </Row>
            <Row gutter={PROPERTY_PAGE_CONTENT_ROW_GUTTER} style={PROPERTY_PAGE_CONTENT_ROW_STYLE}>
                <Col span={24}>
                    <PropertyPanels mode='view' map={property.map} address={property.address} />
                </Col>
            </Row>
            {
                role && role.canManageProperties ? (
                    <ActionBar>
                        <Space size={20}>
                            <Link href={`/property/${property.id}/update`}>
                                <span>
                                    <Button
                                        type={'sberDefaultGradient'}
                                        size={'large'}
                                    >
                                        {EditPropertyTitle}
                                    </Button>
                                </span>
                            </Link>
                            {
                                property.map !== null && (
                                    <Link href={`/property/${property.id}/map/update`}>
                                        <Button
                                            color={'green'}
                                            type={'sberDefaultGradient'}
                                            secondary
                                            size={'large'}
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
                                action={() => softDeleteAction({}, property)}
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
    const { loading, obj: property, error } = useObject({ where: { id: id as string } })
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

PropertyIdPage.headerAction = <ReturnBackHeaderAction descriptor={{ id: 'menu.AllProperties' }} path={'/property/'}/>
PropertyIdPage.requiredAccess = OrganizationRequired

export default PropertyIdPage
