import getConfig from 'next/config'
import pdfmake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'


const { vfs } = pdfFonts
pdfmake.vfs = vfs


const { publicRuntimeConfig: { serverUrl } } = getConfig()

export const columnsContent = () => [
    {
        columns: [
            {
                width: 'auto',
                image: 'logo',
                fit: [50, 50],
            },
            { width: '*', text: 'company.companyName()', style: ['header'] },
        ],
        style: ['line'],
    },
    {
        columns: [
            {
                width: '50%',
                text: 'faker.commerce.department()',
            },
            {
                width: '50%',
                text: 'faker.commerce.department()',
            },
        ],
        style: ['line'],
        tocItem: ['mainToc'],
    },
]

export const layout = (light = false) => [
    {
        layout: 'lightHorizontalLines', // optional
        table: {
            headerRows: 1,
            widths: ['*', 'auto', 100, '*'],

            body: [
                ['department', 'productName', 'color', 'price'],
                ...[...new Array(light ? 2 : 200)].map(() => [
                    { text: 'faker.commerce.department()', bold: true },
                    'faker.commerce.productName()',
                    'faker.commerce.color()',
                    'faker.commerce.price()',
                ]),
            ],
        },
        style: ['line'],
    },
]

export const lists = (light = false) => [
    {
        text: 'Emails',
        style: ['line'],
    },
    {
    // to treat a paragraph as a bulleted list, set an array of items under the ul key
        ul: [...new Array(light ? 2 : 200)].map(email => `email-${email}@test.mail`),
    },
    {
        text: 'Users :',
        style: ['line'],
    },
    {
    // for numbered lists set the ol key
        ol: [...new Array(light ? 2 : 200)].map(name => `name-${name}`),
    },
]

export const link = () => [
    {
        text: 'google',
        link: 'http://google.com',
        style: ['line'],
        tocItem: ['mainToc', 'subToc'],
    },
    { text: 'Go to page 2', linkToPage: 2, style: ['line'] },
]

export const qr = () => [
    { qr: 'text in QR', style: ['line'] },
    {
        qr: 'text in QR',
        foreground: 'red',
        background: 'yellow',
        style: ['line'],
    },
]

export const canvas = () => [
    {
    // width: 'auto',
        image: 'logo',
        width: 310,
        height: 310,
        pageSize: 'A5',
        pageOrientation: 'landscape',
        pageBreak: 'before',
    },
    {
        canvas: [
            {
                type: 'rect',
                x: 20,
                y: 20,
                w: 270,
                h: 270,
                r: 5,
                dash: { length: 5 },
                lineColor: 'blue',
            },
        ],
        margin: [0, -310, 0, 0],
    },
]

export const security = () => ({
    userPassword: '123',
    ownerPassword: '123456',
    permissions: {
        printing: 'highResolution', //'lowResolution'
        modifying: false,
        copying: false,
        annotating: true,
        fillingForms: true,
        contentAccessibility: true,
        documentAssembly: true,
    },
})

const testDocDefinition = {
    // ...examples.security(light),
    //   info: {
    //     title: 'awesome Document',
    //     author: 'john doe',
    //     subject: 'subject of document',
    //     keywords: 'keywords for document',
    //   },
    //   header: 'simple text',
    pageSize: 'a4',
    footer: (currentPage, pageCount) =>
        currentPage.toString() + ' of ' + pageCount,
    //   watermark: {
    //     text: 'watermark',
    //     color: 'blue',
    //     opacity: 0.1,
    //     bold: true,
    //     italics: false,
    //   },
    content: [
        {
            columns: [
                {
                    width: 100,
                    image: 'logo',
                    fit: [50, 50],
                },
                {
                    table: {
                        widths: [150, 50, 150],
                        body: [
                            // [{ text: 'Банк получателя' }, { text: 'БИК' }, { text: '046577674' }],
                            // [{ text: 'УРАЛЬСКИЙ БАНК ПАО СБЕРБАНК г.Екатеринбург' }, { text: 'Сч. №' }, { text: '30101810500000000674' }],
                            // [{ text: 'Получатель' }, { text: 'ИНН' }, { text: '9731062087' }],
                            // [{ rowSpan: 2, text: 'ООО "ДОМА"' }, { text: 'КПП' }, { text: '773101001' }],
                            // ['', { text: 'Сч. №' }, { text: '40702810916540071538' }],


                            [
                                { rowSpan: 2, layout: 'noBorders', table: { body: [[{ fontSize: 10, text: 'Банк получателя' }], [{ text: 'УРАЛЬСКИЙ БАНК ПАО СБЕРБАНК г.Екатеринбург' }]] } },
                                { text: 'БИК' }, 
                                { text: '046577674' },
                            ],
                            ['', { text: 'Сч. №' }, { text: '30101810500000000674' }],

                            [
                                { rowSpan: 3, layout: 'noBorders', table: { body: [[{ fontSize: 10, text: 'Получатель' }], [{ rowSpan: 2, text: 'ООО "ДОМА"' }], ['']] } },
                                { text: 'ИНН' },
                                { text: '9731062087' },
                            ],
                            ['', { text: 'КПП' }, { text: '773101001' }],
                            ['', { text: 'Сч. №' }, { text: '40702810916540071538' }],
                        ],
                    },
                },
            ],
        },
        {
            text: 'Счёт на оплату № 3999 от 01.01.2024', fontSize: 15, bold: true,
        },
        // ...columnsContent(),
        // ...layout(),
        // ...lists(),
        // ...link(),
        // ...qr(),
        // ...canvas(),
    ],
    styles: {
        header: {
            fontSize: 22,
            bold: true,
            color: '#8CAC32',
        },
        line: {
            margin: [10, 20, 10, 20],
        },
    },
    images: {
        logo: `${serverUrl}/public/logoDoma.svg`,
    },
    defaultStyle: {
        fontSize: 12,
    },
}

export function generatePDF (docDefinition: any = testDocDefinition) {
    const pdfDocGenerator = pdfmake.createPdf(docDefinition)
    return pdfDocGenerator
}
