import sample from 'lodash/sample'
import faker from 'faker'

import { TicketCreate, TicketView, TicketEdit } from '../../objects/Ticket'

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

                cy.task('keystone:createTickets', response).then(() => {
                    const ticketEdit = new TicketEdit()
                    ticketEdit
                        .visit()
                        .clickUpdateTicketLink()
                        .clickTicketDeadline()
                        .clickAssigneeInput()
                        .clickApplyChanges()
                })
            })
        })
    })
})
