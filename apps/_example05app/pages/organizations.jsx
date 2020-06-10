/** @jsx jsx */
import { css, jsx } from '@emotion/core'
import { Form, Input, Button, Typography, notification, Modal, Tag, Radio, Popconfirm } from 'antd'
import { List, Avatar, Skeleton } from 'antd'
import { QuestionCircleOutlined } from '@ant-design/icons'

import gql from 'graphql-tag'

import { useState } from 'react'
import Head from 'next/head'
import Router from 'next/router'

import BaseLayout from '../containers/BaseLayout'
import { useAuth } from '@core/next/auth'
import { useIntl } from '@core/next/intl'
import { useMutation, useQuery } from '@core/next/apollo'
import { getQueryParams } from '../utils/url.utils'
import { useImmer } from 'use-immer'
import styled from '@emotion/styled'
import { useOrganization } from '@core/next/organization'

const { Title } = Typography

const ListButtonSlot = styled.div`
    margin: 24px;
    text-align: center;
`

function buildListQueries (gqlListSchemaName, fields = ['id', '_label_']) {
    const fieldsToStr = (fields) => '{ ' + fields.map((f) => Array.isArray(f) ? fieldsToStr(f) : f).join(' ') + ' }'
    const gqlFields = fieldsToStr(fields)

    const _itemQueryName = gqlListSchemaName
    const _listQueryName = gqlListSchemaName + 's'
    const gqlNames = {
        itemQueryName: _itemQueryName,
        listQueryName: `all${_listQueryName}`,
        listQueryMetaName: `_all${_listQueryName}Meta`,
        listMetaName: `_${_listQueryName}Meta`,
        listSortName: `Sort${_listQueryName}By`,
        deleteMutationName: `delete${_itemQueryName}`,
        updateMutationName: `update${_itemQueryName}`,
        createMutationName: `create${_itemQueryName}`,
        deleteManyMutationName: `delete${_listQueryName}`,
        updateManyMutationName: `update${_listQueryName}`,
        createManyMutationName: `create${_listQueryName}`,
        whereInputName: `${_itemQueryName}WhereInput`,
        whereUniqueInputName: `${_itemQueryName}WhereUniqueInput`,
        updateInputName: `${_itemQueryName}UpdateInput`,
        createInputName: `${_itemQueryName}CreateInput`,
        updateManyInputName: `${_listQueryName}UpdateInput`,
        createManyInputName: `${_listQueryName}CreateInput`,
        relateToManyInputName: `${_itemQueryName}RelateToManyInput`,
        relateToOneInputName: `${_itemQueryName}RelateToOneInput`,
    }

    return {
        create: gql`
            mutation create($data: ${gqlNames.createInputName}!) {
            obj: ${gqlNames.createMutationName}(data: $data) ${gqlFields}
            }
        `,
        list: gql`
            query list($where: ${gqlNames.whereInputName}){
            meta: ${gqlNames.listQueryMetaName} { count }
            list: ${gqlNames.listQueryName} (where: $where) ${gqlFields}
            }
        `,
        gqlNames,
        gqlFields,
    }
}

const gqlOrganization = buildListQueries('Organization', ['id', 'name', 'description', 'avatar', ['publicUrl']])
gqlOrganization.registerNew = gql`
    mutation registerNew($data: ${gqlOrganization.gqlNames.itemQueryName}RegisterNewInput!) {
    obj: registerNew${gqlOrganization.gqlNames.itemQueryName}(data: $data) ${gqlOrganization.gqlFields}
    }
`

const gqlOrganizationLink = buildListQueries('OrganizationToUserLink', ['id', 'organization', ['id', 'name', 'description', 'avatar', ['publicUrl']], 'user', ['id', 'name'], 'role', 'isRejected', 'isAccepted'])

const ACCEPT_REJECT_ORGANIZATION = gql`
    mutation acceptOrReject($id: ID!, $data: OrganizationToUserLinkAcceptOrRejectInput!){
        status: acceptOrRejectOrganizationToUserLink(id: $id, data: $data)
    }
`

const CreateOrganizationForm = ({ onFinish }) => {
    const [isVisible, setIsVisible] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [form] = Form.useForm()
    const [create] = useMutation(gqlOrganization.registerNew, {
        update: (cache, mutationResult) => {
            console.log('result', mutationResult)
        },
    })

    const intl = useIntl()
    const SavedMsg = intl.formatMessage({ id: 'Saved' })
    const ServerErrorMsg = intl.formatMessage({ id: 'ServerError' })
    const ErrorsMsgMapping = {
        '[register:email:multipleFound]': {
            name: 'email',
            errors: [ServerErrorMsg],
        },
    }

    function handleCancel () {
        setIsVisible(false)
    }

    function handleOpen () {
        setIsVisible(!isVisible)
    }

    function handleFinish (values) {
        console.log({ action: 'create', ...values })
        setIsLoading(true)
        create({ variables: { data: values } })
            .then(
                () => {
                    console.log('saved')
                    notification.success({ message: SavedMsg })
                    onFinish()
                },
                (e) => {
                    const errors = []
                    console.error(e)
                    notification.error({
                        message: ServerErrorMsg,
                        description: e.message,
                    })
                    Object.keys(ErrorsMsgMapping).forEach((msg) => {
                        if (e.message.includes(msg)) {
                            errors.push(ErrorsMsgMapping[msg])
                        }
                    })
                    if (errors.length) {
                        form.setFields(errors)
                    }
                })
            .finally(() => {
                setIsLoading(false)
                handleCancel()
            })
    }

    function handleSave () {
        form.submit()
    }

    return (<>
        <Button onClick={handleOpen}>Create Organization</Button>
        <Modal title="Change unit form" visible={isVisible} onCancel={handleCancel} footer={[
            <Button key="back" onClick={handleCancel}>
                Cancel
            </Button>,
            <Button key="submit" type="primary" onClick={handleSave} loading={isLoading}>
                Save
            </Button>,
        ]}
        >
            <Form form={form} layout="vertical" name="create-organization-form" onFinish={handleFinish}>
                <Form.Item
                    name="name"
                    label="Name"
                    rules={[{ required: true }]}
                >
                    <Input/>
                </Form.Item>
                <Form.Item
                    name="description"
                    label="Description"
                    rules={[{ required: true }]}
                >
                    <Input/>
                </Form.Item>
            </Form>
        </Modal>
    </>)
}

const OrganizationListForm = () => {
    const { user } = useAuth()
    const organization = useOrganization()
    const where = user ? { user: { id: user.id } } : {}
    const { loading, data, refetch } = useQuery(gqlOrganizationLink.list, {
        variables: { where },
        errorPolicy: 'all',
    })
    const [acceptOrReject] = useMutation(ACCEPT_REJECT_ORGANIZATION)

    const intl = useIntl()
    const DoneMsg = intl.formatMessage({ id: 'Done' })
    const ServerErrorMsg = intl.formatMessage({ id: 'ServerError' })

    const loadMore = <ListButtonSlot><CreateOrganizationForm onFinish={refetch}/></ListButtonSlot>
    console.log(organization)
    function handleAcceptOrReject (item, action) {
        console.log(item, action)
        let data = {}
        if (action === 'accept') {
            data = { isAccepted: true, isRejected: false }
        } else if (action === 'reject') {
            data = { isAccepted: false, isRejected: true }
        } else if (action === 'leave') {
            data = { isRejected: true }
        }
        acceptOrReject({ variables: { id: item.id, data } })
            .then(
                () => {
                    console.log('Done')
                    notification.success({ message: DoneMsg })
                },
                (e) => {
                    console.error(e)
                    notification.error({
                        message: ServerErrorMsg,
                        description: e.message,
                    })
                })
            .finally(() => refetch())
    }

    return (
        <List
            loading={loading}
            itemLayout="horizontal"
            loadMore={loadMore}
            dataSource={data && data.list || []}
            renderItem={item => (
                <List.Item
                    actions={[
                        (!item.isAccepted && !item.isRejected) ?
                            <Radio.Group size="small" onChange={(e) => handleAcceptOrReject(item, e.target.value)}>
                                <Radio.Button value="accept">accept</Radio.Button>
                                <Radio.Button value="reject">reject</Radio.Button>
                            </Radio.Group>
                            : null,
                        (item.isAccepted) ? <Popconfirm title="Are you sure？"
                                                        icon={<QuestionCircleOutlined style={{ color: 'red' }}/>}
                                                        onConfirm={() => handleAcceptOrReject(item, 'leave')}>
                                <Button size="small" type="dashed" danger>leave</Button>
                            </Popconfirm>
                            : null,
                        (item.isAccepted) ? <Button size="small" type={'primary'}
                                                    onClick={() => organization.selectLink(item)}>select</Button> : null,
                    ].filter((x) => Boolean(x))}
                    key={item.id}
                    style={(item.isRejected) ? { display: 'none' } : undefined}
                >
                    <Skeleton avatar title={false} loading={item.loading} active>
                        <List.Item.Meta
                            avatar={
                                <Avatar src="https://www.pngitem.com/pimgs/m/226-2261747_company-name-icon-png-transparent-png.png"/>
                            }
                            title={<>{item.organization && item.organization.name}{"  "}{item.role === 'owner' ? <Tag color="error">owner</Tag> : null}</>}
                            description={item.organization && item.organization.description}
                        />
                    </Skeleton>
                </List.Item>
            )}
        />

    )
}

const OrganizationListPage = () => {
    const intl = useIntl()
    const PageTitleMsg = intl.formatMessage({ id: 'pages.organizations.PageTitle' })
    return (<>
        <Head>
            <title>{PageTitleMsg}</title>
        </Head>
        <Title css={css`text-align: center;`}>{PageTitleMsg}</Title>
        <OrganizationListForm/>
    </>)
}

function CustomContainer (props) {
    return (<BaseLayout
        {...props}
        logoLocation="topMenu"
        className="top-menu-only-layout"
    />)
}

OrganizationListPage.container = CustomContainer

export default OrganizationListPage
