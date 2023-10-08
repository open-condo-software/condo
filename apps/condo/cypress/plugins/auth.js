export const authUserWithCookies = (userData) => {
    cy.setCookie('locale', 'en')
    cy.setCookie('keystone.sid', userData.cookie.replace('keystone.sid=', ''))
    cy.setCookie('organizationLinkId', userData.organizationLinkId)
}
