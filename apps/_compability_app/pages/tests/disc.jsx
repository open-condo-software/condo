import * as React from "react"
import {
    Row,
    Col,
    Form,
    Radio,
    List,
    Button,
    Divider,
} from 'antd'

import { AuthLayout, BaseLayout } from '../../containers'
import Translate from '../../components/Translate'

function DiscTest () {
    const [form] = Form.useForm()
    const [disc_data, setDiscData] = React.useState([])
    const [isLoading, setIsLoading] = React.useState(false)
    const onFinish = values => {
        setIsLoading(true)
        setTimeout(() => {
            setIsLoading(false)
        }, 1000);
    }

    prepareTestData().then(data => setDiscData(data))

    if (!disc_data.length) {
        return <Translate id={"tests.DataFetching"}/>;
    }

    return (
        <div>
            <Divider orientation="left">Тест DISC</Divider>
            <Form
                layout="vertical"
                form={form}
                name="disc_test_form"
                onFinish={onFinish}
            >
                <List
                    bordered
                    footer={
                        <Button type="primary" htmlType="submit" loading={isLoading}>
                            "Проверить"
                        </Button>
                    }
                    dataSource={disc_data}
                    renderItem={(question, question_index) => (
                        <List.Item key={question_index}>
                            <Row gutter={8}>
                                <Col span={24}>
                                    <Form.Item
                                        name={`disc_${question_index}`}
                                        label={<Translate id={`tests.disc.${question_index}.title`}/>}
                                        rules={[{ required: true }]}
                                    >
                                        <Radio.Group>
                                            {question.options.map((option, option_index) => (
                                                <Radio
                                                    style={{
                                                        display: 'block',
                                                        lineHeight: '30px',
                                                        whiteSpace: 'normal',
                                                    }}
                                                    value={option_index}
                                                    key={`${question_index + option_index}`}
                                                >
                                                    {<Translate id={`tests.disc.${question_index}.options.${option_index}`}/>}
                                                </Radio>
                                            ))}
                                        </Radio.Group>
                                    </Form.Item>
                                </Col>
                            </Row>
                        </List.Item>
                    )}
                />
            </Form>
        </div>
    )
}

function prepareTestData () {
    return import("../../lang/ru.json").then(data => data.default.tests.disc)
}

function CustomContainer ({children, ...rest_props}) {
    return (
        <BaseLayout
            {...rest_props}
            logo="topMenu"
            sideMenuStyle={{ display: 'none' }}
            mainContentWrapperStyle={{ maxWidth: '1024px', minWidth: '490px', paddingTop: '20px', margin: '0 auto' }}
            mainContentBreadcrumbStyle={{ display: 'none' }}
        >
            <AuthLayout>
                {children}
            </AuthLayout>
        </BaseLayout>
    )
}

DiscTest.container = CustomContainer

export default DiscTest
