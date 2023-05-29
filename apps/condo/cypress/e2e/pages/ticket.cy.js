import { faker } from '@faker-js/faker'
import sample from 'lodash/sample'

import { SimpleTracer } from '../../objects/helpers'
import { TicketCreate, TicketView, TicketEdit, TicketImport } from '../../objects/Ticket'
import { authUserWithCookies } from '../../plugins/auth'

describe('Ticket',  function () {
    describe('User', function () {

        it('can create ticket',  () => {
            const trace = new SimpleTracer('user.canCreateTicket', 'ticket')
            const spanPrepare = trace.startSpan('1.createUserWithProperty')
            
            cy.task('keystone:createUserWithProperty').then((response) => {
                authUserWithCookies(response)
                spanPrepare.finish()

                const span = trace.startSpan('2.createTicket')
                const { address: propertyAddress, map: propertyMap } = response.property
                const propertyUnits = propertyMap.sections
                    .map(section => section.floors.map(floor => floor.units.map(unit => unit.label))).flat(2)

                const ticketCreate = new TicketCreate()
                ticketCreate
                    .visit()
                    .clickAndInputAddress(propertyAddress)
                    .chooseAddressForTicket()
                    .clickAndInputUnitName(sample(propertyUnits))
                    .chooseUnitName()
                    .clickAndInputDescription(faker.lorem.sentence(3))
                    .selectProblemWithCategoryClassifier()
                    .clickOnSubmitButton()
                span.finish()
                
            }).then(() => {
                trace.finish()
            })
        })

        it('can view and filter tickets with table', () => {
            const trace = new SimpleTracer('user.canViewAndFilterTicketsWithTable', 'ticket')
            const spanPrepare = trace.startSpan('1.createUserWithProperty')
            cy.task('keystone:createUserWithProperty').then((response) => {
                authUserWithCookies(response)
                spanPrepare.finish()

                const spanCreateTickets = trace.startSpan('2.createTickets')
                cy.task('keystone:createTickets', response, { emergency: 10, regular: 10, paid: 10, warranty: 10 }).then(() => {
                    const { address: propertyAddress } = response.property
                    spanCreateTickets.finish()

                    const spanSearchTickets = trace.startSpan('3.viewTickets')
                    const ticketView = new TicketView()
                    ticketView
                        .visit()
                        .clickIsWarrantyCheckbox()
                        .clickIsPayableCheckbox()
                        .clickIsEmergencyCheckbox()
                        .clickOnGlobalFiltersButton()
                        .typeAddressSearchInput(propertyAddress)
                    spanSearchTickets.finish()
                })
            }).then(() => {
                trace.finish()
            })
        })

        it('can view and edit ticket', () => {
            const trace = new SimpleTracer('user.canViewAndEditTicket', 'ticket')
            const spanPrepare = trace.startSpan('1.createUserWithProperty')

            cy.task('keystone:createUserWithProperty').then((response) => {
                authUserWithCookies(response)
                spanPrepare.finish()

                const spanCreateTickets = trace.startSpan('2.createTickets')
                cy.task('keystone:createTickets', response).then((tickets) => {

                    const ticket = tickets[0]

                    spanCreateTickets.finish()

                    const spanEditTickets = trace.startSpan('3.editTickets')
                    const ticketEdit = new TicketEdit()
                    ticketEdit
                        .visit(ticket)
                        .clickUpdateTicketLink()
                        .clickTicketDeadline()
                        .clickAssigneeInput()
                        .clickApplyChanges()
                    spanEditTickets.finish()
                })
            }).then(() => {
                trace.finish()
            })
        })
    })

    // problem with waiting for a request to create a ticket or get contacts on GitHub Actions.
    // Locally work ok
    describe.skip('Support', () => {
        beforeEach(() => {
            cy.intercept('GET', '/api/features', { fixture: 'featureFlags.json' })
        })

        afterEach(() => {
            cy.clearCookies()
        })

        describe('valid cases', () => {
            const cases = [
                './cypress/testFiles/ticket/import-ticket-success-1.xlsx',
                './cypress/testFiles/ticket/import-ticket-success-2.xlsx',
                './cypress/testFiles/ticket/import-ticket-success-3.xlsx',
                './cypress/testFiles/ticket/import-ticket-success-4.xlsx',
                './cypress/testFiles/ticket/import-ticket-success-5.xlsx',
                './cypress/testFiles/ticket/import-ticket-success-6.xlsx',
                './cypress/testFiles/ticket/import-ticket-success-7.xlsx',
            ]

            cases.forEach((filePath, index) => {
                it(`can ticket import ${index + 1}`, () => {
                    cy.task('keystone:createSupportWithProperty').then((response) => {
                        authUserWithCookies(response)

                        const ticketImport = new TicketImport()
                        ticketImport
                            .visitTicketsPage()
                            .importTicketTable(filePath)
                            .waitCreatingTicket()
                            .waitSuccessModal()
                    })
                })
            })
        })

        describe('invalid cases', () => {
            const cases = [
                './cypress/testFiles/ticket/import-ticket-error-1.xlsx',
                './cypress/testFiles/ticket/import-ticket-error-3.xlsx',
                './cypress/testFiles/ticket/import-ticket-error-5.xlsx',
            ]

            cases.forEach((filePath, index) => {
                it(`can not ticket import ${index + 1}`, () => {
                    cy.task('keystone:createSupportWithProperty').then((response) => {
                        authUserWithCookies(response)

                        const ticketImport = new TicketImport()
                        ticketImport
                            .visitTicketsPage()
                            .importTicketTable(filePath)
                            .waitFetchingContact()
                            .waitErrorModal()
                    })
                })
            })
        })

        describe('cases without required fields', () => {
            const cases = [
                './cypress/testFiles/ticket/import-ticket-error-2.xlsx',
                './cypress/testFiles/ticket/import-ticket-error-4.xlsx',
            ]

            cases.forEach((filePath, index) => {
                it(`can not ticket import ${index + 1}`, () => {
                    cy.task('keystone:createSupportWithProperty').then((response) => {
                        authUserWithCookies(response)

                        const ticketImport = new TicketImport()
                        ticketImport
                            .visitTicketsPage()
                            .importTicketTable(filePath)
                            .waitErrorModal()
                    })
                })
            })
        })
    })
})
