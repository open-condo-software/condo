const { createReadStream } = require('fs')
const { resolve } = require('path')

const { gql } = require('graphql-tag')

const { generateGqlQueries } = require('@open-condo/codegen/generate.gql')
const conf = require('@open-condo/config')

const { ApolloServerClient } = require('../index')

/*
*   Example env file
*   INTEGRATION='{"endpoint":"https://condo.d.doma.ai/admin/api","authRequisites":{"phone":"****","password":"****"}}'
*   ORGANIZATION=52284b8d-221d-4d3c-ba15-ce81bc48bac6
*   PROPERTY_ID=add0910d-10a6-4f47-b8ab-4238011fe258
* */

const { endpoint, authRequisites = {} } = conf['INTEGRATION'] ? JSON.parse(conf['INTEGRATION']) : {}

const organizationId = conf['ORGANIZATION']
const propertyId = conf['PROPERTY_ID']

const TICKET_OTHER_SOURCE_ID = '7da1e3be-06ba-4c9e-bba6-f97f278ac6e4'

const ticket = {
    details: 'Запах гари в коридоре квартиры, шипение и нет света (ранее была течь кровли).',
    organization: { connect: { id: organizationId } },
    property: { connect: { id: propertyId } },
    source: { connect: { id: TICKET_OTHER_SOURCE_ID } },
}

const COMMON_FIELDS = 'id createdAt updatedAt'
const PREDICT_TICKET_CLASSIFICATION_QUERY = gql`
    query predictTicketClassification ($data: PredictTicketClassificationInput!) {
        obj: predictTicketClassification(data: $data) { id place { id name } category { id name }  }
    }
`

const TICKET_CLASSIFIER_ATTRIBUTES_FIELDS = ' classifier { id place { id name } category { id name } problem { id name } }'
const TICKET_PROPERTY_FIELDS = 'id name address addressMeta { dv value }'
const TICKET_FIELDS = `{ organization { id name tin } property { ${TICKET_PROPERTY_FIELDS} } propertyAddress unitType unitName sectionName sectionType floorName number details source { id name type } ${TICKET_CLASSIFIER_ATTRIBUTES_FIELDS} ${COMMON_FIELDS} }`

const TicketGql = generateGqlQueries('Ticket', TICKET_FIELDS)

const TICKET_FILE_FIELDS = `{ id file { id originalFilename publicUrl mimetype } organization { id } ticket { id } ${COMMON_FIELDS} }`
const TicketFileGql = generateGqlQueries('TicketFile', TICKET_FILE_FIELDS)

class TicketClient extends ApolloServerClient {

    async classifyTicket (details = '') {
        const { data: { obj } } = await this.client.query({
            query: PREDICT_TICKET_CLASSIFICATION_QUERY,
            variables: { data: { details } },
        })
        return obj
    }

    async createTicket (createInput = {}) {
        return await this.createModel({
            modelGql: TicketGql,
            createInput,
        })
    }

    async createTicketFile (createInput = {}) {
        return await this.createModel({
            modelGql: TicketFileGql,
            createInput,
        })
    }

}

// 1. Log in as a user by phone + password
// 2. Classify ticket
// 3. Create ticket
// 4. Create ticket file and attach it to the ticket

const bootstrap = async () => {
    const bot = new TicketClient(endpoint, authRequisites)
    await bot.signIn()
    bot.info('Logged in as', { user: { id: bot.userId } })
    const classifier = await bot.classifyTicket(ticket.details)
    const { id: classifierId } = classifier
    const createInput = {
        ...ticket,
        classifier: { connect: { id: classifierId } },
    }
    const newTicket = await bot.createTicket(createInput)
    const ticketFile = await bot.createTicketFile({
        ticket: { connect: { id: newTicket.id } },
        file: bot.createUploadFile(createReadStream(resolve('./Readme.md'))),
    })
    bot.info('Created new TicketFile', { model: ticketFile })
}


bootstrap().then(() => {
    console.log('All done')
    process.exit(0)
}).catch(error => {
    console.error(error)
    process.exit(1)
})
