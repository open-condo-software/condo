import { faker } from '@faker-js/faker'
import sample from 'lodash/sample'

import { TicketCreate, TicketView, TicketEdit, TicketImport } from '../../objects/Ticket'
import { authUserWithCookies } from '../../plugins/auth'

describe('Ticket',  function () {
    describe('User', function () {
        afterEach(() => {
            cy.clearCookies()
        })

        it('can create ticket',  () => {
            cy.task('keystone:createUserWithProperty').then((response) => {
                authUserWithCookies(response)
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
            })
        })

        it('can view and filter tickets with table', () => {
            cy.task('keystone:createUserWithProperty').then((response) => {
                authUserWithCookies(response)

                cy.task('keystone:createTickets', response).then(() => {
                    const { address: propertyAddress } = response.property

                    const ticketView = new TicketView()
                    ticketView
                        .visit()
                        .clickIsWarrantyCheckbox()
                        .clickIsPayableCheckbox()
                        .clickIsEmergencyCheckbox()
                        .clickOnGlobalFiltersButton()
                        .typeAddressSearchInput(propertyAddress)
                })
            })
        })

        it('can view and edit ticket', () => {
            cy.task('keystone:createUserWithProperty').then((response) => {
                authUserWithCookies(response)

                cy.task('keystone:createTickets', response).then((ticket) => {
                    const ticketEdit = new TicketEdit()
                    ticketEdit
                        .visit(ticket)
                        .clickUpdateTicketLink()
                        .clickTicketDeadline()
                        .clickAssigneeInput()
                        .clickApplyChanges()
                })
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
