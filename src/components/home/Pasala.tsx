import { ShareButton } from "@/components/ShareButton";

/**
 * "Pasásela a alguien": el único mecanismo por el que un cliente te hace publicidad gratis.
 *
 * Va justo después de la carta y no al final de todo, porque el recorrido muestra que a la carta
 * llega mucha más gente que al pie: pedirlo abajo de todo es pedírselo a los pocos que quedaron.
 *
 * El momento también importa: se pide recién después de que leyó qué hay y cuánto sale, que es
 * cuando ya decidió si le gusta. Antes de eso no tiene nada que contar.
 *
 * El link que se comparte lleva su marca, así en Números se ve cuánta gente entró por el boca a
 * boca y no por lo que publicamos nosotros.
 */
export function Pasala({ frase, texto }: { frase: string; texto: string }) {
  return (
    <section id="pasala" className="reveal mx-auto w-full max-w-2xl scroll-mt-16 px-6 py-14 sm:py-20">
      <div className="pasala-marco">
        <p className="ap-ornament">✦</p>
        <p className="pasala-frase">{frase}</p>
        <p className="mt-5 text-sm leading-relaxed text-muted">
          Así llegaste vos. Si se te ocurre alguien que tiene que conocer la casa, pasásela.
        </p>
        <ShareButton
          text={texto}
          label="Pasarle la casa a alguien"
          copiado="Copiado, pegalo donde quieras"
          className="btn btn-primary btn-sm mt-6"
        />
      </div>
    </section>
  );
}
