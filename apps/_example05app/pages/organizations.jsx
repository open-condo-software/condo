/** @jsx jsx */
import { css, jsx } from '@emotion/core'
import { Form, Input, Button, Typography, notification, Modal, Tag } from 'antd'
import { List, Avatar, Skeleton } from 'antd'
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

const gqlOrganizationLink = buildListQueries('OrganizationToUserLink', ['id', 'organization', ['id', 'name', 'description', 'avatar', ['publicUrl']], 'user', ['id', 'name'], 'role'])

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
    const [form] = Form.useForm()
    const intl = useIntl()
    const { user } = useAuth()
    const where = user ? { user: { id: user.id } } : {}
    const { loading, error, data, refetch } = useQuery(gqlOrganizationLink.list, {
        variables: { where },
        fetchPolicy: 'network-only',
        errorPolicy: 'all',
    })
    const loadMore = <ListButtonSlot><CreateOrganizationForm onFinish={refetch}/></ListButtonSlot>

    return (
        <List
            loading={loading}
            itemLayout="horizontal"
            loadMore={loadMore}
            dataSource={data && data.list || []}
            renderItem={item => (
                <List.Item
                    actions={[<a key="list-loadmore-edit">leave</a>, <a key="list-loadmore-more">go</a>]}
                >
                    <Skeleton avatar title={false} loading={item.loading} active>
                        <List.Item.Meta
                            avatar={
                                <Avatar src="https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png"/>
                            }
                            title={<a href="https://ant.design">{item.organization && item.organization.name}</a>}
                            description="Ant Design, a design language for background applications, is refined by Ant UED Team"
                        />
                        {item.role === 'owner' ? <Tag color="error">owner</Tag> : null}
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
