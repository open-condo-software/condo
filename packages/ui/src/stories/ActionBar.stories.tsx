import { ComponentStory, ComponentMeta } from '@storybook/react'
import { Col, Row } from 'antd'
import React from 'react'

import { ActionBar as Component, Button, Typography } from '@open-condo/ui/src'

import { colors } from '../colors'

export default {
    title: 'Components/ActionBar',
    component: Component,
    argTypes: {
        message: { control: 'text' },
        actions: { control: false },
    },
} as ComponentMeta<typeof Component>

const Template: ComponentStory<typeof Component> = (args) => {
    return (
        <Row style={{ height: '120vh' }}>
            <Col span={24} style={{
                height: '120vh', backgroundColor: colors.gray[3], display: 'flex', alignItems: 'center',
                justifyContent: 'center', borderRadius: '8px', overflow: 'hidden',
            }}>
                <Typography.Title>Content</Typography.Title>
            </Col>
            <Col span={24}>
                <Component {...args}/>
            </Col>
        </Row>
    )
}

export const Simple = Template.bind({})
Simple.args = {
    actions: [
        <Button type='primary' key='1'>Save</Button>,
        <Button type='secondary' key='2'>Cancel</Button>,
    ],
}

export const WithMessage = Template.bind({})
WithMessage.args = {
    message: 'Action bar message',
    actions: [
        <Button type='primary' key='1'>Save</Button>,
        <Button type='secondary' key='2'>Cancel</Button>,
    ],
}