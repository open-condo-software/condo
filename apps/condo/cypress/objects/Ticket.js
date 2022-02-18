/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

const TICKET_CREATE_URL = '/ticket/create/'

class TicketCreate {
/*
    Elements:
        organization-select-item
        property-address-search-input-item
        property-address-search-option
        unit-name-input-item
        unit-name-input-option
        ticket-description-input
        ticket-place-select-item
        ticket-category-select-item
        ticket-problem-select-item
        ticket-classifier-option
        ticket-submit-btn
*/

    visit () {
        cy.visit(TICKET_CREATE_URL)
        cy.wait(100)
        return this
    }

    chooseOrganization () {
        cy.get('[data-cy=organization-select-item]').click()
        return this
    }

    clickAndInputAddress (address) {
        cy.get('[data-cy=property-address-search-input-item] input')
            .click({ force: true })
            .focus()
            .type(address)
        return this
    }

    chooseAddressForTicket () {
        cy.get('[data-cy=property-address-search-option]')
            .click()
        return this
    }

    clickAndInputUnitName (unitName) {
        cy.get('[data-cy=unit-name-input-item] .ant-select-selection-search')
            .click({ force: true })
            .type(unitName)
        return this
    }

    chooseUnitName () {
        cy.get('[data-cy=unit-name-input-option]')
            .first()
            .click()
        return this
    }

    clickAndInputDescription (description) {
        cy.get('[data-cy=ticket-description-input]')
            .click()
            .type(description)
        return this
    }

    selectProblemWithCategoryClassifier () {
        cy.get('[data-cy=ticket-place-select-item] .ant-select-selection-search')
            .click()

        cy.get('[data-cy=ticket-classifier-option]')
            .first()
            .click()

        cy.get('[data-cy=ticket-category-select-item] .ant-select-selection-search')
            .click()
        cy.wait(100)
        cy.get('.ant-select-dropdown:not(.ant-select-dropdown-hidden) [data-cy=ticket-classifier-option]')
            .first()
            .click()
        return this
    }

    clickOnSubmitButton () {
        cy.get('[data-cy=ticket-submit-btn]')
            .click()
        return this
    }
}

export {
    TicketCreate,
}
