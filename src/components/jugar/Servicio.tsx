"use client";

import { useEffect, useRef, useState } from "react";
import { METAS, type Marcas, type Records } from "@/lib/juegos";
import { Shell, beep, buzz, keepAwake, precargarSonidos, sonar, tap as vibrar } from "./Shell";
import { Fin } from "./Fin";
import css from "./Servicio.module.css";
import { Emoji } from "./Emoji";

type Ing = { id: string; label: string; emoji: string };
const ING: Ing[] = [
  { id: "copa", label: "Copa", emoji: "🍷" },
  { id: "vaso", label: "Vaso", emoji: "🥃" },
  { id: "hielo", label: "Hielo", emoji: "🧊" },
  { id: "gin", label: "Gin", emoji: "🍸" },
  { id: "tonica", label: "Tónica", emoji: "🫧" },
  { id: "lima", label: "Lima", emoji: "🍋" },
  { id: "vermut", label: "Vermut", emoji: "🍶" },
  { id: "bitter", label: "Bitter", emoji: "🔴" },
  { id: "naranja", label: "Naranja", emoji: "🍊" },
  { id: "soda", label: "Soda", emoji: "💧" },
  { id: "fernet", label: "Fernet", emoji: "🟤" },
  { id: "coca", label: "Coca", emoji: "🥤" },
  { id: "ron", label: "Ron", emoji: "🍯" },
  { id: "menta", label: "Menta", emoji: "🌱" },
  { id: "azucar", label: "Azúcar", emoji: "🍬" },
  { id: "pan", label: "Pan", emoji: "🍞" },
  { id: "tomate", label: "Tomate", emoji: "🍅" },
  { id: "aceite", label: "Aceite", emoji: "🫒" },
  { id: "albahaca", label: "Albahaca", emoji: "🌿" },
  { id: "arroz", label: "Arroz", emoji: "🍚" },
  { id: "queso", label: "Queso", emoji: "🧀" },
  { id: "freir", label: "Freír", emoji: "🔥" },
  { id: "langostino", label: "Langostino", emoji: "🦐" },
  { id: "ajo", label: "Ajo", emoji: "🧄" },
  { id: "huevo", label: "Huevo", emoji: "🥚" },
  { id: "papa", label: "Papa", emoji: "🥔" },
  { id: "bondiola", label: "Bondiola", emoji: "🥩" },
  { id: "frutilla", label: "Frutilla", emoji: "🍓" },
];
const byId = new Map(ING.map((i) => [i.id, i]));

type Recipe = { name: string; steps: string[] };
const RECIPES: Recipe[] = [
  { name: "Gin tonic", steps: ["copa", "hielo", "gin", "tonica", "lima"] },
  { name: "Negroni", steps: ["vaso", "hielo", "gin", "vermut", "bitter", "naranja"] },
  { name: "Vermut con soda", steps: ["copa", "hielo", "vermut", "soda", "naranja"] },
  { name: "Fernet con coca", steps: ["vaso", "hielo", "fernet", "coca"] },
  { name: "Mojito", steps: ["vaso", "hielo", "ron", "menta", "lima", "azucar", "soda"] },
  { name: "Bruschetta", steps: ["pan", "tomate", "aceite", "albahaca"] },
  { name: "Arancini", steps: ["arroz", "queso", "freir"] },
  { name: "Langostinos al ajillo", steps: ["langostino", "ajo", "aceite"] },
  { name: "Tortilla", steps: ["huevo", "papa", "aceite"] },
  { name: "Sándwich de bondiola", steps: ["pan", "bondiola", "tomate"] },
  { name: "Frutillas con crema", steps: ["frutilla", "azucar"] },
];

type Temper = "tranquilo" | "normal" | "apurado";
type Customer = { name: string; face: string; img?: string; temper: Temper };
const CLIENTES: Customer[] = [
  { name: "Raúl", face: "🧔", temper: "tranquilo" },
  { name: "Vero", face: "👩", temper: "normal" },
  { name: "Nico", face: "🧑", temper: "apurado" },
  { name: "La Colo", face: "👩‍🦱", temper: "normal" },
  { name: "Tomás", face: "👨", temper: "apurado" },
  { name: "Flor", face: "👱", temper: "normal" },
  { name: "Don Héctor", face: "👴", temper: "tranquilo" },
  { name: "Male", face: "🧑‍🦳", temper: "normal" },
  { name: "Seba", face: "🧑‍🦰", temper: "apurado" },
  { name: "Juli", face: "👧", temper: "normal" },
  { name: "Lisandro", face: "🙂", img: "/lisandro.png", temper: "tranquilo" },
  { name: "Agustín", face: "👨‍🍳", img: "/chef.png", temper: "apurado" },
];
const LIVES = 3;

type Order = { id: number; c: Customer; recipe: Recipe; got: string[]; deadline: number; total: number; hidden: boolean; shake: number; vip?: boolean };
type Props = { onDone: (served: number) => void; onBack: () => void; marcas: Marcas; records: Records; nueva?: boolean };

function now(): number {
  return Date.now();
}
function rnd(n: number): number {
  return Math.floor(Math.random() * n);
}
/** Un cliente nuevo con su pedido. La paciencia depende del nivel y del carácter. */
function newOrder(served: number, avoid: string[] = []): Order {
  const lvl = Math.floor(served / 3) + 1;
  // Desde el nivel 2, cada tanto cae el chef con un capricho fuera de carta: vale doble y deja propina grande.
  if (lvl >= 2 && !avoid.includes("Agustín") && Math.random() < 0.14) {
    const c = CLIENTES.find((x) => x.name === "Agustín")!;
    const pool = [...ING];
    const steps: string[] = [];
    while (steps.length < 5) steps.push(pool.splice(rnd(pool.length), 1)[0].id);
    const total = Math.max(9000, 19000 - lvl * 1500);
    return { id: now() + Math.random(), c, recipe: { name: "Capricho del chef", steps }, got: [], deadline: now() + total, total, hidden: false, shake: 0, vip: true };
  }
  let c = CLIENTES[rnd(CLIENTES.length)];
  for (let k = 0; k < CLIENTES.length && avoid.includes(c.name); k++) c = CLIENTES[(CLIENTES.indexOf(c) + 1) % CLIENTES.length];
  const recipe = RECIPES[rnd(RECIPES.length)];
  const base = Math.max(6500, 17000 - lvl * 1500);
  const total = Math.round(base * (c.temper === "apurado" ? 0.75 : c.temper === "tranquilo" ? 1.25 : 1));
  return { id: now() + Math.random(), c, recipe, got: [], deadline: now() + total, total, hidden: false, shake: 0 };
}

/**
 * Servicio: llegan clientes y piden algo de la casa; tocás los ingredientes que lleva (en cualquier orden).
 * Desde el nivel 2 atendés a dos a la vez (tocás al cliente para elegirlo). Cada uno tiene su paciencia:
 * los apurados se van antes. Un ingrediente de más lo impacienta; si se va, perdés una de tres vidas.
 * Rápido = propina. Desde el nivel 3 la receta se esconde a los pocos segundos.
 */
export function Servicio({ onDone, onBack, marcas, records, nueva }: Props) {
  useEffect(() => {
    precargarSonidos(["campana", "pop", "acierto", "monedas"]);
  }, []);
  const [phase, setPhase] = useState<"idle" | "play" | "end">("idle");
  const [served, setServed] = useState(0);
  const [tips, setTips] = useState(0);
  const [lives, setLives] = useState(LIVES);
  const [orders, setOrders] = useState<Order[]>([]);
  const [active, setActive] = useState<number | null>(null);
  const [tick, setTick] = useState(0);
  const [flash, setFlash] = useState<{ text: string; tone: "bien" | "mal" | "nivel"; id: number } | null>(null);
  /** El último ingrediente tocado: brilla verde si iba, rojo si no. */
  const [fb, setFb] = useState<{ id: string; ok: boolean; n: number } | null>(null);
  const reported = useRef(false);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  /** Clientes a los que ya se les avisó que se están por ir (un aviso por cliente). */
  const warned = useRef<Set<number>>(new Set());
  const fbN = useRef(0);
  const servedRef = useRef(0);
  const livesRef = useRef(LIVES);
  const ordersRef = useRef<Order[]>([]);

  const level = Math.floor(served / 3) + 1;
  const slots = level >= 5 ? 3 : level >= 2 ? 2 : 1;

  function later(fn: () => void, ms: number) {
    timers.current.push(setTimeout(fn, ms));
  }
  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach(clearTimeout);
      if (flashTimer.current) clearTimeout(flashTimer.current);
    };
  }, []);

  /** Un cartel por vez, siempre en el mismo lugar (no empuja los botones). */
  function toast(text: string, tone: "bien" | "mal" | "nivel", ms = 1100) {
    if (flashTimer.current) clearTimeout(flashTimer.current);
    setFlash({ text, tone, id: now() });
    flashTimer.current = setTimeout(() => setFlash(null), ms);
  }

  function setOrdersBoth(next: Order[]) {
    ordersRef.current = next;
    setOrders(next);
  }

  function start() {
    keepAwake();
    reported.current = false;
    servedRef.current = 0;
    livesRef.current = LIVES;
    setServed(0);
    setTips(0);
    setLives(LIVES);
    setFlash(null);
    setFb(null);
    warned.current = new Set();
    timers.current.forEach(clearTimeout);
    timers.current.length = 0;
    const first = newOrder(0);
    setOrdersBoth([first]);
    setActive(first.id);
    setPhase("play");
  }

  // Reloj: paciencia, esconder recetas, clientes que se van, y llegada de nuevos cuando hay lugar.
  useEffect(() => {
    if (phase !== "play") return;
    let nextArrival = 0;
    const id = setInterval(() => {
      const t = now();
      let cur = ordersRef.current;
      const lvl = Math.floor(servedRef.current / 3) + 1;
      // Esconder la receta desde el nivel 3 (nivel 5+: casi al toque).
      cur = cur.map((o) => (lvl >= 3 && !o.hidden && o.total - (o.deadline - t) > (lvl >= 5 ? 1500 : 3500) ? { ...o, hidden: true } : o));
      // Los que se cansaron.
      const gone = cur.filter((o) => o.deadline <= t);
      if (gone.length) {
        buzz();
        livesRef.current -= gone.length;
        setLives(Math.max(0, livesRef.current));
        toast(livesRef.current <= 0 ? "Se cerró la barra" : `${gone[0].c.name} se fue sin comer`, "mal");
        cur = cur.filter((o) => o.deadline > t);
        if (livesRef.current <= 0) {
          clearInterval(id);
          setOrdersBoth(cur);
          later(() => setPhase("end"), 1100);
          return;
        }
      }
      // Aviso cuando a alguien le queda poca paciencia (una vez por cliente).
      for (const o of cur) {
        if (!warned.current.has(o.id) && (o.deadline - t) / o.total < 0.25) {
          warned.current.add(o.id);
          beep(392, 70, "square", 0.05);
          later(() => beep(370, 90, "square", 0.05), 110);
        }
      }
      const maxSlots = lvl >= 5 ? 3 : lvl >= 2 ? 2 : 1;
      if (cur.length < maxSlots && t >= nextArrival) {
        const o = newOrder(servedRef.current, cur.map((x) => x.c.name));
        cur = [...cur, o];
        nextArrival = t + 900 + Math.random() * 1500;
        sonar("campana", 0.4);
        vibrar(15);
      }
      if (cur !== ordersRef.current) setOrdersBoth(cur);
      setActive((a) => (a != null && cur.some((o) => o.id === a) ? a : (cur[0]?.id ?? null)));
      setTick(t);
    }, 100);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase === "end" && !reported.current) {
      reported.current = true;
      onDone(served);
    }
  }, [phase, served, onDone]);

  function tap(id: string) {
    if (phase !== "play" || livesRef.current <= 0) return;
    const o = ordersRef.current.find((x) => x.id === active);
    if (!o) return;
    // Ya está en el pedido (doble toque): no es un error.
    if (o.got.includes(id)) {
      beep(300, 30, "triangle", 0.05);
      return;
    }
    fbN.current += 1;
    if (o.recipe.steps.includes(id)) {
      setFb({ id, ok: true, n: fbN.current });
      const got = [...o.got, id];
      sonar("pop", 0.5, 0.9 + got.length * 0.07);
      vibrar(6);
      if (got.length === o.recipe.steps.length) {
        const lvlAntes = Math.floor(servedRef.current / 3) + 1;
        servedRef.current += o.vip ? 2 : 1;
        setServed(servedRef.current);
        const lvl = Math.floor(servedRef.current / 3) + 1;
        const speedy = (o.deadline - now()) / o.total;
        const tip = o.vip ? 1000 : speedy > 0.6 ? 500 : speedy > 0.3 ? 200 : 0;
        if (tip) setTips((x) => x + tip);
        // Campanita de entrega; con propina, monedas.
        sonar("acierto", 0.5);
        if (tip) later(() => sonar("monedas", 0.55), 200);
        if (o.vip) {
          later(() => beep(1200, 120), 350);
          later(() => beep(1500, 240), 480);
          vibrar(30);
        } else vibrar(15);
        if (lvl > lvlAntes && (lvl === 2 || lvl === 3 || lvl === 5)) {
          toast(lvl === 2 ? "Nivel 2: ahora vienen de a dos" : lvl === 3 ? "Nivel 3: la receta se esconde" : "¡Hora pico! Tres a la vez", "nivel", 1700);
          [659, 784, 988].forEach((f, k) => later(() => beep(f, 110, "triangle", 0.13), 420 + k * 100));
        } else toast(o.vip ? `¡El chef aprueba! Vale doble, +$${tip}` : `¡${o.recipe.name} para ${o.c.name}!${tip ? ` +$${tip}` : ""}`, "bien");
        warned.current.delete(o.id);
        const rest = ordersRef.current.filter((x) => x.id !== o.id);
        setOrdersBoth(rest);
        setActive(rest[0]?.id ?? null);
      } else setOrdersBoth(ordersRef.current.map((x) => (x.id === o.id ? { ...x, got } : x)));
    } else {
      // Ingrediente de más: pierde paciencia y se sacude.
      setFb({ id, ok: false, n: fbN.current });
      buzz();
      setOrdersBoth(ordersRef.current.map((x) => (x.id === o.id ? { ...x, deadline: x.deadline - x.total * 0.2, shake: x.shake + 1 } : x)));
    }
  }

  if (phase === "end") {
    return (
      <Shell title="Servicio" onBack={onBack}>
        <Fin
          nueva={nueva}
          game="servicio"
          value={served}
          label={served === 1 ? "1 pedido" : `${served} pedidos`}
          marcas={marcas}
          records={records}
          again={start}
          onBack={onBack}
          bien={`Te contratamos. Propinas: $${tips}.`}
          mal={`Para el trago: ${METAS.servicio} pedidos. Propinas: $${tips}. Los apurados se van antes; desde el nivel 3 la receta se esconde. Si cae el chef con un capricho, vale doble.`}
        />
      </Shell>
    );
  }

  if (phase === "idle") {
    return (
      <Shell title="Servicio" onBack={onBack}>
        <div className="jg-center">
          <p className="text-4xl" aria-hidden="true">
            <Emoji e="🧑‍🍳" size="1.2em" />
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Llegan clientes y piden algo de la casa. Tocá los ingredientes que lleva (en cualquier orden) antes de que se les acabe la paciencia: los apurados se
            van antes, los tranquilos aguantan. Desde el nivel 2 atendés a dos a la vez (tocá al cliente para elegirlo). Un ingrediente de más lo impacienta;
            si se va, perdés una de {LIVES} vidas. Rápido = propina. Para la marca: {METAS.servicio} pedidos.
          </p>
          <button className="btn btn-primary mt-6" type="button" onClick={start}>
            Abrir la barra
          </button>
        </div>
      </Shell>
    );
  }

  const current = orders.find((o) => o.id === active) ?? null;

  return (
    <Shell
      title="Servicio"
      onBack={onBack}
      right={
        <span key={lives} className={lives < LIVES ? css.vidaMenos : ""} aria-label={`${lives} vidas`}>
          {Array.from({ length: LIVES }, (_, k) => (
            <Emoji key={k} e="❤️" size="1.05em" style={k < lives ? undefined : { filter: "grayscale(1)", opacity: 0.3 }} />
          ))}
        </span>
      }
    >
      <div className="mt-3 flex items-baseline justify-between">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">
          nivel {level}
          {level >= 5 && <span className="ml-2 text-danger">hora pico</span>}
          {tips > 0 && (
            <span key={tips} className={`ml-2 inline-block normal-case tracking-normal text-accent ${css.propina}`}>
              ${tips} de propina
            </span>
          )}
        </p>
        <p key={served} className="ap-display text-3xl tabular-nums jg-pop">
          {served}
        </p>
      </div>

      {/* Lugar fijo para el cartel: aparece encima, sin correr los botones de abajo. */}
      <div className={css.cartelSlot} aria-live="polite">
        {flash && (
          <p key={flash.id} className={`jg-servicio-flash ${css.cartel} ${css[flash.tone]}`}>
            {flash.text}
          </p>
        )}
      </div>

      <div className={`grid gap-2 ${css.barra} ${slots === 3 ? "grid-cols-3 jg-pico" : slots === 2 ? "grid-cols-2" : ""}`}>
        {orders.map((o) => {
          const left = Math.max(0, ((o.deadline - (tick || now())) / o.total) * 100);
          const on = o.id === active;
          const humor = left > 60 ? "🙂" : left > 30 ? "😐" : "😤";
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => setActive(o.id)}
              className={`jg-cliente ${css.cliente} ${on ? "is-on" : "is-off"} ${o.shake ? (o.shake % 2 ? css.sacudeA : css.sacudeB) : ""} ${o.vip ? "is-vip" : ""} ${left < 25 ? css.urgente : ""}`}
              aria-pressed={on}
            >
              <span className="relative flex-none">
                {o.c.img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={o.c.img} alt="" className="jg-cliente-img" />
                ) : (
                  <span className="jg-cliente-face" aria-hidden="true">
                    <Emoji e={o.c.face} />
                  </span>
                )}
                <span key={humor} className={css.humor} aria-hidden="true">
                  <Emoji e={humor} style={{ display: "block" }} />
                </span>
              </span>
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-xs text-muted">
                  {o.c.name}
                  {o.vip ? <span className="text-accent"> · fuera de carta, vale doble</span> : o.c.temper === "apurado" ? " · apurado" : o.c.temper === "tranquilo" ? " · tranqui" : ""}
                </p>
                <p className="truncate font-display text-lg leading-tight">{o.recipe.name}</p>
                <p className="mt-1 flex flex-wrap gap-1 text-sm">
                  {o.recipe.steps.map((s) => (
                    <span key={s} className={`jg-ing ${o.got.includes(s) ? `is-got ${css.puesto}` : o.hidden ? "is-hidden" : ""}`}>
                      {o.got.includes(s) || !o.hidden ? <Emoji e={byId.get(s)?.emoji ?? ""} size="1.3em" /> : "?"}
                    </span>
                  ))}
                </p>
                <div className="jg-timebar mt-2" aria-hidden="true">
                  <span style={{ width: `${left}%` }} className={left < 30 ? "is-low" : ""} />
                </div>
              </div>
            </button>
          );
        })}
        {orders.length === 0 && <p className="jg-cliente text-sm text-muted">Nadie en la barra… ya vienen.</p>}
      </div>

      <div className="jg-ingredientes mt-4">
        {ING.map((i) => (
          <button
            key={i.id}
            type="button"
            className={`jg-ing-btn ${css.ing} ${current?.got.includes(i.id) ? "is-got" : ""}`}
            onPointerDown={() => tap(i.id)}
            aria-label={i.label}
            disabled={!current}
          >
            <span aria-hidden="true">
              <Emoji e={i.emoji} size="1.15em" />
            </span>
            <span>{i.label}</span>
            {fb?.id === i.id && <span key={fb.n} className={`${css.toque} ${fb.ok ? css.toqueBien : css.toqueMal}`} aria-hidden="true" />}
          </button>
        ))}
      </div>
    </Shell>
  );
}
