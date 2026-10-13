describe('CP-INV-002 - Crear producto con precio 0', () => {
  let datos

  before(() => {
    cy.fixture('productos').then((f) => {
      datos = f
    })
  })

  beforeEach(() => {
    cy.viewport(1280, 900)
    cy.loginAdmin()
  })

  it('no guarda el producto y muestra el mensaje de precio', () => {
    const p = datos.precioCero

    cy.visit('http://localhost:5173/inventario')
    cy.contains('button', 'Agregar producto').click()

    cy.contains('label', /^Nombre$/).find('input').type(p.nombre)
    cy.get('input[list="lista-categorias"]').type(p.categoria)
    cy.get('input[type="file"]').selectFile(p.imagen, { force: true })
    cy.contains('label', /^Precio$/).find('input').type(p.precio)
    cy.contains('label', /^Stock$/).find('input').type(p.stock)
    cy.contains('label', 'Stock mínimo').find('input').type(p.stockMinimo)

    cy.contains('button', 'Guardar producto').scrollIntoView().click()

    // Resultado esperado del caso (texto exacto, tomado del fixture)
    cy.contains(datos.mensajes.precioInvalido).should('be.visible')
    // Y el producto no se guardó: el formulario sigue abierto
    cy.contains('button', 'Guardar producto').should('be.visible')
  })
})