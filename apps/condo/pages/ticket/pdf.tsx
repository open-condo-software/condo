import React, { createRef, forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Typography, notification } from 'antd'
import dynamic from 'next/dynamic'
import get from 'lodash/get'
import { IntlShape } from '@formatjs/intl'
import dayjs from 'dayjs'

import { useIntl } from '@open-condo/next/intl'
import { Ticket as ITicket, TicketComment as ITicketComment } from '@app/condo/schema'

import { PageContent } from '@condo/domains/common/components/containers/BaseLayout'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { HtmlToPdf } from '@condo/domains/common/utils/htmlToPdf'
import { Ticket, TicketComment } from '@condo/domains/ticket/utils/clientSchema'
import { ParametersType } from '@condo/domains/ticket/hooks/useTicketExportToPdfTask'
import { getFullAddressByTicket } from '@condo/domains/ticket/utils/helpers'
import { MAX_TICKET_BLANKS_EXPORT } from '@condo/domains/ticket/constants/export'
import { colors } from '@condo/domains/common/constants/style'
import { useQueryParams } from '@condo/domains/common/hooks/useQueryParams'
import { DOMAIcon } from '@condo/domains/common/components/icons/DOMAIcon'


type BlockRefsType = {
    blocksRefs: React.MutableRefObject<HTMLDivElement>[]
    headerRef: React.MutableRefObject<HTMLDivElement>
    footerRef: React.MutableRefObject<HTMLDivElement>
}

type TextStyleKeys = 'MAIN_TITLE' | 'SECOND_TITLE' | 'SUBTITLE' | 'TEXT_SIZE_14' | 'TEXT_SIZE_12' | 'TEXT_SIZE_13' | 'TEXT_SIZE_11'


const RESOLUTION_MULTIPLIER = 1

const GREY_7 = '#707695'
const LIGHT_GREY = '#E1E5ED'
const BLACK = colors.black

const BLOCK_COMMON_STYLE: React.CSSProperties = {
    width: '100%',
    paddingLeft: 24 * RESOLUTION_MULTIPLIER,
    paddingRight: 24 * RESOLUTION_MULTIPLIER,
}
const TEXT_STYLES: Record<TextStyleKeys, React.CSSProperties> = {
    MAIN_TITLE: { fontSize: 24 * RESOLUTION_MULTIPLIER, lineHeight: `${32 * RESOLUTION_MULTIPLIER}px`, fontWeight: 700 },
    SECOND_TITLE: { fontSize: 16 * RESOLUTION_MULTIPLIER, lineHeight: `${24 * RESOLUTION_MULTIPLIER}px`, fontWeight: 600 },
    TEXT_SIZE_11: { fontSize: 11 * RESOLUTION_MULTIPLIER, lineHeight: `${15 * RESOLUTION_MULTIPLIER}px`, fontWeight: 600 },
    SUBTITLE: { fontSize: 11 * RESOLUTION_MULTIPLIER, lineHeight: `${20 * RESOLUTION_MULTIPLIER}px`, fontWeight: 600, color: GREY_7 },
    TEXT_SIZE_12: { fontSize: 12 * RESOLUTION_MULTIPLIER, lineHeight: `${18 * RESOLUTION_MULTIPLIER}px`, fontWeight: 400 },
    TEXT_SIZE_13: { fontSize: 13 * RESOLUTION_MULTIPLIER, lineHeight: `${20 * RESOLUTION_MULTIPLIER}px`, fontWeight: 400 },
    TEXT_SIZE_14: { fontSize: 14 * RESOLUTION_MULTIPLIER, lineHeight: `${22 * RESOLUTION_MULTIPLIER}px`, fontWeight: 400 },
}

const COMMENT_DAYTIME_FORMAT = 'DD.MM.YYYY, HH:mm'
const COMMON_DATE_FORMAT = 'DD.MM.YYYY'


const SPLIT_BLOCK_STYLE = { width: RESOLUTION_MULTIPLIER, height: 934 * RESOLUTION_MULTIPLIER, backgroundColor: LIGHT_GREY }

const SplitBlock = forwardRef<HTMLDivElement>((props, ref) => {
    return (
        <div style={SPLIT_BLOCK_STYLE} ref={ref} />
    )
})
SplitBlock.displayName = 'SplitBlock'

const TICKET_ORGANIZATION_BLOCK_STYLE = { ...BLOCK_COMMON_STYLE, display: 'flex', justifyContent: 'space-between' }
const TICKET_NUMBER_STYLE = { ...TEXT_STYLES.MAIN_TITLE, width: 450 * RESOLUTION_MULTIPLIER }
const ORGANIZATION_NAME_STYLE: React.CSSProperties = { ...TEXT_STYLES.SECOND_TITLE, color: GREY_7, textAlign: 'end' }

type TicketAndOrganizationBlockPropsType = { organizationName: string, ticketNumber: string }

const TicketAndOrganizationBlock = forwardRef<HTMLDivElement, TicketAndOrganizationBlockPropsType>(({ organizationName, ticketNumber }, ref) => {
    const intl = useIntl()
    const ticketMessage = intl.formatMessage({ id: 'ticketBlankExport.label.ticket' })

    return (
        <div style={TICKET_ORGANIZATION_BLOCK_STYLE} ref={ref}>
            <Typography.Title level={3} style={TICKET_NUMBER_STYLE}>{ticketMessage} №{ticketNumber}</Typography.Title>
            <Typography.Text style={ORGANIZATION_NAME_STYLE}>
                {organizationName}
            </Typography.Text>
        </div>
    )
})
TicketAndOrganizationBlock.displayName = 'TicketAndOrganizationBlock'

const ADDRESS_BLOCK_STYLE: React.CSSProperties = { ...BLOCK_COMMON_STYLE, display: 'flex', flexDirection: 'column', gap: 4 * RESOLUTION_MULTIPLIER }

type AddressBlockPropsType = { address: string }

const AddressBlock = forwardRef<HTMLDivElement, AddressBlockPropsType>(({ address }, ref) => {
    const intl = useIntl()
    const AddressTitle = intl.formatMessage({ id: 'ticketBlankExport.heading.address' })

    return (
        <div style={ADDRESS_BLOCK_STYLE} ref={ref}>
            <Typography.Title level={5} style={TEXT_STYLES.SUBTITLE}>
                {AddressTitle}
            </Typography.Title>
            <Typography.Text style={TEXT_STYLES.TEXT_SIZE_14}>
                {address}
            </Typography.Text>
        </div>
    )
})
AddressBlock.displayName = 'AddressBlock'

const CLIENT_BLOCK_STYLE: React.CSSProperties = { ...BLOCK_COMMON_STYLE, display: 'flex', flexDirection: 'column', gap: 4 * RESOLUTION_MULTIPLIER }
const CLIENT_CONTENT_WRAPPER_STYLE = { display: 'flex', justifyContent: 'space-between' }
const CLIENT_PHONE_STYLE: React.CSSProperties = { ...TEXT_STYLES.TEXT_SIZE_14, width: 175 * RESOLUTION_MULTIPLIER, textAlign: 'end' }

type ClientBlockPropsType = { clientName: string, clientPhone: string }

const ClientBlock = forwardRef<HTMLDivElement, ClientBlockPropsType>(({ clientName, clientPhone }, ref) => {
    const intl = useIntl()
    const ClientNameTitle = intl.formatMessage({ id: 'ticketBlankExport.heading.clientName' })

    return (
        <div style={CLIENT_BLOCK_STYLE} ref={ref}>
            <Typography.Title level={5} style={TEXT_STYLES.SUBTITLE}>
                {ClientNameTitle}
            </Typography.Title>
            <div style={CLIENT_CONTENT_WRAPPER_STYLE}>
                <Typography.Text style={TEXT_STYLES.TEXT_SIZE_14}>
                    {clientName}
                </Typography.Text>
                <Typography.Text style={CLIENT_PHONE_STYLE}>
                    {clientPhone}
                </Typography.Text>
            </div>
        </div>
    )
})
ClientBlock.displayName = 'ClientBlock'

const DETAILS_BLOCK_STYLE: React.CSSProperties = { ...BLOCK_COMMON_STYLE, display: 'flex', flexDirection: 'column', gap: 4 * RESOLUTION_MULTIPLIER }

type DetailsBlockPropsType = { details: string }

const DetailsBlock = forwardRef<HTMLDivElement, DetailsBlockPropsType>(({ details }, ref) => {
    const intl = useIntl()
    const DetailsTitle = intl.formatMessage({ id: 'ticketBlankExport.heading.details' })

    return (
        <div style={DETAILS_BLOCK_STYLE} ref={ref}>
            <Typography.Title level={5} style={TEXT_STYLES.SUBTITLE}>
                {DetailsTitle}
            </Typography.Title>
            <Typography.Text style={TEXT_STYLES.TEXT_SIZE_12}>
                {details}
            </Typography.Text>
        </div>
    )
})
DetailsBlock.displayName = 'DetailsBlock'

const COMMENTS_SUBTITLE_BLOCK_STYLE = { ...BLOCK_COMMON_STYLE, paddingBottom: 12 * RESOLUTION_MULTIPLIER }

const CommentsSubtitleBlock = forwardRef<HTMLDivElement>((props, ref) => {
    const intl = useIntl()
    const CommentsTitle = intl.formatMessage({ id: 'ticketBlankExport.heading.comments' })

    return (
        <div style={COMMENTS_SUBTITLE_BLOCK_STYLE} ref={ref}>
            <Typography.Title level={5} style={TEXT_STYLES.SUBTITLE}>
                {CommentsTitle}
            </Typography.Title>
        </div>
    )
})
CommentsSubtitleBlock.displayName = 'CommentsSubtitleBlock'

type CommentBlockPropsType = { content: string, createdAt: string }

const CommentBlock = forwardRef<HTMLDivElement, CommentBlockPropsType>(({ content, createdAt }, ref) => {
    return (
        <div style={BLOCK_COMMON_STYLE} ref={ref}>
            <Typography.Title level={5} style={TEXT_STYLES.TEXT_SIZE_12}>
                {createdAt} {content}
            </Typography.Title>
        </div>
    )
})
CommentBlock.displayName = 'CommentBlock'

const EMPTY_LINES_BLOCK_STYLE: React.CSSProperties = { ...BLOCK_COMMON_STYLE, display: 'flex', flexDirection: 'column' }
const EMPTY_LINES_WRAPPER_STYLE: React.CSSProperties = { display: 'flex', flexDirection: 'column' }
const EMPTY_LINE_STYLE = { width: '100%', height: RESOLUTION_MULTIPLIER, backgroundColor: GREY_7, marginTop: 18 * RESOLUTION_MULTIPLIER }

type EmptyLinesBlockPropsType = { title: string, countLine: number }

const EmptyLinesBlock = forwardRef<HTMLDivElement, EmptyLinesBlockPropsType>(({ title, countLine }, ref) => {
    return (
        <div style={EMPTY_LINES_BLOCK_STYLE} ref={ref}>
            <Typography.Title level={5} style={TEXT_STYLES.SUBTITLE}>
                {title}
            </Typography.Title>
            <div style={EMPTY_LINES_WRAPPER_STYLE}>
                {new Array(countLine).fill(1).map((_, index) => (
                    <div key={index} style={EMPTY_LINE_STYLE} />
                ))}
            </div>
        </div>
    )
})
EmptyLinesBlock.displayName = 'EmptyLinesBlock'

type TextBlockPropsType = { text: string }

const TextBlock = forwardRef<HTMLDivElement, TextBlockPropsType>(({ text }, ref) => {
    return (
        <div style={BLOCK_COMMON_STYLE} ref={ref}>
            <Typography.Text style={TEXT_STYLES.TEXT_SIZE_13}>
                {text}
            </Typography.Text>
        </div>
    )
})
TextBlock.displayName = 'TextBlock'

type EmptyBlockPropsType = { height: number }

const EmptyBlock = forwardRef<HTMLDivElement, EmptyBlockPropsType>(({ height = 16 }, ref) => {
    const style = useMemo(() => ({ ...BLOCK_COMMON_STYLE, height: height * RESOLUTION_MULTIPLIER }), [height])

    return (
        <div style={style} ref={ref} />
    )
})
EmptyBlock.displayName = 'EmptyBlock'

const SIGNATURE_LINE_WRAPPER_STYLE = { width: '100%', paddingTop: 32 * RESOLUTION_MULTIPLIER }
const SIGNATURE_LINE_STYLE = { width: '100%', height: RESOLUTION_MULTIPLIER, backgroundColor: BLACK }
const SIGNATURE_LABEL_STYLE: React.CSSProperties = { ...TEXT_STYLES.TEXT_SIZE_11, whiteSpace: 'nowrap' }

type SignatureLineBlockPropsType = { label: string, width: number }

const SignatureLineBlock = forwardRef<HTMLDivElement, SignatureLineBlockPropsType>(({ label, width }, ref) => {
    const blockStyle: React.CSSProperties = useMemo(() => ({ display: 'flex', flexDirection: 'column', gap: 6 * RESOLUTION_MULTIPLIER, width: width * RESOLUTION_MULTIPLIER }), [width])

    return (
        <div style={blockStyle} ref={ref}>
            <div style={SIGNATURE_LINE_WRAPPER_STYLE}>
                <div style={SIGNATURE_LINE_STYLE} />
            </div>
            <Typography.Text style={SIGNATURE_LABEL_STYLE}>
                {label}
            </Typography.Text>
        </div>
    )
})
SignatureLineBlock.displayName = 'SignatureLineBlock'

const SIGNATURE_BLOCK_STYLE: React.CSSProperties = { ...BLOCK_COMMON_STYLE, display: 'flex', flexDirection: 'column' }
const SIGNATURE_WRAPPER_STYLE = { display: 'flex', width: '100%', gap: 25 * RESOLUTION_MULTIPLIER }

const SignatureBlock = forwardRef<HTMLDivElement>((props, ref) => {
    const intl = useIntl()
    const ExecutorFullNameLabel = intl.formatMessage({ id: 'ticketBlankExport.field.executorFullName' })
    const ClientFullNameLabel = intl.formatMessage({ id: 'ticketBlankExport.field.clientFullName' })
    const ExecutorSignatureLabel = intl.formatMessage({ id: 'ticketBlankExport.field.executorSignature' })
    const ClientSignatureLabel = intl.formatMessage({ id: 'ticketBlankExport.field.clientSignature' })
    const CompletionDateLabel = intl.formatMessage({ id: 'ticketBlankExport.field.completionDate' })

    return (
        <div style={SIGNATURE_BLOCK_STYLE} ref={ref}>
            <div style={SIGNATURE_WRAPPER_STYLE}>
                <SignatureLineBlock label={ExecutorFullNameLabel} width={226} />
                <SignatureLineBlock label={ExecutorSignatureLabel} width={198} />
            </div>
            <div style={SIGNATURE_WRAPPER_STYLE}>
                <SignatureLineBlock label={ClientFullNameLabel} width={226} />
                <SignatureLineBlock label={ClientSignatureLabel} width={198} />
                <SignatureLineBlock label={CompletionDateLabel} width={136} />
            </div>
        </div>
    )
})
SignatureBlock.displayName = 'SignatureBlock'



const HEADER_BLOCK_STYLE: React.CSSProperties = { ...BLOCK_COMMON_STYLE, display: 'flex', flexDirection: 'column' }
const HEADER_CONTENT_WRAPPER_STYLE = { width: '100%', paddingTop: 13 * RESOLUTION_MULTIPLIER, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }
const HEADER_BORDER_WRAPPER_STYLE = { width: '100%', paddingTop: 11 * RESOLUTION_MULTIPLIER, paddingBottom: 24 * RESOLUTION_MULTIPLIER }
const HEADER_BORDER_STYLE = { width: '100%', height: RESOLUTION_MULTIPLIER, backgroundColor: LIGHT_GREY }

type HeaderBlockPropsType = { printDate: string }

const HeaderBlock = forwardRef<HTMLDivElement, HeaderBlockPropsType>(({ printDate }, ref) => {
    const intl = useIntl()
    const PrintDateLabel = intl.formatMessage({ id: 'ticketBlankExport.label.printDate' }, { printDate })

    return (
        <div style={HEADER_BLOCK_STYLE} ref={ref}>
            <div style={HEADER_CONTENT_WRAPPER_STYLE}>
                <DOMAIcon width={63 * RESOLUTION_MULTIPLIER} height={20 * RESOLUTION_MULTIPLIER} />
                <Typography.Text style={TEXT_STYLES.TEXT_SIZE_11}>
                    {PrintDateLabel}
                </Typography.Text>
            </div>
            <div style={HEADER_BORDER_WRAPPER_STYLE}>
                <div style={HEADER_BORDER_STYLE} />
            </div>
        </div>
    )
})
HeaderBlock.displayName = 'HeaderBlock'

const FOOTER_BLOCK_STYLE: React.CSSProperties = { ...BLOCK_COMMON_STYLE, display: 'flex', flexDirection: 'column' }
const FOOTER_BORDER_WRAPPER_STYLE = { width: '100%', paddingTop: 16 * RESOLUTION_MULTIPLIER, paddingBottom: 12 * RESOLUTION_MULTIPLIER }
const FOOTER_BORDER_STYLE = { width: '100%', height: RESOLUTION_MULTIPLIER, backgroundColor: LIGHT_GREY }
const FOOTER_CONTENT_WRAPPER_STYLE = { width: '100%', paddingBottom: 16 * RESOLUTION_MULTIPLIER, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }

type FooterBlockPropsType = { ticketNumber: string, createdAt: string }

const FooterBlock = forwardRef<HTMLDivElement, FooterBlockPropsType>(({ ticketNumber, createdAt }, ref) => {
    const intl = useIntl()
    const ticketWithNumberAndDatedLabel = intl.formatMessage({ id: 'ticketBlankExport.label.ticketWithNumberAndDated' }, { number: ticketNumber, createdAt })
    const PageLabel = intl.formatMessage({ id: 'ticketBlankExport.label.page' })

    return (
        <div style={FOOTER_BLOCK_STYLE} ref={ref}>
            <div style={FOOTER_BORDER_WRAPPER_STYLE}>
                <div style={FOOTER_BORDER_STYLE} />
            </div>
            <div style={FOOTER_CONTENT_WRAPPER_STYLE}>
                <Typography.Text style={TEXT_STYLES.TEXT_SIZE_11}>
                    {ticketWithNumberAndDatedLabel}
                </Typography.Text>
                <Typography.Text style={TEXT_STYLES.TEXT_SIZE_11}>
                    {PageLabel} <span id='pageNumber' />
                </Typography.Text>
            </div>
        </div>
    )
})
FooterBlock.displayName = 'FooterBlock'

// NOTE This function is for convenient auto-completion of props
const createBlock = <T extends unknown>({ Component, props }: { Component: React.ForwardRefExoticComponent<T & React.RefAttributes<HTMLDivElement>>, props: T }) => ({
    Component,
    props,
})

const getOptionsBlock = (ticket: ITicket, comments: ITicketComment[], parameters: ParametersType, intl: IntlShape) => {
    const ListCompletedWorksTitle = intl.formatMessage({ id: 'ticketBlankExport.heading.listCompletedWorks' })
    const ConsumedMaterialsTitle = intl.formatMessage({ id: 'ticketBlankExport.heading.consumedMaterials' })
    const TotalCostWorkTitle = intl.formatMessage({ id: 'ticketBlankExport.heading.totalCostWork' })

    const blocks = { comments: [], optional: [] }

    const commentsByTicket = comments.filter(comment => comment.ticket.id === ticket.id)

    if (commentsByTicket.length > 0) {
        blocks.comments.push(
            createBlock({ Component: CommentsSubtitleBlock, props: {} }),
            ...commentsByTicket
                .map(comment => [
                    createBlock({ Component: CommentBlock, props: { createdAt: dayjs(comment.createdAt).format(COMMENT_DAYTIME_FORMAT), content: comment.content } }),
                    createBlock({ Component: EmptyBlock, props: { height: 16 } }),
                ])
                .flat(1)
        )
    }

    if (parameters.haveListCompletedWorks) {
        blocks.optional.push(
            createBlock({ Component: EmptyLinesBlock, props: { title: ListCompletedWorksTitle, countLine: 3 } }),
            createBlock({ Component: EmptyBlock, props: { height: 16 } }),
        )
    }
    if (parameters.haveConsumedMaterials) {
        blocks.optional.push(
            createBlock({ Component: EmptyLinesBlock, props: { title: ConsumedMaterialsTitle, countLine: 3 } }),
            createBlock({ Component: EmptyBlock, props: { height: 16 } }),
        )
    }
    if (parameters.haveTotalCostWork) {
        blocks.optional.push(
            createBlock({ Component: EmptyLinesBlock, props: { title: TotalCostWorkTitle, countLine: 1 } }),
            createBlock({ Component: EmptyBlock, props: { height: 28 } }),
        )
    }

    return blocks
}

const getTicketBlocks = (ticket: ITicket, comments: ITicketComment[], parameters: ParametersType, intl: IntlShape) => {
    const NotesTitle = intl.formatMessage({ id: 'ticketBlankExport.heading.notes' })
    const WorkCompletedMessage = intl.formatMessage({ id: 'ticketBlankExport.message.workCompleted' })

    const organization = get(ticket, 'organization.name', '')
    const number = get(ticket, 'number')
    const clientName = get(ticket, 'clientName', '')
    const createdBy = get(ticket, 'createdBy.name', '')
    const clientPhone = get(ticket, 'clientPhone', '')
    const details = get(ticket, 'details', '')
    const createdAt = get(ticket, 'createdAt', '')

    const { comments: commentBlocks, optional } = getOptionsBlock(ticket, comments, parameters, intl)

    const blocks = [
        createBlock({ Component: TicketAndOrganizationBlock, props: { organizationName: organization, ticketNumber: String(number) } }),
        createBlock({ Component: EmptyBlock, props: { height: 16 } }),
        createBlock({ Component: AddressBlock, props: { address: getFullAddressByTicket({ ticket, intl }) } }),
        createBlock({ Component: EmptyBlock, props: { height: 16 } }),
        createBlock({ Component: ClientBlock, props: { clientName: clientName || createdBy, clientPhone } }),
        createBlock({ Component: EmptyBlock, props: { height: 16 } }),
        createBlock({ Component: DetailsBlock, props: { details } }),
        createBlock({ Component: EmptyBlock, props: { height: 16 } }),
        ...commentBlocks,
        createBlock({ Component: EmptyLinesBlock, props: { title: NotesTitle, countLine: 3 } }),
        createBlock({ Component: EmptyBlock, props: { height: 16 } }),
        ...optional,
        createBlock({ Component: TextBlock, props: { text: WorkCompletedMessage } }),
        createBlock({ Component: EmptyBlock, props: { height: 4 } }),
        createBlock({ Component: SignatureBlock, props: {} }),
    ]
    const header = createBlock({ Component: HeaderBlock, props: { printDate: dayjs().format(COMMON_DATE_FORMAT) } })
    const footer = createBlock({ Component: FooterBlock, props: { ticketNumber: String(number), createdAt: dayjs(createdAt).format(COMMON_DATE_FORMAT) } })

    return { blocks, header, footer }
}

const useTicketsToBlankPdf = (props: { tickets: ITicket[], comments: ITicketComment[], loading: boolean, count: number, parameters: ParametersType } ) => {
    const { tickets, loading, count, parameters, comments } = props

    const intl = useIntl()
    const PdfGenerationErrorMessage = intl.formatMessage({ id: 'errors.PdfGenerationError' })

    const [progress, setProgress] = useState(0)

    const elementsByTickets = useMemo(() => tickets.map((ticket) => getTicketBlocks(ticket, comments, parameters, intl)), [comments, intl, parameters, tickets])

    const blockRefs = useRef<BlockRefsType[]>([])
    const splitRef = useRef<HTMLDivElement>(null)

    const renderBlocks = useMemo(() => {
        const renders: JSX.Element[] = []
        for (let ticketIndex = 0; ticketIndex < elementsByTickets.length; ticketIndex++) {
            const elementsByTicket = elementsByTickets[ticketIndex]
            const { blocks, header: { Component: Header, props: headerProps }, footer: { Component: Footer, props: footerProps } } = elementsByTicket

            const blocksRefs: React.MutableRefObject<HTMLDivElement>[] = []
            const headerRef = createRef<HTMLDivElement>()
            const footerRef = createRef<HTMLDivElement>()
            blockRefs.current.push({ blocksRefs, headerRef, footerRef })

            const renderHeader = <Header ref={headerRef} {...headerProps} key={`header_${ticketIndex}`} />
            const renderFooter = <Footer ref={footerRef} {...footerProps} key={`footer_${ticketIndex}`} />

            renders.push(renderHeader, renderFooter)

            for (let blockIndex = 0; blockIndex < blocks.length; blockIndex++) {
                const block = blocks[blockIndex]
                const { Component: Block, props: blockProps } = block

                const blockRef = createRef<HTMLDivElement>()
                blocksRefs.push(blockRef)

                const renderBlock = <Block ref={blockRef} {...blockProps} key={`block_${ticketIndex}_${blockIndex}`} />

                renders.push(renderBlock)
            }
        }

        return renders
    }, [elementsByTickets])

    const renderSplit = useMemo(() => {
        const render = <SplitBlock ref={splitRef} />
        return <>{render}</>
    }, [])

    const exportPdf = useCallback(async () => {
        const pdf = new HtmlToPdf({ orientation: 'p', format: 'a5' }, splitRef.current)

        let counter = 0
        setProgress(counter / blockRefs.current.length)
        for (const part of blockRefs.current) {
            await pdf.addPart(part.blocksRefs.map((block) => block.current), part.headerRef.current, part.footerRef.current)
            counter++
            setProgress(counter / blockRefs.current.length)
        }
        await pdf.save(`ticket_blanks_${dayjs().format('DD_MM_YYYY__HH_mm_ss')}`)
    }, [])

    useEffect(() => {
        if (loading || count < 1) return

        exportPdf()
            .catch((e) => {
                notification.error({
                    message: PdfGenerationErrorMessage,
                    description: e.message,
                })
            })
    }, [PdfGenerationErrorMessage, count, exportPdf, loading])

    return { renderBlocks, renderSplit, progress }
}

const PdfView = () => {
    const { where, sortBy, parameters } = useQueryParams()
    const params = parameters as ParametersType

    const commentsWhere = useMemo(() => params?.haveAllComments ? { ticket: { ...where } } : { id_in: params?.commentIds ?? [] }, [params?.commentIds, params?.haveAllComments, where])

    const { loading: ticketsLoading, objs: tickets, count } = Ticket.useObjects({ where, sortBy, first: MAX_TICKET_BLANKS_EXPORT }  )
    const { loading: commentsLoading, objs: comments } = TicketComment.useObjects({ where: commentsWhere, first: MAX_TICKET_BLANKS_EXPORT * 20 })

    const loading = ticketsLoading || commentsLoading

    const { renderBlocks, renderSplit, progress } = useTicketsToBlankPdf({ tickets, comments, loading, count, parameters })

    return (
        <>
            <div>Exporting ticket blank: {progress * 100}%</div>
            {progress === 1 && <div>Export done!</div>}
            <div
                style={{ position: 'absolute', top: -10000, left: 10000, width: 658 * RESOLUTION_MULTIPLIER }}
            >
                {renderBlocks}
                {renderSplit}
            </div>
        </>
    )
}

const DynamicPdfView = dynamic(() => Promise.resolve(PdfView), {
    ssr: false,
})

function TicketsPdfPage (): JSX.Element {
    return (
        <PageContent>
            <DynamicPdfView/>
        </PageContent>
    )
}

TicketsPdfPage.container = ({ children }) => <div>{children}</div>
TicketsPdfPage.requiredAccess = OrganizationRequired

export default TicketsPdfPage
