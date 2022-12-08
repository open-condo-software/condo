import React, { createRef, forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Typography, notification } from 'antd'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
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


type BlockRefsType = {
    blocksRefs: React.MutableRefObject<HTMLDivElement>[]
    headerRef: React.MutableRefObject<HTMLDivElement>
    footerRef: React.MutableRefObject<HTMLDivElement>
}

type TextStyleKeys = 'MAIN_TITLE' | 'SECOND_TITLE' | 'SUBTITLE' | 'TEXT_SIZE_14' | 'TEXT_SIZE_12' | 'TEXT_SIZE_13' | 'TEXT_SIZE_11'


const resolutionMultiplier = 3
const BLOCK_COMMON_STYLE: React.CSSProperties = {
    width: '100%',
    paddingLeft: 24 * resolutionMultiplier,
    paddingRight: 24 * resolutionMultiplier,
}
const TEXT_STYLES: Record<TextStyleKeys, React.CSSProperties> = {
    MAIN_TITLE: { fontSize: 24 * resolutionMultiplier, lineHeight: `${32 * resolutionMultiplier}px`, fontWeight: 700 },
    SECOND_TITLE: { fontSize: 16 * resolutionMultiplier, lineHeight: `${24 * resolutionMultiplier}px`, fontWeight: 600 },
    TEXT_SIZE_11: { fontSize: 11 * resolutionMultiplier, lineHeight: `${15 * resolutionMultiplier}px`, fontWeight: 600 },
    SUBTITLE: { fontSize: 11 * resolutionMultiplier, lineHeight: `${20 * resolutionMultiplier}px`, fontWeight: 600, color: 'grey' },
    TEXT_SIZE_12: { fontSize: 12 * resolutionMultiplier, lineHeight: `${18 * resolutionMultiplier}px`, fontWeight: 400 },
    TEXT_SIZE_13: { fontSize: 13 * resolutionMultiplier, lineHeight: `${20 * resolutionMultiplier}px`, fontWeight: 400 },
    TEXT_SIZE_14: { fontSize: 14 * resolutionMultiplier, lineHeight: `${22 * resolutionMultiplier}px`, fontWeight: 400 },
}


const useQueryParams = (): Record<string, any> => {
    const router = useRouter()
    const { query } = router
    const parsed = {}

    for (const key in query) {
        parsed[key] = JSON.parse((query as Record<string, string>)[key])
    }

    return parsed
}

const SplitBlock = forwardRef<HTMLDivElement>((props, ref) => {
    const view = (
        <div style={{ width: 1 * resolutionMultiplier, height: 934 * resolutionMultiplier, backgroundColor: '#E1E5ED' }} ref={ref}></div>
    )

    return view
})

const TicketAndOrganizationBlock = forwardRef<HTMLDivElement, { organizationName: string, ticketNumber: string }>(({ organizationName, ticketNumber }, ref) => {
    const intl = useIntl()
    const ticketMessage = intl.formatMessage({ id: 'ticketBlankExport.label.ticket' })

    const view = (
        <div style={{ ...BLOCK_COMMON_STYLE, display: 'flex', justifyContent: 'space-between' }} ref={ref}>
            <Typography.Title level={3} style={{ ...TEXT_STYLES.MAIN_TITLE, width: 450 * resolutionMultiplier }}>{ticketMessage} №{ticketNumber}</Typography.Title>
            <Typography.Text style={{ ...TEXT_STYLES.SECOND_TITLE, color: 'grey', textAlign: 'end' }}>
                {organizationName}
            </Typography.Text>
        </div>
    )

    return view
})

const AddressBlock = forwardRef<HTMLDivElement, { address: string }>(({ address }, ref) => {
    const intl = useIntl()
    const AddressTitle = intl.formatMessage({ id: 'ticketBlankExport.heading.address' })

    const view = (
        <div style={{ ...BLOCK_COMMON_STYLE, display: 'flex', flexDirection: 'column', gap: 4 * resolutionMultiplier }} ref={ref}>
            <Typography.Title level={5} style={TEXT_STYLES.SUBTITLE}>
                {AddressTitle}
            </Typography.Title>
            <Typography.Text style={TEXT_STYLES.TEXT_SIZE_14}>
                {address}
            </Typography.Text>
        </div>
    )

    return view
})

const ClientBlock = forwardRef<HTMLDivElement, { clientName: string, clientPhone: string }>(({ clientName, clientPhone }, ref) => {
    const intl = useIntl()
    const ClientNameTitle = intl.formatMessage({ id: 'ticketBlankExport.heading.clientName' })

    const view = (
        <div style={{ ...BLOCK_COMMON_STYLE, display: 'flex', flexDirection: 'column', gap: 4 * resolutionMultiplier }} ref={ref}>
            <Typography.Title level={5} style={TEXT_STYLES.SUBTITLE}>
                {ClientNameTitle}
            </Typography.Title>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography.Text style={TEXT_STYLES.TEXT_SIZE_14}>
                    {clientName}
                </Typography.Text>
                <Typography.Text style={{ ...TEXT_STYLES.TEXT_SIZE_14, width: 175 * resolutionMultiplier, textAlign: 'end' }}>
                    {clientPhone}
                </Typography.Text>
            </div>
        </div>
    )

    return view
})

const DetailsBlock = forwardRef<HTMLDivElement, { details: string }>(({ details }, ref) => {
    const intl = useIntl()
    const DetailsTitle = intl.formatMessage({ id: 'ticketBlankExport.heading.details' })

    const view = (
        <div style={{ ...BLOCK_COMMON_STYLE, display: 'flex', flexDirection: 'column', gap: 4 * resolutionMultiplier }} ref={ref}>
            <Typography.Title level={5} style={TEXT_STYLES.SUBTITLE}>
                {DetailsTitle}
            </Typography.Title>
            <Typography.Text style={TEXT_STYLES.TEXT_SIZE_12}>
                {details}
            </Typography.Text>
        </div>
    )

    return view
})

const CommentsSubtitleBlock = forwardRef<HTMLDivElement>((props, ref) => {
    const intl = useIntl()
    const CommentsTitle = intl.formatMessage({ id: 'ticketBlankExport.heading.comments' })

    const view = (
        <div style={{ ...BLOCK_COMMON_STYLE, paddingBottom: 12 * resolutionMultiplier }} ref={ref}>
            <Typography.Title level={5} style={TEXT_STYLES.SUBTITLE}>
                {CommentsTitle}
            </Typography.Title>
        </div>
    )

    return view
})

const CommentBlock = forwardRef<HTMLDivElement, { content: string, createdAt: string }>(({ content, createdAt }, ref) => {
    const view = (
        <div style={{ ...BLOCK_COMMON_STYLE }} ref={ref}>
            <Typography.Title level={5} style={TEXT_STYLES.TEXT_SIZE_12}>
                {createdAt} {content}
            </Typography.Title>
        </div>
    )

    return view
})

const EmptyLinesBlock = forwardRef<HTMLDivElement, { title: string, countLine: number }>(({ title, countLine }, ref) => {
    const view = (
        <div style={{ ...BLOCK_COMMON_STYLE, display: 'flex', flexDirection: 'column' }} ref={ref}>
            <Typography.Title level={5} style={TEXT_STYLES.SUBTITLE}>
                {title}
            </Typography.Title>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                {new Array(countLine).fill(1).map((_, index) => (
                    <div key={index} style={{ width: '100%', height: 1 * resolutionMultiplier, backgroundColor: 'black', marginTop: 18 * resolutionMultiplier }}></div>
                ))}
            </div>
        </div>
    )

    return view
})

const TextBlock = forwardRef<HTMLDivElement, { text: string }>(({ text }, ref) => {
    const view = (
        <div style={{ ...BLOCK_COMMON_STYLE }} ref={ref}>
            <Typography.Text style={TEXT_STYLES.TEXT_SIZE_13}>
                {text}
            </Typography.Text>
        </div>
    )

    return view
})

const EmptyBlock = forwardRef<HTMLDivElement, { height: number }>(({ height = 16 }, ref) => {
    const view = (
        <div style={{ ...BLOCK_COMMON_STYLE, height: height * resolutionMultiplier }} ref={ref}>
        </div>
    )

    return view
})

const SignatureLineBlock = forwardRef<HTMLDivElement, { label: string, width: number }>(({ label, width }, ref) => {
    const view = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 * resolutionMultiplier, width: width * resolutionMultiplier }} ref={ref}>
            <div style={{ width: '100%', paddingTop: 32 * resolutionMultiplier }}>
                <div style={{ width: '100%', height: 1 * resolutionMultiplier, backgroundColor: 'black' }}></div>
            </div>
            <Typography.Text style={{ ...TEXT_STYLES.TEXT_SIZE_11, whiteSpace: 'nowrap' }}>
                {label}
            </Typography.Text>
        </div>
    )

    return view
})

const SignatureBlock = forwardRef<HTMLDivElement>((props, ref) => {
    const intl = useIntl()
    const ExecutorFullNameLabel = intl.formatMessage({ id: 'ticketBlankExport.field.executorFullName' })
    const ClientFullNameLabel = intl.formatMessage({ id: 'ticketBlankExport.field.clientFullName' })
    const ExecutorSignatureLabel = intl.formatMessage({ id: 'ticketBlankExport.field.executorSignature' })
    const ClientSignatureLabel = intl.formatMessage({ id: 'ticketBlankExport.field.clientSignature' })
    const CompletionDateLabel = intl.formatMessage({ id: 'ticketBlankExport.field.completionDate' })

    const view = (
        <div style={{ ...BLOCK_COMMON_STYLE, display: 'flex', flexDirection: 'column' }} ref={ref}>
            <div style={{ display: 'flex', width: '100%', gap: 25 * resolutionMultiplier }}>
                <SignatureLineBlock label={ExecutorFullNameLabel} width={226} />
                <SignatureLineBlock label={ExecutorSignatureLabel} width={198} />
            </div>
            <div style={{ display: 'flex', width: '100%', gap: 25 * resolutionMultiplier }}>
                <SignatureLineBlock label={ClientFullNameLabel} width={226} />
                <SignatureLineBlock label={ClientSignatureLabel} width={198} />
                <SignatureLineBlock label={CompletionDateLabel} width={136} />
            </div>
        </div>
    )

    return view
})

const DomaIconBlock = ({ width = 63, height = 20 }) => {
    return (
        <svg width={width * resolutionMultiplier} height={height * resolutionMultiplier} viewBox='0 0 63 20' fill='none' xmlns='http://www.w3.org/2000/svg'>
            <path d='M34.8757 13.2672V16.9695H32.8536V15.0315H26.1944V16.9695H24.1724L24.1858 13.2672H24.5633C25.1295 13.2494 25.5294 12.8395 25.763 12.0375C25.9967 11.2356 26.1405 10.0906 26.1944 8.60254L26.3022 5.67543H33.5546V13.2672H34.8757ZM28.1221 8.80302C28.0771 9.91686 27.9828 10.8525 27.839 11.6098C27.6952 12.3583 27.475 12.9108 27.1785 13.2672H31.3978V7.43971H28.1625L28.1221 8.80302ZM39.4889 15.1384C38.725 15.1384 38.0375 14.9825 37.4264 14.6706C36.8243 14.3498 36.3525 13.9088 36.011 13.3474C35.6694 12.786 35.4987 12.1489 35.4987 11.4361C35.4987 10.7232 35.6694 10.0861 36.011 9.52478C36.3525 8.96341 36.8243 8.52682 37.4264 8.21493C38.0375 7.89415 38.725 7.73376 39.4889 7.73376C40.2527 7.73376 40.9358 7.89415 41.5379 8.21493C42.1399 8.52682 42.6118 8.96341 42.9533 9.52478C43.2948 10.0861 43.4655 10.7232 43.4655 11.4361C43.4655 12.1489 43.2948 12.786 42.9533 13.3474C42.6118 13.9088 42.1399 14.3498 41.5379 14.6706C40.9358 14.9825 40.2527 15.1384 39.4889 15.1384ZM39.4889 13.4276C40.0281 13.4276 40.4684 13.2494 40.8099 12.893C41.1604 12.5276 41.3356 12.042 41.3356 11.4361C41.3356 10.8302 41.1604 10.349 40.8099 9.99258C40.4684 9.62723 40.0281 9.44458 39.4889 9.44458C38.9496 9.44458 38.5048 9.62723 38.1543 9.99258C37.8038 10.349 37.6286 10.8302 37.6286 11.4361C37.6286 12.042 37.8038 12.5276 38.1543 12.893C38.5048 13.2494 38.9496 13.4276 39.4889 13.4276ZM51.989 15.0315V10.7277L49.8187 14.3365H48.929L46.8126 10.7143V15.0315H44.9119V7.84069H47.1092L49.4278 11.9974L51.8947 7.84069H53.8628L53.8897 15.0315H51.989ZM58.789 7.73376C59.912 7.73376 60.7747 8.00108 61.3773 8.53571C61.9792 9.06145 62.2804 9.85892 62.2804 10.9282V15.0315H60.3123V14.136C59.9167 14.8043 59.18 15.1384 58.1016 15.1384C57.5442 15.1384 57.0589 15.0448 56.6455 14.8577C56.2411 14.6706 55.9311 14.4122 55.7154 14.0825C55.4997 13.7528 55.3918 13.3786 55.3918 12.9598C55.3918 12.2915 55.6435 11.7658 56.1467 11.3826C56.659 10.9995 57.4454 10.8079 58.506 10.8079H60.1775C60.1775 10.3535 60.038 10.0059 59.7596 9.76536C59.4806 9.51589 59.0628 9.39112 58.506 9.39112C58.1191 9.39112 57.7374 9.45347 57.36 9.57824C56.9915 9.69406 56.677 9.85445 56.4163 10.0594L55.6615 8.60254C56.0569 8.32633 56.5287 8.11248 57.0769 7.96098C57.6341 7.80948 58.2047 7.73376 58.789 7.73376ZM58.6273 13.735C58.9866 13.735 59.3054 13.6548 59.5844 13.4944C59.8628 13.3251 60.0603 13.0801 60.1775 12.7593V12.0242H58.7351C57.8722 12.0242 57.4408 12.3049 57.4408 12.8662C57.4408 13.1335 57.5442 13.3474 57.7509 13.5078C57.9668 13.6593 58.2586 13.735 58.6273 13.735ZM59.5979 4.99377H61.8625L59.4226 6.91845H57.7779L59.5979 4.99377Z' fill='#222222'/>
            <path fillRule='evenodd' clipRule='evenodd' d='M7.98154 4.29605C7.52966 3.93142 6.88067 3.93325 6.4309 4.3004L0.444981 9.18659C0.163206 9.4166 0 9.75923 0 10.1208V18.2785C0 18.9472 0.547558 19.4894 1.223 19.4894H13.2696C13.945 19.4894 14.4926 18.9472 14.4926 18.2785V10.125C14.4926 9.76103 14.3272 9.41643 14.0423 9.18648L7.98154 4.29605ZM12.0466 17.0677V10.7002L7.2134 6.80028L2.44601 10.6918V17.0677H12.0466Z' fill='url(#paint0_linear_508_3035)'/>
            <path d='M15.317 5.11458C16.7414 5.11458 17.8962 3.96964 17.8962 2.55729C17.8962 1.14494 16.7414 0 15.317 0C13.8925 0 12.7378 1.14494 12.7378 2.55729C12.7378 3.96964 13.8925 5.11458 15.317 5.11458Z' fill='#FF9500'/>
            <defs>
                <linearGradient id='paint0_linear_508_3035' x1='0' y1='11.7566' x2='11.6239' y2='17.5312' gradientUnits='userSpaceOnUse'>
                    <stop stopColor='#2ABB56'/>
                    <stop offset='1' stopColor='#3996DD'/>
                </linearGradient>
            </defs>
        </svg>
    )
}

const HeaderBlock = forwardRef<HTMLDivElement, { printDate: string }>(({ printDate }, ref) => {
    const intl = useIntl()
    const PrintDateLabel = intl.formatMessage({ id: 'ticketBlankExport.label.printDate' }, { printDate })

    const view = (
        <div style={{ ...BLOCK_COMMON_STYLE, display: 'flex', flexDirection: 'column' }} ref={ref}>
            <div style={{ width: '100%', paddingTop: 13 * resolutionMultiplier, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <DomaIconBlock />
                <Typography.Text style={TEXT_STYLES.TEXT_SIZE_11}>
                    {PrintDateLabel}
                </Typography.Text>
            </div>
            <div style={{ width: '100%', paddingTop: 11 * resolutionMultiplier, paddingBottom: 24 * resolutionMultiplier }}>
                <div style={{ width: '100%', height: 1 * resolutionMultiplier, backgroundColor: '#E1E5ED' }}></div>
            </div>
        </div>
    )

    return view
})

const FooterBlock = forwardRef<HTMLDivElement, { ticketNumber: string, createdAt: string }>(({ ticketNumber, createdAt }, ref) => {
    const intl = useIntl()
    const ticketWithNumberAndDatedLabel = intl.formatMessage({ id: 'ticketBlankExport.label.ticketWithNumberAndDated' }, { number: ticketNumber, createdAt })
    const PageLabel = intl.formatMessage({ id: 'ticketBlankExport.label.page' })

    const view = (
        <div style={{ ...BLOCK_COMMON_STYLE, display: 'flex', flexDirection: 'column' }} ref={ref}>
            <div style={{ width: '100%', paddingTop: 16 * resolutionMultiplier, paddingBottom: 12 * resolutionMultiplier }}>
                <div style={{ width: '100%', height: 1 * resolutionMultiplier, backgroundColor: '#E1E5ED' }}></div>
            </div>
            <div style={{ width: '100%', paddingBottom: 16 * resolutionMultiplier, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography.Text style={TEXT_STYLES.TEXT_SIZE_11}>
                    {ticketWithNumberAndDatedLabel}
                </Typography.Text>
                <Typography.Text style={TEXT_STYLES.TEXT_SIZE_11}>
                    {PageLabel} <span id='pageNumber'></span>
                </Typography.Text>
            </div>
        </div>
    )

    return view
})

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
                    createBlock({ Component: CommentBlock, props: { createdAt: dayjs(comment.createdAt).format('DD.MM.YYYY, HH:mm'), content: comment.content } }),
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
    const header = createBlock({ Component: HeaderBlock, props: { printDate: dayjs().format('DD.MM.YYYY') } })
    const footer = createBlock({ Component: FooterBlock, props: { ticketNumber: String(number), createdAt: dayjs(createdAt).format('DD.MM.YYYY') } })

    return { blocks, header, footer }
}

const useTicketsToBlankPdf = (props: { tickets: ITicket[], comments: ITicketComment[], loading: boolean, count: number, parameters: ParametersType } ) => {
    const { tickets, loading, count, parameters, comments } = props

    const intl = useIntl()
    const PdfGenerationErrorMessage = intl.formatMessage({ id: 'errors.PdfGenerationError' })

    const [progress, setProgress] = useState(0)

    const elementsByTickets = useMemo(() => tickets.map((ticket) => getTicketBlocks(ticket, comments, parameters, intl)), [tickets])

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

                // @ts-ignore
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
        console.log(counter, 'from', blockRefs.current.length)
        for (const part of blockRefs.current) {
            await pdf.addPart(part.blocksRefs.map((block) => block.current), part.headerRef.current, part.footerRef.current)
            counter++
            setProgress(counter / blockRefs.current.length)
            console.log(counter, 'from', blockRefs.current.length)
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

    const commentsWhere = useMemo(() => params.haveAllComments ? { ticket: { ...where } } : { id_in: params?.commentIds ?? [] }, [])

    const { loading: ticketsLoading, objs: tickets, count } = Ticket.useObjects({ where, sortBy, first: MAX_TICKET_BLANKS_EXPORT }  )
    const { loading: commentsLoading, objs: comments } = TicketComment.useObjects({ where: commentsWhere, first: MAX_TICKET_BLANKS_EXPORT * 20 })

    const loading = ticketsLoading || commentsLoading

    const { renderBlocks, renderSplit, progress } = useTicketsToBlankPdf({ tickets, comments, loading, count, parameters })

    return (
        <>
            <div>Exporting ticket blank: {progress * 100}%</div>
            {progress === 1 && <div>Export done!</div>}
            <div
                style={{ position: 'absolute', top: -10000, left: 10000, width: 658 * resolutionMultiplier }}
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

function TicketsPdfPage () {
    return (
        <PageContent>
            <DynamicPdfView/>
        </PageContent>
    )
}

TicketsPdfPage.container = ({ children }) => <div>{children}</div>
TicketsPdfPage.requiredAccess = OrganizationRequired

export default TicketsPdfPage
