describe('template spec', () => {
  it('passes', () => {
    cy.visit('http://localhost:6060/')
    const resultId = '#test-core-result'
    cy.get(resultId).should('have.html', '0')
    cy.get('#test-core-button').click()
    cy.get(resultId).should('have.html', '2')
    cy.get('#test-core-button').click()
    cy.get(resultId).should('have.html', '4')
  })
})
