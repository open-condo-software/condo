export const getMessage = (link, userName, users) => `
******************************
Pull request opened.
Author: ${userName}.
${users.map(([userName]) => `@${userName}`).join(', ')}
Link: ${link}.
******************************
`
