"use client";

import { useEffect, useRef, useState } from "react";
import { METAS, type Marcas, type Records } from "@/lib/juegos";
import { Shell, beep, buzz, keepAwake } from "./Shell";
import { Fin } from "./Fin";

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
  { id: "pan", label: "Pan", emoji: "🍞" },
  { id: "tomate", label: "Tomate", emoji: "🍅" },
  { id: "aceite", label: "Aceite", emoji: "🫒" },
  { id: "albahaca", label: "Albahaca", emoji: "🌿" },
  { id: "arroz", label: "Arroz", emoji: "🍚" },
  { id: "queso", label: "Queso", emoji: "🧀" },
  { id: "freir", label: "Freír", emoji: "🔥" },
  { id: "langostino", label: "Langostino", emoji: "🦐" },
  { id: "ajo", label: "Ajo", emoji: "🧄" },
];
const byId = new Map(ING.map((i) => [i.id, i]));

type Recipe = { name: string; steps: string[] };
const RECIPES: Recipe[] = [
  { name: "Gin tonic", steps: ["copa", "hielo", "gin", "tonica", "lima"] },
  { name: "Negroni", steps: ["vaso", "hielo", "gin", "vermut", "bitter", "naranja"] },
  { name: "Vermut con soda", steps: ["copa", "hielo", "vermut", "soda", "naranja"] },
  { name: "Fernet con coca", steps: ["vaso", "hielo", "fernet", "coca"] },
  { name: "Bruschetta", steps: ["pan", "tomate", "aceite", "albahaca"] },
  { name: "Arancini", steps: ["arroz", "queso", "freir"] },
  { name: "Langostinos al ajillo", steps: ["langostino", "ajo", "aceite"] },
  { name: "Tostada con queso", steps: ["pan", "queso", "aceite"] },
];
const CLIENTES = ["🧑", "👩", "👨", "🧔", "👵", "👴", "👩‍🦱", "🧑‍🦳", "👱", "🧕"];
const NOMBRES = ["Raúl", "Vero", "Nico", "La Colo", "Tomás", "Flor", "Don Héctor", "Male", "Seba", "Juli"];
const LIVES = 3;

type Order = { name: string; face: string; recipe: Recipe; got: string[]; deadline: number; total: number; hidden: boolean };
type Props = { onDone: (served: number) => void; onBack: () => void; marcas: Marcas; records: Records; nueva?: boolean };

/** Un cliente nuevo con su pedido (fuera del componente: es un evento, no render). */
function newOrder(n: number): Order {
  const lvl = Math.floor(n / 3) + 1;
  const recipe = RECIPES[Math.floor(Math.random() * RECIPES.length)];
  const total = Math.max(6000, 16000 - lvl * 1600);
  const k = Math.floor(Math.random() * CLIENTES.length);
  return { name: NOMBRES[k], face: CLIENTES[k], recipe, got: [], deadline: Date.now() + total, total, hidden: false };
}

/** Milisegundos ahora (helper para que el compilador no lo vea como parte del render). */
function now(): number {
  return Date.now();
}

/**
 * Servicio: llega un cliente y pide algo de la casa; vos tocás los ingredientes que lleva (en cualquier orden).
 * Un ingrediente equivocado le come paciencia; si se le acaba, se va y perdés una vida. Cada tres pedidos
 * sube el nivel: menos paciencia, y desde el nivel 3 la receta se esconde a los pocos segundos.
 */
export function Servicio({ onDone, onBack, marcas, records, nueva }: Props) {
  const [phase, setPhase] = useState<"idle" | "play" | "end">("idle");
  const [served, setServed] = useState(0);
  const [lives, setLives] = useState(LIVES);
  const [order, setOrder] = useState<Order | null>(null);
  const [left, setLeft] = useState(100);
  const [flash, setFlash] = useState<string | null>(null);
  const reported = useRef(false);
  const servedRef = useRef(0);
  const livesRef = useRef(LIVES);

  const level = Math.floor(served / 3) + 1;

  function start() {
    keepAwake();
    reported.current = false;
    servedRef.current = 0;
    livesRef.current = LIVES;
    setServed(0);
    setLives(LIVES);
    setFlash(null);
    setOrder(newOrder(0));
    setPhase("play");
  }

  function leave() {
    buzz();
    livesRef.current -= 1;
    setLives(livesRef.current);
    setFlash("Se fue sin comer");
    if (livesRef.current <= 0) {
      setTimeout(() => setPhase("end"), 700);
      return;
    }
    setTimeout(() => {
      setFlash(null);
      setOrder(newOrder(servedRef.current));
    }, 700);
  }

  // Paciencia del cliente + esconder la receta en niveles altos.
  useEffect(() => {
    if (phase !== "play" || !order) return;
    const id = setInterval(() => {
      const ms = order.deadline - now();
      setLeft(Math.max(0, (ms / order.total) * 100));
      if (level >= 3 && !order.hidden && order.total - ms > 3500) setOrder({ ...order, hidden: true });
      if (ms <= 0) {
        clearInterval(id);
        leave();
      }
    }, 100);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, order?.deadline, order?.hidden]);

  function tap(id: string) {
    if (!order || phase !== "play" || flash) return;
    if (order.recipe.steps.includes(id) && !order.got.includes(id)) {
      const got = [...order.got, id];
      beep(500 + got.length * 60, 70);
      if (got.length === order.recipe.steps.length) {
        servedRef.current += 1;
        setServed(servedRef.current);
        beep(900, 160);
        setFlash(`¡${order.recipe.name} para ${order.name}!`);
        setTimeout(() => {
          setFlash(null);
          setOrder(newOrder(servedRef.current));
          beep(1046, 90);
          setTimeout(() => beep(1318, 140), 100);
        }, 650);
      } else setOrder({ ...order, got });
    } else {
      // Ingrediente de más: pierde paciencia.
      buzz();
      setOrder({ ...order, deadline: order.deadline - order.total * 0.22 });
    }
  }

  useEffect(() => {
    if (phase === "end" && !reported.current) {
      reported.current = true;
      onDone(served);
    }
  }, [phase, served, onDone]);

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
          bien="Te contratamos."
          mal={`Para el trago: ${METAS.servicio} pedidos. Desde el nivel 3 la receta se esconde: memorizala.`}
        />
      </Shell>
    );
  }

  if (phase === "idle" || !order) {
    return (
      <Shell title="Servicio" onBack={onBack}>
        <div className="jg-center">
          <p className="text-4xl" aria-hidden="true">
            🧑‍🍳
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Llega un cliente y pide algo de la casa. Tocá los ingredientes que lleva (en cualquier orden) antes de que se le acabe la paciencia. Un ingrediente
            de más lo impacienta; si se va, perdés una de {LIVES} vidas. Cada tres pedidos sube el nivel. Para la marca: {METAS.servicio} pedidos.
          </p>
          <button className="btn btn-primary mt-6" type="button" onClick={start}>
            Abrir la barra
          </button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell title="Servicio" onBack={onBack} right={<>{"❤".repeat(lives)}{"♡".repeat(LIVES - lives)}</>}>
      <div className="mt-3 flex items-baseline justify-between">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">nivel {level}</p>
        <p key={served} className="ap-display text-3xl tabular-nums jg-pop">
          {served}
        </p>
      </div>

      <div className={`jg-cliente mt-3 ${flash ? "is-flash" : ""}`}>
        <span className="jg-cliente-face" aria-hidden="true">
          {order.face}
        </span>
        <div className="min-w-0 flex-1">
          {flash ? (
            <p className="font-display text-lg">{flash}</p>
          ) : (
            <>
              <p className="text-xs text-muted">{order.name} pide</p>
              <p className="font-display text-xl leading-tight">{order.recipe.name}</p>
              <p className="mt-1 flex flex-wrap gap-1 text-sm">
                {order.recipe.steps.map((s) => (
                  <span key={s} className={`jg-ing ${order.got.includes(s) ? "is-got" : order.hidden ? "is-hidden" : ""}`}>
                    {order.got.includes(s) || !order.hidden ? byId.get(s)?.emoji : "?"}
                  </span>
                ))}
              </p>
            </>
          )}
          <div className="jg-timebar mt-2" aria-hidden="true">
            <span style={{ width: `${left}%` }} className={left < 30 ? "is-low" : ""} />
          </div>
        </div>
      </div>

      <div className="jg-ingredientes mt-4">
        {ING.map((i) => (
          <button key={i.id} type="button" className={`jg-ing-btn ${order.got.includes(i.id) ? "is-got" : ""}`} onPointerDown={() => tap(i.id)} aria-label={i.label}>
            <span aria-hidden="true">{i.emoji}</span>
            <span>{i.label}</span>
          </button>
        ))}
      </div>
    </Shell>
  );
}

