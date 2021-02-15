import { Descriptions } from 'antd'
import React from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'

import { useIntl } from '@core/next/intl'

import { PageContent, PageHeader, PageWrapper } from '../../containers/BaseLayout'
import { OrganizationRequired } from '../../containers/OrganizationRequired'

import { useObject, useUpdate } from '../../schema/Property.uistate'
import LoadingOrErrorPage from '../../containers/LoadingOrErrorPage'
import { buildingMapJson } from '../../constants/property.example'
import BBuilder from '../../containers/BBuilder'

function PropertyDescriptionBlock ({ obj }) {
    const intl = useIntl()
    const OrganizationMsg = intl.formatMessage({ id: 'pages.condo.property.field.Organization' })
    const AddressMsg = intl.formatMessage({ id: 'pages.condo.property.field.Address' })
    const TypeMsg = intl.formatMessage({ id: 'pages.condo.property.field.Type' })
    const BuildingMsg = intl.formatMessage({ id: 'pages.condo.property.type.building' })
    const VillageMsg = intl.formatMessage({ id: 'pages.condo.property.type.village' })
    const TypeMappingMsg = {
        building: BuildingMsg,
        village: VillageMsg,
    }

    // TODO(pahaz): move small to ANT CONFIG!
    return <Descriptions size="small" column={1}>
        <Descriptions.Item label={OrganizationMsg}>{obj.organization.name}</Descriptions.Item>
        <Descriptions.Item label={TypeMsg}>{TypeMappingMsg[obj.type]}</Descriptions.Item>
        <Descriptions.Item label={AddressMsg}>{obj.address}</Descriptions.Item>
    </Descriptions>
}

function PropertyViewBlock ({ obj, update }) {
    // const state = obj.map
    function handleSaveState (state) {
        return update({ map: state }, obj)
    }

    return <BBuilder state={obj.map || buildingMapJson} onSaveState={handleSaveState}/>
}

const PropertyIdPage = () => {
    const intl = useIntl()
    const PageTitleMsg = intl.formatMessage({ id: 'pages.condo.property.id.PageTitle' })
    const ServerErrorMsg = intl.formatMessage({ id: 'ServerError' })

    const router = useRouter()
    const { query: { id } } = router
    const { refetch, loading, obj, error } = useObject({ where: { id } })
    const update = useUpdate({}, () => refetch())

    if (error || loading) {
        return <LoadingOrErrorPage title={PageTitleMsg} loading={loading} error={ServerErrorMsg}/>
    }

    return <>
        <Head>
            <title>{PageTitleMsg}</title>
        </Head>
        <PageWrapper>
            <PageHeader title={obj.name || PageTitleMsg}>
                <PropertyDescriptionBlock obj={obj}/>
            </PageHeader>
            <PageContent>
                <OrganizationRequired>
                    <PropertyViewBlock obj={obj} update={update}/>
                </OrganizationRequired>
            </PageContent>
        </PageWrapper>
    </>
}

export default PropertyIdPage
