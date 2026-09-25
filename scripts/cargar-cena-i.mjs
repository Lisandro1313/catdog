/**
 * Carga los insumos y las recetas de la Cena I · La Despensa, para que el escandallo, el punto de
 * equilibrio y la matriz de la carta arranquen con datos de verdad en vez de estar vacíos.
 *
 *   node scripts/cargar-cena-i.mjs           → muestra lo que haría, sin tocar nada
 *   node scripts/cargar-cena-i.mjs --aplicar → lo escribe
 *
 * IMPORTANTE: los precios son ESTIMADOS de mercado, no los que paga la casa. Quedan marcados como
 * estimados y hay que confirmarlos contra un ticket antes de decidir nada con estos números.
 * Las cantidades y las mermas sí salen de cómo se cocina cada plato.
 *
 * Es idempotente: se puede correr de nuevo sin duplicar nada.
 */
import fs from "node:fs";
import pg from "pg";

const aplicar = process.argv.includes("--aplicar");
const url = fs.readFileSync(".env.local", "utf8").match(/^DATABASE_URL="?([^"\n\r]+)/m)[1];

/** [nombre, unidad, precio estimado, cuánto trae, merma %] */
const INSUMOS = [
  // Bebidas y barra
  ["Gin", "ml", 18000, 750, 0],
  ["Campari", "ml", 15000, 750, 0],
  ["Aperol", "ml", 14000, 750, 0],
  ["Cynar", "ml", 12000, 750, 0],
  ["Vermut rosso", "ml", 9000, 1000, 0],
  ["Punt e Mes", "ml", 14000, 750, 0],
  ["Vodka", "ml", 12000, 750, 0],
  ["Malbec", "ml", 8000, 750, 0],
  ["Licor de cítricos", "ml", 12000, 750, 0],
  ["Tónica", "ml", 3500, 1500, 0],
  ["Soda", "ml", 1800, 1500, 0],
  ["Cerveza negra", "ml", 3000, 500, 0],
  // Verdulería (la merma es lo que se pierde al pelar o exprimir)
  ["Limón", "g", 2500, 1000, 60],
  ["Pomelo", "g", 2500, 1000, 60],
  ["Naranja", "g", 2000, 1000, 60],
  ["Menta", "g", 1200, 50, 20],
  ["Romero", "g", 1200, 50, 20],
  ["Tomillo", "g", 1200, 50, 20],
  ["Pepino", "g", 1800, 1000, 15],
  ["Cebolla", "g", 1500, 1000, 15],
  ["Ajo", "g", 1500, 100, 20],
  ["Perejil", "g", 800, 100, 30],
  ["Papa", "g", 1200, 1000, 20],
  ["Frutilla", "g", 6000, 1000, 10],
  ["Frutos rojos", "g", 7000, 500, 5],
  // Almacén y carnicería
  ["Arroz carnaroli", "g", 4500, 1000, 0],
  ["Carne picada", "g", 9000, 1000, 5],
  ["Salsa passata", "g", 3000, 700, 0],
  ["Pan de campo", "g", 5000, 1000, 10],
  ["Huevo", "u", 4800, 12, 0],
  ["Langostinos", "g", 22000, 1000, 40],
  ["Bondiola", "g", 11000, 1000, 20],
  ["Mostaza", "g", 4000, 500, 0],
  ["Crema", "ml", 4500, 500, 0],
  ["Aceto balsámico", "ml", 5500, 500, 0],
  ["Aceite de oliva", "ml", 7000, 500, 0],
  ["Pimienta negra", "g", 4000, 100, 0],
  ["Azúcar", "g", 1500, 1000, 0],
];

/** Cada receta: nombre, cómo figura en la carta, porciones, precio de venta, y qué lleva por receta entera. */
const RECETAS = [
  // --- Los cinco pasos de la cena. Se hacen para los 15 de la mesa.
  {
    nombre: "Arancini de arroz y carne",
    cartaItem: "Arancini de arroz y carne en salsa passata",
    porciones: 15,
    precioVenta: null,
    items: [
      ["Arroz carnaroli", 900],
      ["Carne picada", 600],
      ["Salsa passata", 700],
      ["Cebolla", 300],
      ["Huevo", 3],
      ["Aceite de oliva", 200],
    ],
  },
  {
    nombre: "Tortilla en bruschetta",
    cartaItem: "Tortilla en bruschetta",
    porciones: 15,
    precioVenta: null,
    items: [
      ["Papa", 1500],
      ["Huevo", 10],
      ["Cebolla", 400],
      ["Pan de campo", 600],
      ["Aceite de oliva", 250],
    ],
  },
  {
    nombre: "Langostinos al ajillo",
    cartaItem: "Langostinos al ajillo",
    porciones: 15,
    precioVenta: null,
    items: [
      ["Langostinos", 1350],
      ["Ajo", 60],
      ["Perejil", 30],
      ["Aceite de oliva", 200],
    ],
  },
  {
    nombre: "Bondiola braseada en cerveza negra",
    cartaItem: "Bondiola braseada en cerveza negra y mostaza",
    porciones: 15,
    precioVenta: null,
    items: [
      ["Bondiola", 2400],
      ["Cerveza negra", 500],
      ["Mostaza", 120],
      ["Cebolla", 500],
      ["Papa", 1500],
    ],
  },
  {
    nombre: "Frutillas con crema y aceto",
    cartaItem: "Frutillas con crema, aceto y pimienta negra",
    porciones: 15,
    precioVenta: null,
    items: [
      ["Frutilla", 1500],
      ["Crema", 400],
      ["Aceto balsámico", 80],
      ["Azúcar", 100],
      ["Pimienta negra", 4],
    ],
  },
  // --- Los tragos de la barra. Estos sí se piden de a uno y tienen precio.
  {
    nombre: "Jardín de la Abuela",
    cartaItem: "Jardín de la Abuela",
    porciones: 1,
    precioVenta: 5000,
    items: [
      ["Gin", 60],
      ["Tónica", 150],
      ["Pomelo", 40],
      ["Menta", 2],
    ],
  },
  {
    nombre: "Jazz Tropical",
    cartaItem: "Jazz Tropical",
    porciones: 1,
    precioVenta: 5000,
    items: [
      ["Gin", 40],
      ["Campari", 20],
      ["Vermut rosso", 20],
      ["Malbec", 20],
      ["Azúcar", 10],
      ["Tónica", 120],
      ["Pomelo", 40],
      ["Tomillo", 1],
    ],
  },
  {
    nombre: "Vita di Aperol",
    cartaItem: "Vita di Aperol",
    porciones: 1,
    precioVenta: 5000,
    items: [
      ["Gin", 40],
      ["Aperol", 40],
      ["Tónica", 150],
      ["Limón", 30],
    ],
  },
  {
    nombre: "Black Cynar Julep",
    cartaItem: "Black Cynar Julep",
    porciones: 1,
    precioVenta: 5000,
    items: [
      ["Cynar", 60],
      ["Pomelo", 60],
      ["Soda", 120],
      ["Menta", 2],
    ],
  },
  {
    nombre: "Gin Bill",
    cartaItem: "Gin Bill",
    porciones: 1,
    precioVenta: 5000,
    items: [
      ["Gin", 45],
      ["Campari", 25],
      ["Malbec", 20],
      ["Azúcar", 10],
      ["Pomelo", 40],
      ["Limón", 20],
    ],
  },
];

const c = new pg.Client({ connectionString: url });
await c.connect();

const id = () => "seed" + Math.random().toString(36).slice(2, 12) + Date.now().toString(36);

let insumosNuevos = 0;
const idsInsumo = new Map();
for (const [nombre, unidad, precio, cantidad, merma] of INSUMOS) {
  const { rows } = await c.query('select id from "Insumo" where nombre = $1', [nombre]);
  if (rows.length > 0) {
    idsInsumo.set(nombre, rows[0].id);
    continue;
  }
  insumosNuevos += 1;
  const nuevo = id();
  idsInsumo.set(nombre, nuevo);
  if (aplicar) {
    await c.query(
      'insert into "Insumo" (id, nombre, unidad, precio, cantidad, merma, estimado, "updatedAt") values ($1,$2,$3,$4,$5,$6,true,now())',
      [nuevo, nombre, unidad, precio, cantidad, merma],
    );
  }
}

let recetasNuevas = 0;
let itemsNuevos = 0;
for (const r of RECETAS) {
  const { rows } = await c.query('select id from "Receta" where nombre = $1', [r.nombre]);
  let recetaId = rows[0]?.id;
  if (!recetaId) {
    recetasNuevas += 1;
    recetaId = id();
    if (aplicar) {
      await c.query('insert into "Receta" (id, nombre, porciones, "precioVenta", "cartaItem", "updatedAt") values ($1,$2,$3,$4,$5,now())', [
        recetaId,
        r.nombre,
        r.porciones,
        r.precioVenta,
        r.cartaItem,
      ]);
    }
  }
  for (const [insumo, cantidad] of r.items) {
    const insumoId = idsInsumo.get(insumo);
    if (!insumoId) throw new Error("falta el insumo " + insumo);
    itemsNuevos += 1;
    if (aplicar) {
      await c.query(
        'insert into "RecetaItem" (id, "recetaId", "insumoId", cantidad) values ($1,$2,$3,$4) on conflict ("recetaId","insumoId") do update set cantidad = excluded.cantidad',
        [id(), recetaId, insumoId, cantidad],
      );
    }
  }
}

console.log(aplicar ? "APLICADO" : "SIMULACIÓN (nada se escribió; pasá --aplicar)");
console.log(`  Insumos a crear: ${insumosNuevos} (de ${INSUMOS.length}; los que ya existían no se tocan)`);
console.log(`  Recetas a crear: ${recetasNuevas} de ${RECETAS.length}`);
console.log(`  Ingredientes en recetas: ${itemsNuevos}`);
console.log("  Todos los precios quedan marcados como ESTIMADOS hasta que se confirmen contra un ticket.");

await c.end();
