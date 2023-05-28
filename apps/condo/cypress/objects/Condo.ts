import { trackedVisit } from './helpers'

const URL = ''

class Condo {
    visit (): this {
        trackedVisit(URL)
        cy.wait('@getAllOnBoardings')

        cy.location('pathname').should('contain', URL)

        return this
    }

    clickOnMenu (menuItem: string): this {
        cy.get(`a[href*='/${menuItem}']`).click()
        return this
    }
}

export {
    Condo,
}
