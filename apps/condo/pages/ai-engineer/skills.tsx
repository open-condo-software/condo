import { AiSkillScopeType } from '@app/condo/schema'
import { Col, Image, Row, RowProps } from 'antd'
import { useRouter } from 'next/router'
import React, { CSSProperties, useCallback, useEffect, useMemo, useState } from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Alert, Button, Card, Modal, Space, Tag, Typography } from '@open-condo/ui'

import { CoworkLayout } from '@condo/domains/ai/components/Cowork'
import { useObjects as useAISkillObjects } from '@condo/domains/ai/utils/clientSchema/AISkill'
import { PageContent, PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { UI_AI_COWORK_SKILLS } from '@condo/domains/common/constants/featureflags'
import { useContainerSize } from '@condo/domains/common/hooks/useContainerSize'
import { PageComponentType } from '@condo/domains/common/types'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'


const FALLBACK_IMAGE_URL = '/homeWithSun.svg'

const MIN_CARD_WIDTH = 250
const CARD_GAP = 40
const CARD_GUTTER: RowProps['gutter'] = [CARD_GAP, CARD_GAP]
const IMAGE_STYLES: CSSProperties = { objectFit: 'contain', height: 60 }
const CARD_TITLE_STYLES: CSSProperties = { display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: 60 }
const SCOPE_LABELS: Record<AiSkillScopeType, string> = {
    [AiSkillScopeType.Global]: 'ai.cowork.skills.scope.global',
    [AiSkillScopeType.Organization]: 'ai.cowork.skills.scope.organization',
    [AiSkillScopeType.Personal]: 'ai.cowork.skills.scope.personal',
}

const getCardsAmount = (width: number) => Math.max(1, Math.floor(width / (MIN_CARD_WIDTH + CARD_GAP)))

const CoworkSkillsPage: PageComponentType = () => {
    const intl = useIntl()
    const router = useRouter()
    const { useFlag } = useFeatureFlags()
    const skillsEnabled = useFlag(UI_AI_COWORK_SKILLS)
    const { user } = useAuth()
    const { organization } = useOrganization()

    const titleLabel = intl.formatMessage({ id: 'ai.cowork.skills' })
    const runLabel = intl.formatMessage({ id: 'ai.cowork.skills.run' })
    const examplesLabel = intl.formatMessage({ id: 'ai.cowork.skills.examples' })
    const emptyLabel = intl.formatMessage({ id: 'ai.cowork.skills.empty' })
    const subtitleMessage = intl.formatMessage({ id: 'ai.cowork.skills.subtitle.message' })
    const subtitleDescription = intl.formatMessage({ id: 'ai.cowork.skills.subtitle.description' })

    const organizationId = useMemo(() => organization?.id, [organization])
    const userId = useMemo(() => user?.id, [user])

    const { objs: skills, loading } = useAISkillObjects({
        where: {
            OR: [
                { scope: AiSkillScopeType.Global },
                { scope: AiSkillScopeType.Organization, organization: { id: organizationId } },
                { scope: AiSkillScopeType.Personal, user: { id: userId } },
            ],
            deletedAt: null,
        },
    }, {
        skip: !organizationId,
    })

    const [{ width: cardGridWidth }, cardGridRef] = useContainerSize<HTMLDivElement>()
    const cardsPerRow = getCardsAmount(cardGridWidth)

    const [detailSkill, setDetailSkill] = useState<typeof skills[number] | null>(null)

    const handleRun = useCallback((skill: typeof skills[number]) => {
        const examples = Array.isArray(skill.examples) ? skill.examples : []
        const prompt = examples.length > 0 ? examples[0] : skill.description
        void router.push({
            pathname: '/ai-engineer/chat',
            query: { skillId: skill.id, prompt },
        })
    }, [router])

    useEffect(() => {
        if (!skillsEnabled) void router.replace('/ai-engineer')
    }, [skillsEnabled, router])

    if (!skillsEnabled) return null

    return (
        <PageWrapper>
            <PageContent>
                <PageHeader
                    title={<Typography.Title>{titleLabel}</Typography.Title>}
                />
                <Alert
                    type='info'
                    showIcon
                    message={subtitleMessage}
                    description={subtitleDescription}
                />
                {loading && <Typography.Text type='secondary'>...</Typography.Text>}
                {!loading && skills.length === 0 && (
                    <Typography.Text type='secondary'>{emptyLabel}</Typography.Text>
                )}
                <div style={{ marginTop: 24 }}>
                    <Row gutter={CARD_GUTTER} ref={cardGridRef}>
                        {skills.map((skill) => {
                            const scopeLabel = intl.formatMessage({ id: SCOPE_LABELS[skill.scope] as FormatjsIntl.Message['ids'] })
                            return (
                                <Col span={24 / cardsPerRow} key={`${cardsPerRow}:${skill.id}`}>
                                    <Card
                                        hoverable
                                        bodyPadding={20}
                                        titlePadding='32px 40px'
                                        onClick={() => setDetailSkill(skill)}
                                        title={
                                            <div style={CARD_TITLE_STYLES}>
                                                <Image
                                                    src={skill.image?.publicUrl || FALLBACK_IMAGE_URL}
                                                    fallback={FALLBACK_IMAGE_URL}
                                                    preview={false}
                                                    style={IMAGE_STYLES}
                                                    draggable={false}
                                                />
                                            </div>
                                        }
                                    >
                                        <Space direction='vertical' size={16} width='100%'>
                                            <Space direction='vertical' size={8} width='100%' height={100}>
                                                <Typography.Title level={4} ellipsis={{ rows: 2 }}>{skill.name}</Typography.Title>
                                                <Typography.Paragraph size='medium' type='secondary' ellipsis={{ rows: 2 }}>
                                                    {skill.description}
                                                </Typography.Paragraph>
                                            </Space>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', borderTop: '1px solid var(--condo-global-color-gray-3)', paddingTop: 8 }}>
                                                {skill.b2bApp && skill.b2bApp.logo?.publicUrl && (
                                                    <Image
                                                        src={skill.b2bApp.logo.publicUrl}
                                                        fallback={FALLBACK_IMAGE_URL}
                                                        preview={false}
                                                        style={{ objectFit: 'contain', height: 16, width: 16 }}
                                                        draggable={false}
                                                    />
                                                )}
                                                {skill.b2bApp ? (
                                                    <Typography.Link
                                                        size='small'
                                                        href={`/miniapps/${skill.b2bApp.id}`}
                                                        target='_blank'
                                                        rel='noreferrer'
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        {skill.b2bApp.name}
                                                    </Typography.Link>
                                                ) : (
                                                    <Typography.Text size='small' type='secondary'>{scopeLabel}</Typography.Text>
                                                )}
                                            </div>
                                            <Button
                                                type='secondary'
                                                block
                                                onClick={(e) => { e.stopPropagation(); handleRun(skill) }}
                                            >
                                                {runLabel}
                                            </Button>
                                        </Space>
                                    </Card>
                                </Col>
                            )
                        })}
                    </Row>
                </div>
            </PageContent>
            <Modal
                open={Boolean(detailSkill)}
                onCancel={() => setDetailSkill(null)}
                width='big'
                footer={null}
            >
                {detailSkill && (
                    <Space direction='vertical' size={20} width='100%'>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                            <Image
                                src={detailSkill.image?.publicUrl || FALLBACK_IMAGE_URL}
                                fallback={FALLBACK_IMAGE_URL}
                                preview={false}
                                style={{ objectFit: 'contain', height: 180 }}
                                draggable={false}
                            />
                        </div>
                        <Typography.Title level={3}>{detailSkill.name}</Typography.Title>
                        <Typography.Paragraph size='large' type='secondary'>
                            {detailSkill.description}
                        </Typography.Paragraph>
                        {Array.isArray(detailSkill.examples) && detailSkill.examples.length > 0 && (
                            <Space direction='vertical' size={8} width='100%'>
                                <Typography.Text type='secondary' size='small'>{examplesLabel}</Typography.Text>
                                <Space direction='horizontal' size={8} wrap>
                                    {detailSkill.examples.map((example, idx) => (
                                        <Tag key={idx} textColor='#5F5F5F' bgColor='#F5F5F5'>
                                            {example}
                                        </Tag>
                                    ))}
                                </Space>
                            </Space>
                        )}
                        {detailSkill.b2bApp ? (
                            <Space direction='horizontal' size={8} align='center'>
                                {detailSkill.b2bApp.logo?.publicUrl && (
                                    <Image
                                        src={detailSkill.b2bApp.logo.publicUrl}
                                        fallback={FALLBACK_IMAGE_URL}
                                        preview={false}
                                        style={{ objectFit: 'contain', height: 20, width: 20 }}
                                        draggable={false}
                                    />
                                )}
                                <Typography.Link
                                    href={`/miniapps/${detailSkill.b2bApp.id}`}
                                    target='_blank'
                                    rel='noreferrer'
                                >
                                    {detailSkill.b2bApp.name}
                                </Typography.Link>
                            </Space>
                        ) : (
                            <Typography.Text type='secondary'>
                                {intl.formatMessage({ id: SCOPE_LABELS[detailSkill.scope] as FormatjsIntl.Message['ids'] })}
                            </Typography.Text>
                        )}
                        <Button
                            type='primary'
                            size='large'
                            block
                            onClick={() => handleRun(detailSkill)}
                        >
                            {runLabel}
                        </Button>
                    </Space>
                )}
            </Modal>
        </PageWrapper>
    )
}

CoworkSkillsPage.requiredAccess = OrganizationRequired
CoworkSkillsPage.container = CoworkLayout

export default CoworkSkillsPage
