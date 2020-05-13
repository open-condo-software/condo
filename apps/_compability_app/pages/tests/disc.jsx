import * as React from "react"
import {
    Row,
    Col,
    Form,
    Radio,
    List,
    Button,
    Divider,
} from 'antd';

import { useIntl } from '../../lib/intl'
import { AuthLayout, BaseLayout } from '../../containers'

function prepareTestData () {
    return import("../../lang/ru.json").then(data => {
        return data.default.tests.disc
    })
}

function DiscTest () {
    const intl = useIntl();
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
        return <>"...Loading"</>;
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
                                        label={intl.formatMessage({ id: `tests.disc.${question_index}.title` })}
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
                                                    {intl.formatMessage({ id: `tests.disc.${question_index}.options.${option_index}` })}
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

function CustomContainer (props) {
    return (
        <AuthLayout>
            <BaseLayout
                {...props}
                logo="topMenu"
                sideMenuStyle={{ display: 'none' }}
                mainContentWrapperStyle={{ maxWidth: '1024px', minWidth: '490px', paddingTop: '50px', margin: '0 auto' }}
                mainContentBreadcrumbStyle={{ display: 'none' }}
            />
        </AuthLayout>
    )
}

DiscTest.container = CustomContainer

export default DiscTest
