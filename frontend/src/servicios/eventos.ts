const eventoVentaRegistrada = 'gestor-inventario:venta-registrada';

export const notificarVentaRegistrada = (): void => {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new Event(eventoVentaRegistrada));

  try {
    const canal = new BroadcastChannel(eventoVentaRegistrada);
    canal.postMessage({ tipo: eventoVentaRegistrada });
    canal.close();
  } catch {
    window.localStorage.setItem(eventoVentaRegistrada, String(Date.now()));
  }
};

export const escucharVentaRegistrada = (alCambiar: () => void): (() => void) => {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const manejarEventoLocal = (): void => alCambiar();
  window.addEventListener(eventoVentaRegistrada, manejarEventoLocal);

  let canal: BroadcastChannel | null = null;
  const manejarMensajeCanal = (): void => alCambiar();

  try {
    canal = new BroadcastChannel(eventoVentaRegistrada);
    canal.addEventListener('message', manejarMensajeCanal);
  } catch {
    const manejarStorage = (evento: StorageEvent): void => {
      if (evento.key === eventoVentaRegistrada) {
        alCambiar();
      }
    };

    window.addEventListener('storage', manejarStorage);

    return () => {
      window.removeEventListener(eventoVentaRegistrada, manejarEventoLocal);
      window.removeEventListener('storage', manejarStorage);
    };
  }

  return () => {
    window.removeEventListener(eventoVentaRegistrada, manejarEventoLocal);
    canal?.removeEventListener('message', manejarMensajeCanal);
    canal?.close();
  };
};
