describe('template spec', () => {
  it('passes', () => {
    cy.visit('http://127.0.0.1:8080/')
    const resultId = '#test-core-result'
    cy.get(resultId).should('have.html', '0')
    cy.get('#test-core-button').click()
    cy.get(resultId).should('have.html', '2')
    cy.get('#test-core-button').click()
    cy.get(resultId).should('have.html', '4')
  })
})
