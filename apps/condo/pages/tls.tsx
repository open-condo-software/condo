import enAndroid from '@condo/lang/en/pages/tls/android.md'
import enIos from '@condo/lang/en/pages/tls/ios.md'
import enLinux from '@condo/lang/en/pages/tls/linux.md'
import enMacos from '@condo/lang/en/pages/tls/macos.md'
import enWindows from '@condo/lang/en/pages/tls/windows.md'
import ruAndroid from '@condo/lang/ru/pages/tls/android.md'
import ruIos from '@condo/lang/ru/pages/tls/ios.md'
import ruLinux from '@condo/lang/ru/pages/tls/linux.md'
import ruMacos from '@condo/lang/ru/pages/tls/macos.md'
import ruWindows from '@condo/lang/ru/pages/tls/windows.md'
import styled from '@emotion/styled'
import { Anchor, Col, Collapse, Image, Row } from 'antd'
import get from 'lodash/get'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { CSSProperties, useCallback } from 'react'

import { QuestionCircle } from '@open-condo/icons'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { Markdown, Typography } from '@open-condo/ui'
import { Button, Card, Space } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

import EmptyLayout from '@condo/domains/common/components/containers/EmptyLayout'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { Logo } from '@condo/domains/common/components/Logo'
import { Poster } from '@condo/domains/common/components/Poster'
import { antGlobalVariables, fontSizes } from '@condo/domains/common/constants/style'
import { PosterWrapper } from '@condo/domains/user/components/containers/styles'

const LOGO_HEADER_STYLES = { width: '100%', justifyContent: 'space-between' }
const HEADER_LOGO_STYLE: React.CSSProperties = { cursor: 'pointer' }

const guidesContent = {
    ru: {
        windows: ruWindows,
        macos: ruMacos,
        linux: ruLinux,
        android: ruAndroid,
        ios: ruIos,
    },
    en: {
        windows: enWindows,
        macos: enMacos,
        linux: enLinux,
        android: enAndroid,
        ios: enIos,
    },
}

export const Header: React.FC = (): JSX.Element => {
    const intl = useIntl()
    const BackMessage = intl.formatMessage( { id: 'pages.condo.tls.back' })

    const { push } = useRouter()
    const { isAuthenticated } = useAuth()

    const handleLogoClick = useCallback(() => {
        if (isAuthenticated) {
            push('/')
        } else {
            push('/auth/signin')
        }
    }, [isAuthenticated, push])

    return (
        <Row style={LOGO_HEADER_STYLES}>
            <Col style={HEADER_LOGO_STYLE}>
                <Logo onClick={handleLogoClick}/>
            </Col>
            <Col>
                <Typography.Text>
                    <Link href='/auth/signin'>
                        <Typography.Link>{BackMessage}</Typography.Link>
                    </Link>
                </Typography.Text>
            </Col>
        </Row>
    )
}

const CenteredText = styled.div`
    font-size: ${fontSizes.content};
    text-align: center;
`

const PosterFooterSpace = styled(Space)`
    padding: 10px 0 73px;
`

/**
 * Does not adds extra elements around anchor component
 */
const BlankAnchor = styled(Anchor)`
    .ant-anchor-ink {
        display: none;
    }
    .ant-anchor-link {
        padding: 0;
    }
`

type PosterFooterCardProps = {
    logoSrc: string
    description: string
    href: string
    buttonLabel: string
}

const PosterFooterCard: React.FC<PosterFooterCardProps> = ({ logoSrc, description, href, buttonLabel }): JSX.Element => (
    <Card>
        <Space size={24} direction='horizontal'>
            <Image src={logoSrc} preview={false}/>
            <Space size={8} direction='vertical'>
                <Typography.Paragraph>
                    {description}
                </Typography.Paragraph>
                {href[0] === '#' ? (
                    <BlankAnchor affix={false}>
                        <Anchor.Link
                            href={href}
                            title={<Button type='secondary' href={href}>{buttonLabel}</Button>}
                        />
                    </BlankAnchor>
                ) : (
                    <Button type='secondary' href={href}>{buttonLabel}</Button>
                )}
            </Space>
        </Space>
    </Card>
)

const MoreLinkStyle = {
    color: colors.gray[7],
    textDecoration: 'none',
}

const StyledQuestionCircle = styled(QuestionCircle)`
    position: relative;
    top: 3px;
`

const PosterHeader: React.FC = (): JSX.Element => {
    const intl = useIntl()
    const MoreLinkMessage = intl.formatMessage( { id: 'pages.condo.tls.poster.more' })
    return (
        <Space direction='vertical' size={8} align='end'>
            <BlankAnchor affix={false}>
                <Anchor.Link
                    href='#guide'
                    title={
                        <Typography.Text type='secondary' size='medium'>
                            <Typography.Link style={MoreLinkStyle}>{MoreLinkMessage}&nbsp;<StyledQuestionCircle size='small'/></Typography.Link>
                        </Typography.Text>
                    }
                />
            </BlankAnchor>
        </Space>
    )
}

const PosterFooter: React.FC = (): JSX.Element => {
    const intl = useIntl()
    const TitleMessage = intl.formatMessage( { id: 'pages.condo.tls.title' })
    const DescriptionLine1Message = intl.formatMessage({ id: 'pages.condo.tls.description.line1' })
    const DescriptionLine2Message = intl.formatMessage({ id: 'pages.condo.tls.description.line2' })
    const Card1DescriptionMessage = intl.formatMessage({ id: 'pages.condo.tls.poster.card1.description' })
    const Card1CtaMessage = intl.formatMessage({ id: 'pages.condo.tls.poster.card1.cta' })
    const Card2DescriptionMessage = intl.formatMessage({ id: 'pages.condo.tls.poster.card2.description' })
    const Card2CtaMessage = intl.formatMessage({ id: 'pages.condo.tls.poster.card2.cta' })

    const { breakpoints } = useLayoutContext()

    return (
        <Space direction='vertical' align='center' size={8}>
            <PosterFooterSpace direction='vertical' align='center' size={20}>
                <Typography.Title level={2}>
                    {TitleMessage}
                </Typography.Title>
                <CenteredText>
                    <Typography.Paragraph type='secondary'>
                        {DescriptionLine1Message}
                        <br/>
                        {DescriptionLine2Message}
                    </Typography.Paragraph>
                </CenteredText>
            </PosterFooterSpace>
            <Space size={20} direction={breakpoints.DESKTOP_SMALL ? 'horizontal' : 'vertical'}>
                <PosterFooterCard
                    logoSrc='/yandex-browser.png'
                    description={Card1DescriptionMessage}
                    buttonLabel={Card1CtaMessage}
                    href='https://browser.yandex.ru/download'
                />
                <PosterFooterCard
                    logoSrc='/mintsyfry.png'
                    description={Card2DescriptionMessage}
                    buttonLabel={Card2CtaMessage}
                    href='#guide'
                />
            </Space>
        </Space>
    )
}


const IMAGE_STYLE: CSSProperties = { maxWidth: '300px', maxHeight: '300px', height: '100%', width: 'auto' }
const IMAGE_WRAPPER_STYLE: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', maxHeight: '50%' }
const POSTER_CONTENT_STYLE: CSSProperties = { padding: '24px', height: '100%', display: 'flex', flexFlow: 'column', justifyContent: 'space-between' }

const TlsPagePoster: React.FC = (): JSX.Element => (
    <PosterWrapper>
        <Poster
            src='/dino/searching.png'
            placeholderSrc='/404PosterPlaceholder.png'
            imageStyle={IMAGE_STYLE}
            imageWrapperStyle={IMAGE_WRAPPER_STYLE}
            posterContentStyle={POSTER_CONTENT_STYLE}
            Header={<PosterHeader/>}
            Footer={<PosterFooter/>}
        />
    </PosterWrapper>
)

const TextWrapper = styled.div`
  h3 {
    color: ${colors.gray[7]};
  }
`

/**
 * NOTE(antonal): since it is not possible to render raw HTML with current implementation of Markdown (plugin "rehype-raw" seems not to work), a button is represented as a bold link, like `**[label](url)**` and styled as a button
 * NOTE(antonal): with out of the box styles of Typography, markers of `<ol>` elements are positioned as block-level elements, pushing list item content below. That's why custom styles are implemented
 */
const MarkdownWrapper = styled(TextWrapper)`
    img {
        display: block;
        max-width: 627px;
    }
  
    ol {
        padding-left: 0;
        list-style: none;
        position: relative;
        counter-reset: olCounter;
        
        li {
          padding-left: 2ex;
          
          &:before {
            counter-increment: olCounter;
            content: counter(olCounter)".";
            display: inline-block;
            position: absolute;
            left: 0;
          }
          
          &::marker {
            display: none;
          }
        }
    }
  
    strong a {
        display: inline-block;
        border-radius: 8px;
        border: thin solid ${antGlobalVariables['@label-color']};
        box-sizing: border-box;
        height: 48px;
        line-height: 24px;
        padding: 11px 19px !important;
        text-decoration: none;
        margin-bottom: 24px;
    }
`

type TlsPageGuideSectionProps = {
    name: string
}



const TlsPageGuideSection: React.FC<TlsPageGuideSectionProps> = ({ name }): JSX.Element => {
    const intl = useIntl()
    return (
        <MarkdownWrapper>
            <Markdown>
                {get(guidesContent, [intl.locale, name])}
            </Markdown>
        </MarkdownWrapper>
    )
}

const StyledCollapse = styled(Collapse)`
    background: none;
  
    .ant-collapse-header {
        padding: 24px;

        .ant-collapse-expand-icon {
            order: 2;

            > .ant-collapse-arrow {
                margin-right: 0 !important;
            }
        }
    }
`

const TlsPageGuide: React.FC = (): JSX.Element => {
    const intl = useIntl()
    const TitleMessage = intl.formatMessage( { id: 'pages.condo.tls.guide.title' })
    const DescriptionMessage = intl.formatMessage( { id: 'pages.condo.tls.guide.description' })
    const SectionWindowsTitle = intl.formatMessage( { id: 'pages.condo.tls.guide.section.windows.title' })
    const SectionMacosTitle = intl.formatMessage( { id: 'pages.condo.tls.guide.section.macos.title' })
    const SectionLinuxTitle = intl.formatMessage( { id: 'pages.condo.tls.guide.section.linux.title' })
    const SectionAndroidTitle = intl.formatMessage( { id: 'pages.condo.tls.guide.section.android.title' })
    const SectionIosTitle = intl.formatMessage( { id: 'pages.condo.tls.guide.section.ios.title' })

    return (
        <div id='guide'>
            <Space direction='vertical' size={20}>
                <Typography.Title level={2}>
                    {TitleMessage}
                </Typography.Title>
                <Typography.Text type='secondary'>
                    {DescriptionMessage}
                </Typography.Text>
                <StyledCollapse style={{ width: '100%' }}>
                    <Collapse.Panel key='windows' header={<Typography.Title level={3}>{SectionWindowsTitle}</Typography.Title>}>
                        <TlsPageGuideSection name='windows'/>
                    </Collapse.Panel>
                    <Collapse.Panel key='macos' header={<Typography.Title level={3}>{SectionMacosTitle}</Typography.Title>}>
                        <TlsPageGuideSection name='macos'/>
                    </Collapse.Panel>
                    <Collapse.Panel key='linux' header={<Typography.Title level={3}>{SectionLinuxTitle}</Typography.Title>}>
                        <TlsPageGuideSection name='linux'/>
                    </Collapse.Panel>
                    <Collapse.Panel key='android' header={<Typography.Title level={3}>{SectionAndroidTitle}</Typography.Title>}>
                        <TlsPageGuideSection name='android'/>
                    </Collapse.Panel>
                    <Collapse.Panel key='ios' header={<Typography.Title level={3}>{SectionIosTitle}</Typography.Title>}>
                        <TlsPageGuideSection name='ios'/>
                    </Collapse.Panel>
                </StyledCollapse>
            </Space>
        </div>
    )
}

const TlsPageEpilog: React.FC = (): JSX.Element => {
    const intl = useIntl()
    const EpilogTitle = intl.formatMessage({ id: 'pages.condo.tls.epilog.title' })
    const EpilogDescription = intl.formatMessage({ id: 'pages.condo.tls.epilog.description' })

    return (
        <TextWrapper>
            <Space direction='vertical' size={16}>
                <Typography.Title level={3}>
                    {EpilogTitle}
                </Typography.Title>
                <Typography.Paragraph type='secondary'>
                    {EpilogDescription}
                </Typography.Paragraph>
            </Space>
        </TextWrapper>
    )
}

function TlsPage (): React.ReactElement {
    return (
        <Space direction='vertical' size={20}>
            <Header/>
            <Space direction='vertical' size={60}>
                <TlsPagePoster/>
                <TlsPageGuide/>
                <TlsPageEpilog/>
            </Space>
        </Space>
    )
}

TlsPage.container = (props) => (
    <EmptyLayout
        {...props}
        style={{ height: 'auto', padding: '60px', background: 'white' }}
    />
)


export default TlsPage
