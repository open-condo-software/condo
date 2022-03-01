/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
const TICKET_CREATE_URL = '/ticket/create'
const TICKET_VIEW_URL = '/ticket'

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
        cy.wait('@getAllContacts')
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
            .type(address.slice(0, 5))
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
        cy.wait('@getAllDivisions')
        cy.get('[data-cy=ticket-place-select-item] .ant-select-selection-search').should('not.have.class', '.ant-select-open')

        cy.get('[data-cy=ticket-category-select-item] .ant-select-selection-search')
            .click()
            .type('{downArrow}')
        cy.get('.ant-select-dropdown:not(.ant-select-dropdown-hidden) [data-cy=ticket-classifier-option]')
            .first()
            .click()
        return this
    }

    clickOnSubmitButton () {
        cy.get('[data-cy=ticket-submit-btn]')
            .click()

        cy.location('pathname').should('not.eq', TICKET_CREATE_URL)
        cy.location('pathname').should('contain', TICKET_VIEW_URL)
        return this
    }
}

class TicketView {
/*
    Elements:
        ticket-filter-isWarranty
        ticket-filter-isPaid
        ticket-filter-isEmergency
        tickets-table
*/
    visit () {
        cy.visit(TICKET_VIEW_URL)
        cy.wait('@getAllTickets')
        return this
    }

    clickIsWarrantyCheckbox () {
        cy.get('[data-cy=ticket-filter-isWarranty]').click()
        cy.location('search').should('contain', 'isWarranty')
        cy.wait('@getAllTickets')
        cy.get('[data-cy=tickets-table] tbody tr').should('have.length', 1)

        cy.get('[data-cy=ticket-filter-isWarranty]').click()
        cy.location('search').should('not.contain', 'isWarranty')
        cy.wait('@getAllTickets')
        cy.get('[data-cy=tickets-table] tbody tr').should('have.length', 4)

        return this
    }

    clickIsPaidCheckbox () {
        cy.get('[data-cy=ticket-filter-isPaid]').click()
        cy.location('search').should('contain', 'isPaid')
        cy.wait('@getAllTickets')
        cy.get('[data-cy=tickets-table] tbody tr').should('have.length', 1)

        cy.get('[data-cy=ticket-filter-isPaid]').click()
        cy.location('search').should('not.contain', 'isPaid')
        cy.wait('@getAllTickets')
        cy.get('[data-cy=tickets-table] tbody tr').should('have.length', 4)

        return this
    }

    clickIsEmergencyCheckbox () {
        cy.get('[data-cy=ticket-filter-isEmergency]').click()
        cy.location('search').should('contain', 'isEmergency')
        cy.wait('@getAllTickets')
        cy.get('[data-cy=tickets-table] tbody tr').should('have.length', 1)


        cy.get('[data-cy=ticket-filter-isEmergency]').click()
        cy.location('search').should('not.contain', 'isEmergency')
        cy.wait('@getAllTickets')
        cy.get('[data-cy=tickets-table] tbody tr').should('have.length', 4)

        return this
    }
}

export {
    TicketCreate,
    TicketView,
}
