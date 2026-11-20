// lib/kaizenKds.ts

// ============================================================
// 1. PALETA DE COLORES (Alto contraste para fondo oscuro #0A130D)
// ============================================================
export interface ColorPedido {
  nombre: string;
  badge: string;  // Clases Tailwind para la etiqueta "#12"
  borde: string;  // Clases Tailwind para el borde en la Ventana de Empaque
  punto: string;  // Punto indicador de color
}

const PALETA_COLORES: ColorPedido[] = [
  {
    nombre: 'Cian',
    badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    borde: 'border-cyan-500/50',
    punto: 'bg-cyan-400',
  },
  {
    nombre: 'Esmeralda',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    borde: 'border-emerald-500/50',
    punto: 'bg-emerald-400',
  },
  {
    nombre: 'Violeta',
    badge: 'bg-violet-500/20 text-violet-300 border-violet-500/40',
    borde: 'border-violet-500/50',
    punto: 'bg-violet-400',
  },
  {
    nombre: 'Rosa',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    borde: 'border-rose-500/50',
    punto: 'bg-rose-400',
  },
  {
    nombre: 'Ámbar',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    borde: 'border-amber-500/50',
    punto: 'bg-amber-400',
  },
  {
    nombre: 'Azul',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    borde: 'border-blue-500/50',
    punto: 'bg-blue-400',
  },
];

// Memoria de colores asignados: evita que un pedido cambie de color cuando otro se termina
const coloresPersistentes = new Map<string, ColorPedido>();
let indiceColorGlobal = 0;

function obtenerColorEstable(pedidoIdFull: string): ColorPedido {
  if (!coloresPersistentes.has(pedidoIdFull)) {
    const color = PALETA_COLORES[indiceColorGlobal % PALETA_COLORES.length];
    coloresPersistentes.set(pedidoIdFull, color);
    indiceColorGlobal++;
  }
  return coloresPersistentes.get(pedidoIdFull)!;
}

// ============================================================
// 2. CONTRATOS DE DATOS (Tipos de TypeScript)
// ============================================================
export type SeccionBarra = 'caliente' | 'fria' | 'frappe';

export interface OrigenPedido {
  pedidoIdFull: string;
  pedidoCorto: string;   // Últimos 4 dígitos del ID (ej. "a4f2")
  cliente: string;
  cantidad: number;
  color: ColorPedido;
}

export interface NodoBebida {
  id: string;            // Llave única en la Tabla Hash: "NOMBRE | EXTRAS"
  nombre: string;
  extras: string;
  cantidadTotal: number;
  peso: number;          // Prioridad unitaria (1 = más rápido, 9 = al final)
  seccion: SeccionBarra;
  tipoLicuadora: 'ninguno' | 'claro' | 'oreo';
  tiempoBaseSeg: number;
  ordenGlobal: number;   // Secuencia final dictada por Kahn + Merge Sort (1°, 2°...)
  origenes: OrigenPedido[];
}

export interface ResultadoKaizen {
  comandaOptimizada: NodoBebida[];
  porSeccion: {
    caliente: NodoBebida[];
    fria: NodoBebida[];
    frappe: NodoBebida[];
  };
  coloresPorPedido: Record<string, ColorPedido>;
  hayBarreraOreo: boolean;
  estadisticas: {
    tiempoFifoSeg: number;
    tiempoKaizenSeg: number;
    lavadosFifo: number;
    lavadosKaizen: number;
    ahorroSegundos: number;
  };
}

// ============================================================
// 3. UTILIDADES COMPARTIDAS (Normalización de acentos y filtros)
// ============================================================
function normalizarTexto(texto: string): string {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// Filtro estricto: solo bebidas del menú (omite panadería y combos)
export function esBebidaBarista(item: any): boolean {
  const cat = normalizarTexto(item?.categoria || item);
  return cat.includes('calient') || cat.includes('frio') || cat.includes('frap');
}

export function contarBebidasPedido(pedido: any): number {
  const items = Array.isArray(pedido?.items) ? pedido.items : [];
  return items.reduce((acc: number, item: any) => {
    if (!esBebidaBarista(item)) return acc;
    return acc + (Number(item.cantidad) || 1);
  }, 0);
}

// Clasificador del menú real de Súa (9 bebidas base)
function clasificarBebida(nombreRaw: string, extrasRaw: string) {
  const texto = normalizarTexto(`${nombreRaw} ${extrasRaw}`);
  const tieneVainilla = texto.includes('vainilla');

  // Sección Frappés (usan licuadora)
  if (texto.includes('frap')) {
    if (texto.includes('oreo')) {
      return { peso: 9, seccion: 'frappe' as SeccionBarra, tipoLicuadora: 'oreo' as const, tiempoBaseSeg: 45 };
    }
    if (texto.includes('caramel')) {
      return { peso: 8, seccion: 'frappe' as SeccionBarra, tipoLicuadora: 'claro' as const, tiempoBaseSeg: 45 };
    }
    return { peso: 7, seccion: 'frappe' as SeccionBarra, tipoLicuadora: 'claro' as const, tiempoBaseSeg: 45 };
  }

  // Sección Fría (a las rocas, sin vapor)
  if (texto.includes('frio') || texto.includes('rocas')) {
    return { peso: 2, seccion: 'fria' as SeccionBarra, tipoLicuadora: 'ninguno' as const, tiempoBaseSeg: 30 };
  }

  // Sección Caliente
  if (texto.includes('americano')) {
    return { peso: 1, seccion: 'caliente' as SeccionBarra, tipoLicuadora: 'ninguno' as const, tiempoBaseSeg: 25 };
  }
  if (texto.includes('latte')) {
    return {
      peso: tieneVainilla ? 4 : 3,
      seccion: 'caliente' as SeccionBarra,
      tipoLicuadora: 'ninguno' as const,
      tiempoBaseSeg: 40,
    };
  }
  if (texto.includes('capuchino') || texto.includes('cappuccino')) {
    return {
      peso: tieneVainilla ? 6 : 5,
      seccion: 'caliente' as SeccionBarra,
      tipoLicuadora: 'ninguno' as const,
      tiempoBaseSeg: 45,
    };
  }

  // Respaldo seguro para cualquier bebida caliente nueva
  return { peso: 5, seccion: 'caliente' as SeccionBarra, tipoLicuadora: 'ninguno' as const, tiempoBaseSeg: 40 };
}

// ============================================================
// 4. ORDENAMIENTO POR MEZCLA (Merge Sort - Divide y Vencerás)
// Complejidad: O(V log V)
// ============================================================
function mergeSortPorPeso(lista: NodoBebida[]): NodoBebida[] {
  if (lista.length <= 1) return lista;

  const mitad = Math.floor(lista.length / 2);
  const izquierda = mergeSortPorPeso(lista.slice(0, mitad));
  const derecha = mergeSortPorPeso(lista.slice(mitad));

  return mezclar(izquierda, derecha);
}

function mezclar(izq: NodoBebida[], der: NodoBebida[]): NodoBebida[] {
  const resultado: NodoBebida[] = [];
  let i = 0;
  let j = 0;

  while (i < izq.length && j < der.length) {
    if (izq[i].peso <= der[j].peso) {
      resultado.push(izq[i++]);
    } else {
      resultado.push(der[j++]);
    }
  }
  return resultado.concat(izq.slice(i)).concat(der.slice(j));
}

// ============================================================
// 5. MOTOR PRINCIPAL: TABLA HASH + GRAFO DE KAHN + MERGE SORT
// ============================================================
export function optimizarComandasKaizen(pedidosEntrantes: any[]): ResultadoKaizen {
  const tablaHash = new Map<string, NodoBebida>();
  const coloresPorPedido: Record<string, ColorPedido> = {};
  const listaCrudaFifo: { tipoLicuadora: 'ninguno' | 'claro' | 'oreo'; tiempoBaseSeg: number }[] = [];

  // --- FASE 1: AGRUPACIÓN EN TABLA HASH (Map) -> O(N) ---
  for (const pedido of pedidosEntrantes) {
    const idFull = String(pedido.id);
    const idCorto = idFull.slice(-4).toUpperCase();
    const colorAsignado = obtenerColorEstable(idFull);
    coloresPorPedido[idFull] = colorAsignado;

    const items = Array.isArray(pedido.items) ? pedido.items : [];

    for (const item of items) {
      if (!esBebidaBarista(item)) continue;

      const nombre = String(item.nombre || 'Bebida').trim();
      const extras = String(item.extras_str || '').trim();
      const cantidad = Number(item.cantidad) || 1;
      const info = clasificarBebida(nombre, extras);

      for (let k = 0; k < cantidad; k++) {
        listaCrudaFifo.push({
          tipoLicuadora: info.tipoLicuadora,
          tiempoBaseSeg: info.tiempoBaseSeg,
        });
      }

      const llave = `${nombre.toUpperCase()} | ${extras.toUpperCase()}`;
      const origen: OrigenPedido = {
        pedidoIdFull: idFull,
        pedidoCorto: idCorto,
        cliente: pedido.cliente_nombre || 'Cliente',
        cantidad,
        color: colorAsignado,
      };

      if (tablaHash.has(llave)) {
        const nodo = tablaHash.get(llave)!;
        nodo.cantidadTotal += cantidad;
        const origenExistente = nodo.origenes.find((o) => o.pedidoIdFull === idFull);
        if (origenExistente) {
          origenExistente.cantidad += cantidad;
        } else {
          nodo.origenes.push(origen);
        }
      } else {
        tablaHash.set(llave, {
          id: llave,
          nombre,
          extras,
          cantidadTotal: cantidad,
          peso: info.peso,
          seccion: info.seccion,
          tipoLicuadora: info.tipoLicuadora,
          tiempoBaseSeg: info.tiempoBaseSeg,
          ordenGlobal: 0,
          origenes: [origen],
        });
      }
    }
  }

  const nodos = Array.from(tablaHash.values());

  // --- FASE 2: CONSTRUCCIÓN DEL GRAFO DIRIGIDO (DAG) -> O(V + E) ---
  const adyacencia = new Map<string, string[]>();
  const candados = new Map<string, number>();
  const mapaNodos = new Map<string, NodoBebida>();

  for (const nodo of nodos) {
    mapaNodos.set(nodo.id, nodo);
    adyacencia.set(nodo.id, []);
    candados.set(nodo.id, 0);
  }

  const frappesClaros = nodos.filter((n) => n.tipoLicuadora === 'claro');
  const frappesOreo = nodos.filter((n) => n.tipoLicuadora === 'oreo');
  const hayBarreraOreo = frappesClaros.length > 0 && frappesOreo.length > 0;

  // Nodo Barrera virtual: evita explosión cuadrática de flechas (E lineal)
  const ID_BARRERA = '__BARRERA_OREO__';
  if (hayBarreraOreo) {
    adyacencia.set(ID_BARRERA, []);
    candados.set(ID_BARRERA, 0);

    for (const claro of frappesClaros) {
      adyacencia.get(claro.id)!.push(ID_BARRERA);
      candados.set(ID_BARRERA, (candados.get(ID_BARRERA) || 0) + 1);
    }
    for (const oreo of frappesOreo) {
      adyacencia.get(ID_BARRERA)!.push(oreo.id);
      candados.set(oreo.id, (candados.get(oreo.id) || 0) + 1);
    }
  }

  // --- FASE 3: ALGORITMO DE KAHN + MERGE SORT -> O(V log V + E) ---
  let colaLibres: string[] = [];
  for (const [id, numCandados] of candados.entries()) {
    if (numCandados === 0) colaLibres.push(id);
  }

  const comandaOptimizada: NodoBebida[] = [];
  let contadorOrden = 1;

  while (colaLibres.length > 0) {
    const nodosRealesLibres = colaLibres
      .filter((id) => id !== ID_BARRERA)
      .map((id) => mapaNodos.get(id)!);

    const ordenados = mergeSortPorPeso(nodosRealesLibres);
    const ordenIdsEstaOleada = ordenados.map((n) => n.id);

    if (colaLibres.includes(ID_BARRERA)) {
      ordenIdsEstaOleada.push(ID_BARRERA);
    }

    const siguienteOleada: string[] = [];

    for (const idActual of ordenIdsEstaOleada) {
      if (idActual !== ID_BARRERA) {
        const nodo = mapaNodos.get(idActual)!;
        nodo.ordenGlobal = contadorOrden++;
        comandaOptimizada.push(nodo);
      }

      const vecinos = adyacencia.get(idActual) || [];
      for (const vecinoId of vecinos) {
        const nuevosCandados = (candados.get(vecinoId) || 1) - 1;
        candados.set(vecinoId, nuevosCandados);
        if (nuevosCandados === 0) {
          siguienteOleada.push(vecinoId);
        }
      }
    }
    colaLibres = siguienteOleada;
  }

  const porSeccion = {
    caliente: comandaOptimizada.filter((n) => n.seccion === 'caliente'),
    fria: comandaOptimizada.filter((n) => n.seccion === 'fria'),
    frappe: comandaOptimizada.filter((n) => n.seccion === 'frappe'),
  };

  const estadisticas = simularComparativa(listaCrudaFifo, comandaOptimizada);

  return { comandaOptimizada, porSeccion, coloresPorPedido, hayBarreraOreo, estadisticas };
}

// ============================================================
// 6. SIMULADOR DETERMINISTA (Comparativa FIFO vs KAIZEN)
// ============================================================
function simularComparativa(
  fifo: { tipoLicuadora: 'ninguno' | 'claro' | 'oreo'; tiempoBaseSeg: number }[],
  kaizen: NodoBebida[]
) {
  const PENALIZACION_LAVADO_SEG = 30;

  let tiempoFifoSeg = 0;
  let lavadosFifo = 0;
  let licuadoraSuciaOreo = false;

  for (const b of fifo) {
    if (b.tipoLicuadora === 'claro' && licuadoraSuciaOreo) {
      tiempoFifoSeg += PENALIZACION_LAVADO_SEG;
      lavadosFifo++;
      licuadoraSuciaOreo = false;
    }
    tiempoFifoSeg += b.tiempoBaseSeg;
    if (b.tipoLicuadora === 'oreo') licuadoraSuciaOreo = true;
  }

  let tiempoKaizenSeg = 0;
  let lavadosKaizen = 0;
  licuadoraSuciaOreo = false;

  for (const lote of kaizen) {
    if (lote.tipoLicuadora === 'claro' && licuadoraSuciaOreo) {
      tiempoKaizenSeg += PENALIZACION_LAVADO_SEG;
      lavadosKaizen++;
      licuadoraSuciaOreo = false;
    }
    const capacidadMaquina = lote.tipoLicuadora !== 'ninguno' || lote.peso === 3 ? 2 : 1;
    const ciclosReales = Math.ceil(lote.cantidadTotal / capacidadMaquina);
    tiempoKaizenSeg += ciclosReales * lote.tiempoBaseSeg;
    if (lote.tipoLicuadora === 'oreo') licuadoraSuciaOreo = true;
  }

  return {
    tiempoFifoSeg,
    tiempoKaizenSeg,
    lavadosFifo,
    lavadosKaizen,
    ahorroSegundos: Math.max(0, tiempoFifoSeg - tiempoKaizenSeg),
  };
}