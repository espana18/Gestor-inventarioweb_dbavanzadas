import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    // URL de la aplicación bajo prueba (frontend). Se puede sobrescribir con
    // la variable de entorno CYPRESS_BASE_URL o con --config baseUrl=...
    baseUrl: 'http://localhost:5173',
    specPattern: 'cypress/e2e/**/*.cy.js',
    video: false,
    screenshotOnRunFailure: true,
    viewportWidth: 1280,
    viewportHeight: 900
  },
  env: {
    // URL base de la API (backend). Los datos sensibles NO van aquí:
    // se leen de cypress.env.json (excluido de Git) o de variables CYPRESS_*.
    apiUrl: 'http://localhost:3001/api'
  }
})
