/** @jsx jsx */
import { css, jsx } from '@emotion/core'
import Head from 'next/head'
import {Button, Form, Select, Input, Row, Col} from 'antd'
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'
import { useMutation } from '@core/next/apollo'
import gql from 'graphql-tag'
import {useState} from 'react'
import {useAuth} from "@core/next/auth";
import {PageContent, PageHeader, PageWrapper} from "@app/_example05app/containers/BaseLayout";
import {AuthRequired} from "@app/_example05app/containers/AuthRequired";

const CREATE_FUNCTION_MUTATION = gql`
    mutation createFunction($data: FunctionCreateInput!) {
        function: createFunction(data: $data) {
            id
        }
    }
`

const LANGUAGES = ['Javascript', 'Python']
const TYPES = ['int', 'float', 'string', 'bool']

const NewFunction = () => {
    const { user } = useAuth()
    const [form] = Form.useForm()

    const [createNewFunction] = useMutation(CREATE_FUNCTION_MUTATION)

    const create = () => {
        const result = form.getFieldsValue()
        const data = {
            owner: { connect: { id: user.id } },
            markerplaceName: result.markerplace_name,
            language: result.language || LANGUAGES[0],
            signature: JSON.stringify({
                name: result.function_name,
                arguments: result.arguments,
                return: result.return_type || TYPES[0],
            }),
            description: result.description,
            body: result.body,
        }

        createNewFunction({
            variables: {
                data,
            }
        })
    }

    return (
        <>
            <Form
                layout='vertical'
                form={form}
            >
                <Form.Item label='markerplace name' name='markerplace_name' required={true}>
                    <Input />
                </Form.Item>
                <Form.Item label='description' name='description' required={true}>
                    <Input.TextArea rows={4} />
                </Form.Item>
                <Row>
                    <Form.Item label={'language'} name='language' required={true}>
                        <Select style={{ width: 180 }} defaultValue={LANGUAGES[0]}>
                            {LANGUAGES.map((value) => (<Select.Option value={value}>{value}</Select.Option>))}
                        </Select>
                    </Form.Item>
                    <Form.Item label={"function name"} name={"function_name"} required={true}>
                        <Input style={{ width: 180 }} />
                    </Form.Item>
                    <Col>
                        <Form.List  name={'arguments'}>
                            {
                                (fields, { add, remove }) => (
                                    <>
                                        <Button style={{ width: 180 }} icon={<PlusOutlined />} type='dashed' onClick={() => add()}>ADD ARGUMENT</Button>
                                        {
                                            fields.length === 0
                                                ? <div style={{ textAlign: 'center', width: 332 }}>empty arguments</div>
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
                                    </>
                                )
                            }
                        </Form.List>
                    </Col>
                    <Form.Item label={'return type'} name={'return_type'} required={true}>
                        <Select style={{ width: 180 }} defaultValue={TYPES[0]}>
                            {TYPES.map((value) => (<Select.Option value={value}>{value}</Select.Option>))}
                        </Select>
                    </Form.Item>
                </Row>
                <Form.Item name={'body'} required={true} label='code'>
                    <Input.TextArea rows={5} />
                </Form.Item>
            </Form>
            <Button onClick={create}>PUBLISH</Button>
        </>
    )
}

const DevelopedFunctions = () => {
    return (
        <>
            <Head>
                <title>Develop new function</title>
            </Head>
            <PageWrapper>
                <PageHeader title={"ADD NEW FUNCTION"}/>
                <PageContent>
                    <AuthRequired>
                        <NewFunction />
                    </AuthRequired>
                </PageContent>
            </PageWrapper>
        </>
    )
}

export default DevelopedFunctions
