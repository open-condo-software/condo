/** @jsx jsx */
import { css, jsx } from '@emotion/core'
import Head from 'next/head'
import {Button, Form, Select, Input, Layout, Typography, Row} from 'antd'
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'
import { useMutation } from '@core/next/apollo'
import gql from 'graphql-tag'
import {useState} from 'react'
import {useAuth} from "@core/next/auth";

const CREATE_FUNCTION_MUTATION = gql`
    mutation createFunction($data: FunctionCreateInput!) {
        function: createFunction(data: $data) {
            id
        }
    }
`

const LANGUAGES = ['Javascript', 'Python']
const TYPES = ['int', 'float', 'string', 'bool']

const FunctionList = () => {
    return (
        <div></div>
    )
}

const NewFunction = () => {
    const { user } = useAuth()
    const [form] = Form.useForm()

    const [createNewFunction] = useMutation(CREATE_FUNCTION_MUTATION)

    const create = () => {
        const result = form.getFieldsValue()
        const data = {
            owner: { connect: { id: user.id } },
            language: result.language || LANGUAGES[0],
            signature: JSON.stringify({
                name: result.function_name,
                arguments: result.arguments,
                return: result.return_type || TYPES[0],
            }),
            description: result.description,
            body: result.body,
        }
        console.log(data)

        createNewFunction({
            variables: {
                data,
            }
        })
    }

    return (
        <Layout bordered>
            <Layout.Header>
                <Typography.Title level={2} style={{ textAlign: 'center', color: '#ffffff' }}>ADD NEW FUNCTION</Typography.Title>
            </Layout.Header>
            <Layout.Content>
                <Form
                    layout='vertical'
                    form={form}
                >
                    <Form.Item label='description' name='description' required={true}>
                        <Input.TextArea rows={4} />
                    </Form.Item>
                    <Form.Item label={'language'} name='language' required={true}>
                        <Select style={{ width: 180 }} defaultValue={LANGUAGES[0]}>
                            {LANGUAGES.map((value) => (<Select.Option value={value}>{value}</Select.Option>))}
                        </Select>
                    </Form.Item>
                    <Form.Item label={"function name"} name={"function_name"} required={true}>
                        <Input style={{ width: 180 }} />
                    </Form.Item>
                    <Form.List name={'arguments'} label={'arguments'}>
                        {
                            (fields, { add, remove }) => (
                                <>
                                    {
                                        fields.length === 0
                                            ? <div>arguments</div>
                                            : fields.map((field, index) => (
                                                <Form.Item noStyle key={field.key}>
                                                    <Row>
                                                        <Form.Item style={{ margin: 0}} name={[field.name, 'name']} required={true}>
                                                            <Input style={{ width: 180 }} placeholder={'argument name'} />
                                                        </Form.Item>
                                                        <Form.Item style={{ margin: 0}} name={[field.name, 'type']} required={true}>
                                                            <Select style={{ width: 120 }} placeholder={'type'}>
                                                                {TYPES.map((value) => (<Select.Option value={value}>{value}</Select.Option>))}
                                                            </Select>
                                                        </Form.Item>
                                                        <MinusCircleOutlined
                                                            style={{
                                                                fontSize: '24px',
                                                                margin: '4px',
                                                            }}
                                                            onClick={() => remove(field.name)}
                                                        />
                                                    </Row>
                                                </Form.Item>
                                        ))
                                    }
                                    <Button style={{ width: 180 }} icon={<PlusOutlined />} type='dashed' onClick={() => add()}>ADD ARGUMENT</Button>
                                </>
                            )
                        }
                    </Form.List>
                    <Form.Item label={'return type'} name={'return_type'} required={true}>
                        <Select style={{ width: 180 }} defaultValue={TYPES[0]}>
                            {TYPES.map((value) => (<Select.Option value={value}>{value}</Select.Option>))}
                        </Select>
                    </Form.Item>
                    <Form.Item name={'body'} required={true} label='code'>
                        <Input.TextArea rows={5} />
                    </Form.Item>
                </Form>
                <Button onClick={create}>CREATE</Button>
            </Layout.Content>
        </Layout>
    )
}

const DevelopedFunctions = () => {
    return (
        <>
            <Head>
                <title>List of developed functions</title>
            </Head>
            <FunctionList />
            <NewFunction />
        </>
    )
}

export default DevelopedFunctions
