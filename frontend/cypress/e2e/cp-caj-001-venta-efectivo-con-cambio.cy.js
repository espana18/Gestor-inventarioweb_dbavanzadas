describe('CP-CAJ-001 - Venta en efectivo con cambio', () => {
  beforeEach(() => {
    cy.viewport(1280, 900)
    cy.loginCajero()
    // Precondición: carrito vacío
    cy.contains('button', 'Limpiar').click()
    cy.contains('El carrito está vacío').should('be.visible')
  })

  it('registra la venta de 2 unidades y calcula el cambio', () => {
    // Agregar "Arroz 500 g" (código ARR-500) y subir la cantidad a 2
    cy.contains('article', 'Código: ARR-500').contains('button', '+ Agregar').click()
    cy.get('aside').contains('button', /^\+$/).click()

    // El total debe ser 7.000
    cy.contains('Total a cobrar').parent().should('contain', '7.000')

    // Finalizar venta con efectivo (método por defecto)
    cy.contains('button', 'Finalizar venta').click()
    cy.contains('label', 'Efectivo recibido').find('input').type('10000')
    cy.contains('Cambio:').should('contain', '3.000')
    cy.contains('button', 'Finalizar compra').click()

    // Resultado esperado: venta registrada con el cambio mostrado
    cy.contains('Venta registrada').should('be.visible')
    cy.contains('Cambio:').should('contain', '3.000')
  })
})