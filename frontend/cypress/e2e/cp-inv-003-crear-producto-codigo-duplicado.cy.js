describe('CP-INV-003 - Crear producto con código duplicado', () => {
  const imagen = {
    contents: Cypress.Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    ),
    fileName: 'arroz1kg.png',
    mimeType: 'image/png'
  }

  beforeEach(() => {
    cy.viewport(1280, 900)
    cy.loginAdmin()
  })

  it('no guarda el producto y avisa que el código ya existe', () => {
    cy.visit('http://localhost:5173/inventario')

    // Precondición: ya existe un producto con código ARR-500
    cy.contains('ARR-500').should('be.visible')

    cy.contains('button', 'Agregar producto').click()

    cy.contains('label', /^Nombre$/).find('input').type('Arroz 1 kg')
    cy.contains('label', /^Código$/).find('input').clear().type('ARR-500')
    cy.get('input[list="lista-categorias"]').type('Granos')
    cy.get('input[type="file"]').selectFile(imagen, { force: true })
    cy.contains('label', /^Precio$/).find('input').type('3500')
    cy.contains('label', /^Stock$/).find('input').type('20')
    cy.contains('label', 'Stock mínimo').find('input').type('5')

    cy.contains('button', 'Guardar producto').scrollIntoView().click()

    // Resultado esperado del caso (texto exacto)
    cy.contains('Ya existe un producto con ese código en esta tienda').should('be.visible')
    // El producto no se guardó: el formulario sigue abierto
    cy.contains('button', 'Guardar producto').should('be.visible')
  })
})