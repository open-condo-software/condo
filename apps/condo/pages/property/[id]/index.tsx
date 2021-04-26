import { useIntl } from '@core/next/intl'
import React from 'react'
import { Row, Col, Typography, Tag, Space } from 'antd'
import { useRouter } from 'next/router'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { useObject } from '@condo/domains/property/utils/clientSchema/Property'
import { LinkWithIcon } from '@condo/domains/common/components/LinkWithIcon'
import { ArrowLeftOutlined, EditFilled } from '@ant-design/icons'
import { colors } from '@condo/domains/common/constants/style'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import Head from 'next/head'
import Link from 'next/link'
import { Button } from '@condo/domains/common/components/Button'
import { FocusContainer } from '@condo/domains/common/components/FocusContainer'
import { PropertyPanels } from '@condo/domains/property/components/panels/index'

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

interface IPageWithHeaderAction extends React.FC {
    headerAction?: JSX.Element
}

const PropertyIdPage: IPageWithHeaderAction = () => {
    const intl = useIntl()
    const PageTitleMsg = intl.formatMessage({ id: 'pages.condo.property.id.PageTitle' })
    const ServerErrorMsg = intl.formatMessage({ id: 'ServerError' })

    const { query: { id } } = useRouter()
    const { loading, obj: property, error } = useObject({ where: { id: id as string } })

    if (error || loading) {
        return <LoadingOrErrorPage title={PageTitleMsg} loading={loading} error={error ? ServerErrorMsg : null}/>
    }

    const UnitsCountTitle = intl.formatMessage({ id: 'pages.condo.property.id.UnitsCount' })
    const SquareTitle = intl.formatMessage({ id: 'pages.condo.property.id.Square' })
    const TicketsClosedTitle = intl.formatMessage({ id: 'pages.condo.property.id.TicketsClosed' })
    const TicketsInWorkTitle = intl.formatMessage({ id: 'pages.condo.property.id.TicketsInWork' })
    const UnknownMessage = intl.formatMessage({ id: 'pages.condo.property.id.UnknownMessage' })

    return <>
        <Head>
            <title>{PageTitleMsg}</title>
        </Head>
        <PageWrapper>
            <PageContent>
                <OrganizationRequired>
                    <Row gutter={[12, 40]} align='top'>
                        <Col span={23}>
                            <Typography.Title level={1} style={{ margin: 0 }}>{property.address}</Typography.Title>
                            {
                                property.name ? 
                                    <Tag style={{ marginTop: '25px' }}>{property.name}</Tag> :
                                    null
                            }
                        </Col>
                        <Col span={1} >
                            <Link href={`/property/${property.id}/update`}>
                                <Button
                                    color={'green'}
                                    type={'sberPrimary'}
                                    secondary
                                    icon={<EditFilled />}
                                >
                                </Button>
                            </Link>
                        </Col>
                    </Row>       
                    <Row gutter={[12, 40]} style={{ marginTop: '40px' }}>
                        <Col flex={1} >
                            <PropertyInfoPanel title={UnitsCountTitle} message={property.unitsCount} />
                        </Col>
                        <Col flex={1}>
                            <PropertyInfoPanel title={SquareTitle} message={UnknownMessage} />
                        </Col>
                        <Col flex={1}>
                            <PropertyInfoPanel title={TicketsClosedTitle} message={property.ticketsClosed} type='success' />
                        </Col>
                        <Col flex={1}>
                            <PropertyInfoPanel title={TicketsInWorkTitle} message={property.ticketsInWork}  type='warning' />
                        </Col>
                    </Row>
                    <Row gutter={[12, 40]} style={{ marginTop: '40px' }}>
                        <Col span={24}>
                            <PropertyPanels mode='view' map={property.map} />                    
                        </Col>
                    </Row>
                </OrganizationRequired>
            </PageContent>
        </PageWrapper>
    </>
}

const HeaderAction = () => {
    const intl = useIntl()
    const AllPropertiesMessage = intl.formatMessage({ id: 'menu.AllProperties' })
    return (
        <LinkWithIcon
            icon={<ArrowLeftOutlined style={{ color: colors.white }}/>}
            path={'/property/'}
        >
            {AllPropertiesMessage}
        </LinkWithIcon>
    )
}

PropertyIdPage.headerAction = <HeaderAction />

export default PropertyIdPage
