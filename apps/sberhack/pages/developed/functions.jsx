/** @jsx jsx */
import { css, jsx } from '@emotion/core'
import Head from 'next/head'
import {Button, Form, Select, Input, Row} from 'antd'
import { MinusCircleOutlined, PlusCircleOutlined } from '@ant-design/icons'
import { useMutation } from '@core/next/apollo'
import gql from 'graphql-tag'
import {useState, useRef} from 'react'
import {useAuth} from "@core/next/auth";
import {PageContent, PageHeader, PageWrapper} from "@app/_example05app/containers/BaseLayout"
import {AuthRequired} from "@app/_example05app/containers/AuthRequired"

import dynamic from 'next/dynamic'
import Router from "next/router";
const CodeMirrorHack = dynamic(import('../../components/CodeMirrorHack'), {ssr: false})

const CREATE_FUNCTION_MUTATION = gql`
    mutation createFunction($data: FunctionCreateInput!) {
        function: createFunction(data: $data) {
            id
        }
    }
`

const LANGUAGES = ['Javascript', 'Python']
const TYPES = ['int', 'float', 'string', 'bool']

const WIDTH_180 = { width: 180 }
const ICON_STYLE = {
    fontSize: '24px',
    margin: '4px',
}

const NewFunction = () => {
    const code = useRef('')
    const [mode, setMode] = useState(LANGUAGES[0].toLowerCase())
    const { user } = useAuth()
    const [form] = Form.useForm()

    const [createNewFunction, { loading }] = useMutation(
        CREATE_FUNCTION_MUTATION
    )

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
            body: code.current,
        }

        createNewFunction({
            variables: {
                data,
            }
        }).then((res) => {
            Router.push(`/marketplace/function/${res.data.function.id}`)
        });
    }

    return (
        <>
            <Form
                layout='vertical'
                form={form}
            >
                <Form.Item style={{ width: 240 }} label={'Название на торговой площадке'} name='markerplace_name' required={true}>
                    <Input />
                </Form.Item>
                <Form.Item label={'Описание'} name='description' required={true}>
                    <Input.TextArea rows={3} />
                </Form.Item>
                <Form.Item label={'Название функции'} name={"function_name"} required={true}>
                    <Input style={WIDTH_180} />
                </Form.Item>
                <Form.Item label={'Возвращаемый тип'} name={'return_type'}>
                    <Select style={WIDTH_180} defaultValue={TYPES[0]}>
                        {TYPES.map((value) => (<Select.Option value={value}>{value}</Select.Option>))}
                    </Select>
                </Form.Item>
                <span className='ant-form-text'>Аргументы функции</span>
                <Form.List name={'arguments'}>
                    {
                        (fields, { add, remove }) => (
                            <>
                                <PlusCircleOutlined
                                    style={{
                                        fontSize: '16px',
                                        margin: '2px',
                                    }}
                                    onClick={add}
                                />
                                {
                                    fields.length === 0
                                        ? <div><strong>Без аргументов</strong></div>
                                        : fields.map((field, index) => (
                                            <Form.Item noStyle key={field.key}>
                                                <Row>
                                                    <Form.Item style={{ margin: 0}} name={[field.name, 'name']} required={true}>
                                                        <Input style={WIDTH_180} placeholder={'Название аргумента'} />
                                                    </Form.Item>
                                                    <Form.Item style={{ margin: 0}} name={[field.name, 'type']} required={true}>
                                                        <Select style={{ width: 120 }} placeholder={'Тип'}>
                                                            {TYPES.map((value) => (<Select.Option value={value}>{value}</Select.Option>))}
                                                        </Select>
                                                    </Form.Item>
                                                    <MinusCircleOutlined
                                                        style={ICON_STYLE}
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
                <Form.Item label={'Язык'} name='language'>
                    <Select style={WIDTH_180} defaultValue={LANGUAGES[0]} onChange={value => setMode(value.toLowerCase()) }>
                        {LANGUAGES.map((value) => (<Select.Option value={value}>{value}</Select.Option>))}
                    </Select>
                </Form.Item>
            </Form>
            <div>
                <CodeMirrorHack mode={mode} value={code.current} onChange={cm => code.current = cm.getValue()} />
            </div>
            <Button type="primary" style={{ marginTop: 12 }} onClick={create} loading={loading}>{!loading && 'Опубликовать'}</Button>
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
                <PageHeader title={'Добавление новой функции'}/>
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
