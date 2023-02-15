import { ComponentStory, ComponentMeta } from '@storybook/react'
import React from 'react'

import type { IconProps } from '@open-condo/icons'
import * as AllIcons from '@open-condo/icons'
import { Space } from '@open-condo/ui/src'
import { Typography } from '@open-condo/ui/src'

type IconBlockProps = {
    name: string
    icon: React.FunctionComponent<IconProps>
    iconProps: IconProps
}

const IconBlock: React.FC<IconBlockProps> = ({ name, icon, iconProps }) => {
    const Icon = icon

    return (
        <Space direction='vertical' size={8} align='center' width={120}>
            <div style={{ fontSize: 32 }}>
                <Icon {...iconProps}/>
            </div>
            <Typography.Text type='secondary' size='small'>
                {name}
            </Typography.Text>
        </Space>
    )
}

const IconsStory: React.FC<IconProps> = (props) => {
    return (
        <Space direction='horizontal' wrap size={[20, 40]}>
            {Object.entries(AllIcons).map(([key, value]) => (
                <IconBlock key={key} name={key} icon={value} iconProps={props}/>
            ))}
        </Space>
    )
}

export default {
    title: 'Icons',
    component: IconsStory,
    args: {
        size: 'auto',
        color: 'currentcolor',
    },
    argTypes: {
        size: {
            control: 'select',
            options: ['auto', 'large', 'medium', 'small'],
        },
        color: { control: 'color' },
    },
} as ComponentMeta<typeof IconsStory>

const Template: ComponentStory<typeof IconsStory> = (args) => <IconsStory {...args}/>
export const Icons = Template.bind({})
