export const nombresPaginas = ['inicio', 'inventario', 'caja', 'historial', 'cajeros', 'reportes'] as const;
export type NombrePagina = (typeof nombresPaginas)[number];
