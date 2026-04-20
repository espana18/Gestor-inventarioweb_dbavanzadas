import type { Venta } from '../tipos/modelos';
import { formatearMonedaColombiana } from '../servicios/formato';

interface TicketVentaProps {
  venta: Venta;
  nombreTienda: string;
  efectivoRecibido?: number;
  cambio?: number;
}

const formatearFechaCompleta = (fecha: string): string =>
  new Intl.DateTimeFormat('es-CO', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(fecha));

const renderizarLineas = (venta: Venta): string =>
  venta.productos
    .map(
      (linea) => `
        <div class="linea">
          <div>
            <div class="nombre">${linea.nombre}</div>
            <div class="detalle">${linea.cantidad} x ${formatearMonedaColombiana(linea.precioUnitario)}</div>
          </div>
          <div class="subtotal">${formatearMonedaColombiana(linea.subtotal)}</div>
        </div>
      `
    )
    .join('');

export function TicketVenta({ venta, nombreTienda, efectivoRecibido, cambio }: TicketVentaProps): JSX.Element {
  return (
    <article className="ticket-venta mx-auto w-full max-w-[80mm] bg-white px-4 py-5 text-[12px] text-slate-900">
      <style>{`
        @media print {
          body { margin: 0; }
          .ticket-venta { width: 80mm; max-width: 80mm; }
        }
        .linea { display: flex; justify-content: space-between; gap: 8px; margin-bottom: 6px; }
        .nombre { font-weight: 600; }
        .detalle { font-size: 10px; color: #475569; }
        .subtotal { font-weight: 700; white-space: nowrap; }
      `}</style>

      <div className="text-center">
        <h1 className="text-sm font-bold uppercase">{nombreTienda}</h1>
        <p className="font-semibold">Factura de Venta</p>
        <p className="text-[11px]">#{venta.id.slice(0, 8).toUpperCase()}</p>
        <p className="text-[11px]">{formatearFechaCompleta(venta.fecha)}</p>
      </div>

      <p className="my-3 text-center text-[10px] tracking-[0.25em]">--------------------------------</p>

      <div dangerouslySetInnerHTML={{ __html: renderizarLineas(venta) }} />

      <p className="my-3 text-center text-[10px] tracking-[0.25em]">--------------------------------</p>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm font-bold">
          <span>TOTAL</span>
          <span>{formatearMonedaColombiana(venta.total)}</span>
        </div>
        <p className="text-[11px]">Método de pago: {venta.metodoPago}</p>
        {venta.metodoPago === 'Efectivo' && efectivoRecibido !== undefined && cambio !== undefined ? (
          <>
            <p className="text-[11px]">Efectivo recibido: {formatearMonedaColombiana(efectivoRecibido)}</p>
            <p className="text-[11px]">Cambio: {formatearMonedaColombiana(cambio)}</p>
          </>
        ) : null}
      </div>

      <p className="my-3 text-center text-[10px] tracking-[0.25em]">--------------------------------</p>

      <div className="text-center text-[11px]">
        <p className="font-semibold">¡Gracias por su compra!</p>
        <p>Vuelva pronto · {nombreTienda}</p>
      </div>
    </article>
  );
}

export const imprimirTicket = (venta: Venta, nombreTienda: string, efectivoRecibido?: number): void => {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);

  const cambio = efectivoRecibido !== undefined ? Math.max(0, efectivoRecibido - venta.total) : undefined;
  const contenido = `
    <html>
      <head>
        <title>Ticket de venta</title>
        <style>
          body { margin: 0; font-family: Arial, sans-serif; }
          .ticket-venta { width: 80mm; max-width: 80mm; padding: 16px; font-size: 12px; color: #0f172a; }
          .linea { display: flex; justify-content: space-between; gap: 8px; margin-bottom: 6px; }
          .nombre { font-weight: 600; }
          .detalle { font-size: 10px; color: #475569; }
          .subtotal { font-weight: 700; white-space: nowrap; }
        </style>
      </head>
      <body>
        ${renderizarTicketHTML(venta, nombreTienda, efectivoRecibido, cambio)}
      </body>
    </html>
  `;

  const documento = iframe.contentDocument;
  if (documento === null) {
    document.body.removeChild(iframe);
    return;
  }

  documento.open();
  documento.write(contenido);
  documento.close();

  const ventana = iframe.contentWindow;
  if (ventana !== null) {
    window.setTimeout(() => {
      ventana.focus();
      ventana.print();
    }, 300);
  }

  window.setTimeout(() => {
    document.body.removeChild(iframe);
  }, 2000);
};

const renderizarTicketHTML = (venta: Venta, nombreTienda: string, efectivoRecibido?: number, cambio?: number): string => `
  <article class="ticket-venta">
    <div class="text-center">
      <h1 style="font-size: 14px; font-weight: 700; text-transform: uppercase; margin: 0;">${nombreTienda}</h1>
      <p style="font-weight: 600; margin: 4px 0 0;">Factura de Venta</p>
      <p style="font-size: 11px; margin: 4px 0 0;">#${venta.id.slice(0, 8).toUpperCase()}</p>
      <p style="font-size: 11px; margin: 4px 0 0;">${formatearFechaCompleta(venta.fecha)}</p>
    </div>
    <p style="margin: 12px 0; text-align: center; font-size: 10px; letter-spacing: 0.25em;">--------------------------------</p>
    <div>${venta.productos
      .map(
        (linea) => `
          <div class="linea">
            <div>
              <div class="nombre">${linea.nombre}</div>
              <div class="detalle">${linea.cantidad} x ${formatearMonedaColombiana(linea.precioUnitario)}</div>
            </div>
            <div class="subtotal">${formatearMonedaColombiana(linea.subtotal)}</div>
          </div>
        `
      )
      .join('')}</div>
    <p style="margin: 12px 0; text-align: center; font-size: 10px; letter-spacing: 0.25em;">--------------------------------</p>
    <div style="space-y: 4px;">
      <div style="display:flex; justify-content:space-between; gap:8px; font-size:14px; font-weight:700;">
        <span>TOTAL</span><span>${formatearMonedaColombiana(venta.total)}</span>
      </div>
      <p style="font-size: 11px; margin: 4px 0 0;">Método de pago: ${venta.metodoPago}</p>
      ${venta.metodoPago === 'Efectivo' && efectivoRecibido !== undefined && cambio !== undefined ? `<p style="font-size: 11px; margin: 4px 0 0;">Efectivo recibido: ${formatearMonedaColombiana(efectivoRecibido)}</p><p style="font-size: 11px; margin: 4px 0 0;">Cambio: ${formatearMonedaColombiana(cambio)}</p>` : ''}
    </div>
    <p style="margin: 12px 0; text-align: center; font-size: 10px; letter-spacing: 0.25em;">--------------------------------</p>
    <div style="text-align:center; font-size: 11px;">
      <p style="font-weight: 600; margin: 0;">¡Gracias por su compra!</p>
      <p style="margin: 4px 0 0;">Vuelva pronto · ${nombreTienda}</p>
    </div>
  </article>
`;
