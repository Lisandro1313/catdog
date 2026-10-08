"use client";

import { useLayoutEffect, useRef, type RefObject } from "react";
import { gsap } from "gsap";
import { COLOR, PART, estrellas, reducido, sacudir } from "./fx";
import f from "./Fx.module.css";

/**
 * El cartel de "RANK UP!" (o de logro) a la manera de Persona 5: dos franjas que cruzan la
 * pantalla, letras que caen de a una y estrellas. No tapa los toques. Se monta con una `key`
 * nueva cada vez que tiene que salir.
 */
export function RankUp({ tipo, titulo, valor, camara }: { tipo: "rango" | "logro"; titulo: string; valor?: string; camara?: RefObject<HTMLElement | null> }) {
  const root = useRef<HTMLDivElement>(null);
  const chispas = useRef<HTMLDivElement>(null);
  const grande = tipo === "rango" ? "RANK UP!" : "¡LOGRO!";

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      if (reducido()) {
        gsap.timeline().fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }).to(el, { autoAlpha: 0, duration: 0.3, delay: 1.4 });
        return;
      }
      const tl = gsap.timeline();
      tl.set(el, { autoAlpha: 1 })
        .fromTo(`.${f.rankRojo}`, { scaleX: 0 }, { scaleX: 1, transformOrigin: "0% 50%", duration: 0.24, ease: "power4.out" })
        .fromTo(`.${f.rankBanda}`, { scaleX: 0 }, { scaleX: 1, transformOrigin: "100% 50%", duration: 0.24, ease: "power4.out" }, 0.05)
        .fromTo(`.${f.rankChico}`, { x: -80, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.25, ease: "back.out(2)" }, 0.15)
        .fromTo(
          `.${f.rankLetra}`,
          { y: -140, scale: 2.6, autoAlpha: 0, rotation: 0 },
          { y: 0, scale: 1, autoAlpha: 1, rotation: (i: number) => (i % 2 ? 5 : -6), duration: 0.32, ease: "back.out(3)", stagger: 0.035 },
          0.2,
        )
        .call(
          () => {
            sacudir(camara?.current ?? null, 0.8);
            estrellas(chispas.current, 0.5, 0.48, tipo === "logro" ? [COLOR.oro, COLOR.blanco] : [COLOR.blanco, COLOR.rojo, COLOR.oro]);
          },
          undefined,
          0.48,
        )
        .fromTo(`.${f.rankValor}`, { scale: 0, rotation: -25 }, { scale: 1, rotation: -4, duration: 0.35, ease: "back.out(3)" }, 0.5)
        .to(`.${f.rankLetra}`, { y: -6, duration: 0.5, ease: "sine.inOut", stagger: { each: 0.04, yoyo: true, repeat: 1 } }, 0.85)
        .to(el, { xPercent: 35, autoAlpha: 0, duration: 0.28, ease: "power3.in" }, 1.95);
    }, el);
    return () => ctx.revert();
  }, [tipo, camara]);

  return (
    <div ref={root} className={`${f.rank} ${tipo === "logro" ? f.rankLogro : ""}`} aria-hidden="true">
      <div className={f.rankRojo} />
      <div className={f.rankBanda} />
      <div className={f.rankTexto}>
        <p className={f.rankChico}>{tipo === "rango" ? titulo : "Logro desbloqueado"}</p>
        <p className={f.rankGrande}>
          {[...grande].map((c, i) => (
            <span key={i} className={c === " " ? f.rankEspacio : f.rankLetra}>
              {c}
            </span>
          ))}
        </p>
        <p className={f.rankValor}>{tipo === "rango" ? `Rango ${valor ?? ""}` : titulo}</p>
      </div>
      <div ref={chispas} className={f.capa} />
    </div>
  );
}

const BRILLOS = ["star_04", "star_06", "flare_01", "light_02", "star_08", "spark_06", "star_01"].map(PART);
const HUMOS = ["smoke_02", "smoke_04", "smoke_07", "smoke_09", "smoke_05"].map(PART);
const LLAMAS = ["light_01", "light_03", "flame_02"].map(PART);

/**
 * Partículas de ambiente, encima del fondo: brillos en las escenas ilustradas, humo y luz de vela
 * en el apagón. Pocas (menos de diez) y solo transform/opacity: livianas en el teléfono.
 */
export function Ambiente({ tipo }: { tipo: "brillo" | "velas" }) {
  const root = useRef<HTMLDivElement>(null);
  const lista = tipo === "brillo" ? BRILLOS : [...HUMOS, ...LLAMAS];

  useLayoutEffect(() => {
    const el = root.current;
    if (!el || reducido()) return;
    const ctx = gsap.context(() => {
      const items = gsap.utils.toArray<HTMLElement>(`.${f.ambiente}`);
      items.forEach((it, i) => {
        if (tipo === "brillo") {
          gsap.set(it, { left: `${gsap.utils.random(6, 90)}%`, top: `${gsap.utils.random(12, 70)}%`, xPercent: -50, yPercent: -50, scale: 0, rotation: gsap.utils.random(0, 90) });
          gsap.to(it, { scale: gsap.utils.random(0.6, 1.2), rotation: "+=60", autoAlpha: 1, duration: gsap.utils.random(0.9, 1.6), ease: "sine.inOut", yoyo: true, repeat: -1, repeatDelay: gsap.utils.random(0.4, 2.4), delay: 0.6 + i * 0.35 });
          return;
        }
        if (it.dataset.llama) {
          // La luz de las velas: tiembla y respira.
          gsap.set(it, { left: `${18 + (i % 3) * 30 + gsap.utils.random(-6, 6)}%`, top: `${gsap.utils.random(52, 66)}%`, xPercent: -50, yPercent: -50, autoAlpha: 0.5 });
          gsap.to(it, { autoAlpha: "random(0.65, 0.95)", scale: "random(1.05, 1.25)", duration: "random(0.12, 0.28)", ease: "sine.inOut", yoyo: true, repeat: -1, repeatRefresh: true });
          return;
        }
        // El humo: sube despacio, se abre y se va.
        const dur = gsap.utils.random(6, 9);
        const delay = i * 1.3;
        gsap.set(it, { left: `${gsap.utils.random(10, 85)}%`, top: "78%", xPercent: -50, yPercent: -50, opacity: 0, visibility: "visible" });
        gsap.fromTo(
          it,
          { y: 0, x: 0, scale: 0.6, rotation: gsap.utils.random(-30, 30) },
          { y: "random(-380, -220)", x: "random(-50, 50)", scale: "random(1.6, 2.4)", rotation: "+=40", duration: dur, ease: "sine.out", repeat: -1, repeatRefresh: true, delay },
        );
        gsap.to(it, { keyframes: { opacity: [0, 0.28, 0.18, 0], easeEach: "none" }, duration: dur, repeat: -1, delay });
      });
    }, el);
    return () => ctx.revert();
  }, [tipo]);

  return (
    <div ref={root} className={f.capa} aria-hidden="true">
      {lista.map((src, i) => {
        const llama = tipo === "velas" && LLAMAS.includes(src);
        return (
          <span
            key={src + i}
            data-llama={llama ? "1" : undefined}
            className={`${f.ambiente} ${tipo === "brillo" ? f.brillo : llama ? f.llama : f.humo}`}
            style={{ WebkitMaskImage: `url(${src})`, maskImage: `url(${src})` }}
          />
        );
      })}
    </div>
  );
}
