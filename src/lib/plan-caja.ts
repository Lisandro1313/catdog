/**
 * Qué hacer con la plata que hay en la caja.
 *
 * El orden no es opinión: primero se aparta lo que ya se debe (el alquiler y los servicios corren
 * aunque no se cocine), después lo que hay que comprar para la próxima fecha, y recién lo que sobra
 * se puede repartir. Un negocio chico se funde por gastar en orden inverso.
 *
 * Puro y sin base de datos, para poder probarlo.
 */

export type Apartado = {
  concepto: string;
  monto: number;
  /** Por qué se aparta, en criollo. */
  porque: string;
  /** Cuánto de lo apartado se puede cubrir hoy con la plata que hay. */
  cubierto: number;
};

export type PlanCaja = {
  /** Lo que hay en total (billete + cuenta). */
  disponible: number;
  apartados: Apartado[];
  /** Lo que queda libre después de apartar todo. Nunca negativo. */
  libre: number;
  /** Cuánto falta para cubrir todo lo apartado. Cero si alcanza. */
  falta: number;
  /** Una línea con el estado, para leer de un vistazo. */
  titular: string;
};

export type EntradaPlan = {
  disponible: number;
  /** Gastos fijos de un mes (alquiler, luz, gas, internet). */
  fijosMensuales: number;
  /** Cuántos días faltan para el próximo vencimiento de los fijos. */
  diasHastaFijos: number;
  /** Lo que suele costar la mercadería de una fecha. */
  mercaderiaProxima: number;
  /** Cuánto se le debe a los socios por lo que pusieron de su bolsillo. */
  deudaSocios: number;
};

/**
 * Reparte la plata de la caja en lo que hay que apartar, por orden de urgencia.
 *
 * El alquiler se aparta en proporción a lo que falta para pagarlo: si faltan 30 días se aparta el mes
 * entero; si faltan 10, un tercio ya debería estar guardado. Así no aparece de golpe a fin de mes.
 */
export function planDeCaja(e: EntradaPlan): PlanCaja {
  const disponible = Math.max(0, Math.round(e.disponible));

  // Cuanto más cerca el vencimiento, más tiene que estar ya guardado.
  const avance = e.fijosMensuales > 0 ? Math.min(1, Math.max(0, (30 - Math.min(30, Math.max(0, e.diasHastaFijos))) / 30)) : 0;
  const guardarFijos = Math.round(e.fijosMensuales * Math.max(avance, e.diasHastaFijos <= 0 ? 1 : 0));

  const crudos = [
    {
      concepto: "Alquiler y servicios",
      monto: guardarFijos,
      porque:
        e.diasHastaFijos <= 0
          ? "Ya vencieron: esto se paga antes que nada."
          : `Faltan ${e.diasHastaFijos} días. Guardando de a poco no aparece de golpe.`,
    },
    {
      concepto: "Mercadería de la próxima fecha",
      monto: Math.round(Math.max(0, e.mercaderiaProxima)),
      porque: "Sin esto no hay qué cocinar, y comprar con lo justo sale más caro.",
    },
    {
      concepto: "Devolver a los socios",
      monto: Math.round(Math.max(0, e.deudaSocios)),
      porque: "Lo que pusieron de su bolsillo. Va después de lo que hace falta para operar.",
    },
  ].filter((a) => a.monto > 0);

  // Se cubre por orden: lo primero se lleva la plata que hay, lo último puede quedar sin cubrir.
  let resto = disponible;
  const apartados: Apartado[] = crudos.map((a) => {
    const cubierto = Math.min(resto, a.monto);
    resto -= cubierto;
    return { ...a, cubierto };
  });

  const totalApartado = apartados.reduce((n, a) => n + a.monto, 0);
  const falta = Math.max(0, totalApartado - disponible);
  const libre = Math.max(0, disponible - totalApartado);

  let titular: string;
  if (disponible === 0) titular = "No hay plata en la caja.";
  else if (falta > 0) titular = `Falta plata para lo que se viene: no alcanza por ${falta}.`;
  else if (libre === 0) titular = "La plata de la caja está justa para lo que se viene.";
  else titular = `Después de guardar lo necesario, quedan ${libre} libres.`;

  return { disponible, apartados, libre, falta, titular };
}

/** Cuántos días faltan para el primero del mes que viene, que es cuando suelen vencer los fijos. */
export function diasHastaFinDeMes(hoy: Date): number {
  const proximo = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1);
  return Math.max(0, Math.ceil((proximo.getTime() - hoy.getTime()) / (24 * 60 * 60 * 1000)));
}
