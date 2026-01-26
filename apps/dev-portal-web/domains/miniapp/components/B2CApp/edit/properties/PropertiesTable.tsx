import { Row, Col, Table, notification } from 'antd'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useIntl } from 'react-intl'

import { useCachePersistor } from '@open-condo/apollo'
import { PlusCircle, Trash } from '@open-condo/icons'
import { nonNull } from '@open-condo/miniapp-utils/helpers/collections'
import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { Button } from '@open-condo/ui'


import { EmptyTableFiller } from '@/domains/common/components/EmptyTableFiller'
import { HighlightedText } from '@/domains/common/components/HighlightedText'
import { SearchInput } from '@/domains/common/components/SearchInput'
import { useMutationErrorHandler } from '@/domains/common/hooks/useMutationErrorHandler'
import { useDebouncedSearch, useSearch } from '@/domains/common/hooks/useSearch'
import { DEFAULT_PAGE_SIZE } from '@/domains/miniapp/constants/common'
import { getCurrentPage } from '@/domains/miniapp/utils/query'

import { CreatePropertyModal } from './CreatePropertyModal'

import type { AppEnvironment } from '@/gql'
import type { RowProps } from 'antd'

import { AllB2CAppPropertiesDocument, useAllB2CAppPropertiesQuery, useDeleteB2CAppPropertyMutation } from '@/gql'


type PropertiesTableProps = {
    id: string
    environment: AppEnvironment
}

type B2CAppProperty = {
    id: string
    address: string
}

const BUTTON_GUTTER: RowProps['gutter'] = [40, 40]
const SEARCH_GUTTER: RowProps['gutter'] = [20, 20]
const FULL_COL_SPAN = 24
const PAGINATION_POSITION = ['bottomLeft' as const]

const HighlightedAddress = ({ address }: { address: string }) => {
    const [search] = useSearch()
    return (
        <HighlightedText text={address} highlight={search}/>
    )
}

export const PropertiesTable: React.FC<PropertiesTableProps> = ({ id, environment }) => {
    const intl = useIntl()
    const AddressColumnTitle = intl.formatMessage({ id: 'pages.apps.b2c.id.sections.properties.table.columns.address.title' })
    const EmptyTableMessage = intl.formatMessage({ id: 'pages.apps.b2c.id.sections.properties.table.empty.message' })
    const AddAddressLabel = intl.formatMessage({ id: 'pages.apps.b2c.id.sections.properties.actions.addProperty' })
    const SearchPlaceholder = intl.formatMessage({ id: 'pages.apps.b2c.id.sections.properties.table.search.placeholder' })
    const EmptySearchMessage = intl.formatMessage({ id: 'pages.apps.b2c.id.sections.properties.table.empty.search.message' })

    const [isCreatePropertyModalOpen, setIsCreatePropertyModalOpen] = useState(false)
    const showCreatePropertyModal = useCallback(() => {
        setIsCreatePropertyModalOpen(true)
    }, [])
    const hideCreatePropertyModal = useCallback(() => {
        setIsCreatePropertyModalOpen(false)
    }, [])

    const { persistor } = useCachePersistor()

    const router = useRouter()
    const { p } = router.query
    const page = getCurrentPage(p)

    const debouncedSearch = useDebouncedSearch()

    const onError = useMutationErrorHandler()
    const [deleteProperty] = useDeleteB2CAppPropertyMutation({
        onError,
        onCompleted (deletedProperty) {
            notification.success({
                message: intl.formatMessage({ id: 'pages.apps.b2c.id.sections.properties.notifications.successDeletion.title' }),
                description: intl.formatMessage({ id: 'pages.apps.b2c.id.sections.properties.notifications.successDeletion.description' }, {
                    address: deletedProperty.property?.address,
                }),
            })
        },
        refetchQueries: [AllB2CAppPropertiesDocument],
    })

    const columns = useMemo(() => [
        {
            title: AddressColumnTitle,
            key: 'address',
            dataIndex: 'address',
            render (address: string) {
                return (
                    <HighlightedAddress address={address}/>
                )
            },
        },
        {
            title: ' ',
            key: 'delete',
            // Right border + 2 x padding + width
            width: `${16 * 2 + 32 + 1}px`,
            render (_: string, obj: B2CAppProperty) {
                return (
                    <Button
                        type='primary'
                        size='medium'
                        minimal
                        danger
                        icon={<Trash size='small'/>}
                        onClick={() => {
                            deleteProperty({
                                variables: {
                                    data: {
                                        dv: 1,
                                        sender: getClientSideSenderInfo(),
                                        environment,
                                        id: obj.id,
                                    },
                                },
                            })
                        }}
                    />
                )
            },
        },
    ], [AddressColumnTitle, deleteProperty, environment])

    const { data, loading } = useAllB2CAppPropertiesQuery({
        variables: {
            data: {
                environment,
                app: { id },
                first: DEFAULT_PAGE_SIZE,
                skip:  DEFAULT_PAGE_SIZE * (page - 1),
                search: debouncedSearch,
            },
        },
        skip: !persistor,
        fetchPolicy: 'cache-and-network',
    })

    const properties = (data?.properties?.objs || []).filter(nonNull)
    const total = data?.properties?.meta.count || 0

    const EmptyMessage = debouncedSearch ? EmptySearchMessage : EmptyTableMessage

    useEffect(() => {
        if (!loading) {
            const availablePages = Math.max(1, Math.ceil(total / DEFAULT_PAGE_SIZE))
            if (page > availablePages) {
                router.replace({ query: { ...router.query, p: availablePages } }, undefined, { locale: router.locale })
            }
        }
    }, [router, loading, page, total])

    const handlePaginationChange = useCallback((newPage: number) => {
        router.replace({ query: { ...router.query, p: newPage } },  undefined, { locale: router.locale })
    }, [router])

    return (
        <Row gutter={BUTTON_GUTTER}>
            <Col span={FULL_COL_SPAN}>
                <Row gutter={SEARCH_GUTTER}>
                    <Col span={FULL_COL_SPAN}>
                        <SearchInput placeholder={SearchPlaceholder}/>
                    </Col>
                    <Col span={FULL_COL_SPAN}>
                        <Table
                            columns={columns}
                            rowKey='id'
                            dataSource={properties}
                            bordered
                            locale={{ emptyText: <EmptyTableFiller message={EmptyMessage} /> }}
                            loading={loading}
                            pagination={{
                                pageSize: DEFAULT_PAGE_SIZE,
                                position: PAGINATION_POSITION,
                                showSizeChanger: false,
                                total: data?.properties?.meta.count || 0,
                                simple: true,
                                current: page,
                                onChange: handlePaginationChange,
                            }}
                        />
                    </Col>
                </Row>
            </Col>
            <Col span={FULL_COL_SPAN}>
                <Button type='primary' icon={<PlusCircle size='medium'/>} onClick={showCreatePropertyModal}>{AddAddressLabel}</Button>
                {isCreatePropertyModalOpen && (
                    <CreatePropertyModal
                        appId={id}
                        environment={environment}
                        open={isCreatePropertyModalOpen}
                        closeFn={hideCreatePropertyModal}
                    />
                )}
            </Col>
        </Row>
    )
}