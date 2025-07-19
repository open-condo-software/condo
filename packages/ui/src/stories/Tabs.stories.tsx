import React from 'react'

import { FileText } from '@open-condo/icons'
import { Tabs, Typography, Radio, RadioGroup } from '@open-condo/ui/src'
import type { TabItem } from '@open-condo/ui/src'

import type { Meta, StoryObj } from '@storybook/react-webpack5'

export default {
    title: 'Components/Tabs',
    component: Tabs,
    args: {
        centered: false,
        tabBarExtraContent: false,
    },
    argTypes: {
        tabBarExtraContent: {
            control: 'boolean',
            description: 'Toggle to show/hide tabBarExtraContent',
        },
    },
} as Meta<typeof Tabs>

const simpleItems: Array<TabItem> = [
    {
        key: 'tab',
        label: 'Some tab',
        children: (
            <Typography.Paragraph>
        Modern web design involves creating websites that are responsive,
        visually appealing, user-friendly, and have great functionality. It
        includes the use of advanced technologies to deliver an immersive user
        experience, such as HTML5, CSS3, JavaScript, and responsive frameworks,
        to mention a few. Furthermore, there is an emphasis on creating websites
        that load quickly and efficiently. Modern web design principles focus on
        clean typography, minimalist design, high-quality imagery, and intuitive
        navigation, making the website easy to use and understand. Overall,
        modern web design focuses on creating an engaging website that
        effectively communicates a brand&apos;s message while meeting the
        requirements of the user.
            </Typography.Paragraph>
        ),
    },
    {
        key: 'another',
        label: 'Another tab',
        children: (
            <Typography.Paragraph>
        Probability theory is a fascinating subject that helps you make sense of
        the world around you! It allows you to evaluate and quantify risk, make
        informed decisions, and understand the likelihood of different events
        occurring. With probability theory, you can analyze scientific data,
        make accurate financial predictions, and dabble in the world of
        gambling. Whether you&apos;re a student, a professional, or simply
        looking to expand your knowledge, learning probability theory is an
        incredibly valuable skill that can benefit you in countless ways.
            </Typography.Paragraph>
        ),
    },
    {
        key: 'disabled',
        label: 'Disabled tab',
        disabled: true,
    },
    {
        key: 'with-icon',
        label: 'Tab with icon',
        children: (
            <Typography.Paragraph>
        Introducing the new UI components of the Open-Condo system - designed to
        meet the needs of modern web development. Our team has put a lot of
        effort into developing a comprehensive library of UI components, aimed
        at simplifying the development process and improving the functionality
        of web applications. With Open-Condo UI components, developers can
        seamlessly integrate essential elements such as buttons, navigation
        bars, and form fields, with greater ease and efficiency. The
        Open-Condo&apos;s UI components are also customizable and provide
        complete flexibility for designers to customize through CSS.
        Furthermore, the system has been designed to adapt to different screen
        sizes and resolutions, ensuring that your web application is accessible
        on multiple devices. Be sure to check out the new UI components in
        Open-Condo to make your web development work easier and more efficient.
            </Typography.Paragraph>
        ),
        icon: <FileText size='auto' />,
    },
    {
        key: 'long',
        label: 'Extra long tab name',
        children: (
            <Typography.Paragraph>
        Once upon a time there was a dinosaur called Archie. Archie was not like
        all the other dinosaurs, he was extraordinarily beautiful! His green
        scales were brighter than the leaves in the forest in springtime. His
        eyes were sparkling like glitter, and when he opened his wide mouth,
        shiny white teeth were visible. Archie liked to live in the backwoods,
        where the sunlight filtered through the green crown of the trees. Most
        of all, he liked to bask in the sun and hold his head high to get plenty
        of vitamin D. All the animals that came his way looked at him with
        wonder and admiration. They knew that no one had ever seen such a
        beautiful dinosaur. Archie, on the other hand, was proud of his beauty
        and enjoyed every minute of his life. Then one day, Archie heard that a
        little dinosaur was in trouble. This little guy was stuck in a thick
        bush, and no one could help him. Archie didn&apos;t hesitate and rushed
        to help. When he ran to the spot, he immediately knew how to help him.
        He gently pulled the baby out of the bushes, and brought it to its mum.
        The dinosaur&apos;s mum was extremely grateful, and thanked Archie with
        honey. And from that day on, all the animals in the forest began to
        appreciate Archie&apos;s beauty, not only for his looks, but also for
        what a wonderful friend and protector he was. Archie continued to live
        in his beloved forest, enjoying life and his beauty, and was always
        ready to help anyone who needed him.
            </Typography.Paragraph>
        ),
    },
]

const Template: StoryObj<typeof Tabs>['render'] = (args) => {
    const { tabBarExtraContent, items } = args

    const extraContent = tabBarExtraContent ? (
        <RadioGroup optionType='button' defaultValue='on'>
            <Radio key='on' value='on' label='On' />
            <Radio key='off' value='off' label='Off' />
        </RadioGroup>
    ) : null

    return <Tabs items={items} tabBarExtraContent={extraContent} />
}

export const Simple: StoryObj<typeof Tabs> = {
    render: Template,
    args: {
        tabBarExtraContent: false,
        items: simpleItems,
    },
}

export const WithExtraContent: StoryObj<typeof Tabs> = {
    render: Template,
    args: {
        tabBarExtraContent: true,
        items: [simpleItems[0], simpleItems[1]],
    },
}
