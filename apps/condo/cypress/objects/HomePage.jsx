/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable no-undef */

const HOME_PAGE_URL = 'http://localhost:3000'

class HomePage {

    visit () {
        cy.visit(HOME_PAGE_URL)
    }
}

export {
    HomePage,
    HOME_PAGE_URL,
}
