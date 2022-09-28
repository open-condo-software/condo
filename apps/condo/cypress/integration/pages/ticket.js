import sample from 'lodash/sample'
import faker from 'faker'

import { TicketCreate, TicketView, TicketEdit, TicketImport } from '../../objects/Ticket'

const authUserWithCookies = (userData) => {
    cy.setCookie('locale', 'en')
    cy.setCookie('keystone.sid', userData.cookie.replace('keystone.sid=', ''))
    cy.setCookie('organizationLinkId', userData.organizationLinkId)
}

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
                        .clickIsPaidCheckbox()
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
    describe('Support', () => {
        afterEach(() => {
            cy.clearCookies()
        })

        const validCases = [
            './cypress/testFiles/ticket/import-ticket-success-1.xlsx',
            './cypress/testFiles/ticket/import-ticket-success-2.xlsx',
            './cypress/testFiles/ticket/import-ticket-success-3.xlsx',
            './cypress/testFiles/ticket/import-ticket-success-4.xlsx',
            './cypress/testFiles/ticket/import-ticket-success-5.xlsx',
            './cypress/testFiles/ticket/import-ticket-success-6.xlsx',
            './cypress/testFiles/ticket/import-ticket-success-7.xlsx',
        ]

        const invalidCases = [
            './cypress/testFiles/ticket/import-ticket-error-1.xlsx',
            './cypress/testFiles/ticket/import-ticket-error-2.xlsx',
            './cypress/testFiles/ticket/import-ticket-error-3.xlsx',
            './cypress/testFiles/ticket/import-ticket-error-4.xlsx',
            './cypress/testFiles/ticket/import-ticket-error-5.xlsx',
        ]

        validCases.forEach((filePath, index) => {
            it(`can ticket import ${index + 1}`, () => {
                cy.task('keystone:createSupportWithProperty').then((response) => {
                    authUserWithCookies(response)

                    const ticketImport = new TicketImport()
                    ticketImport
                        .visit()
                        .importTicketTable(filePath)
                        .closeSuccessModal()
                })
            })
        })

        invalidCases.forEach((filePath, index) => {
            it(`can not ticket import ${index + 1}`, () => {
                cy.task('keystone:createSupportWithProperty').then((response) => {
                    authUserWithCookies(response)

                    const ticketImport = new TicketImport()
                    ticketImport
                        .visit()
                        .importTicketTable(filePath)
                        .closeErrorModal()
                })
            })
        })
    })
})
