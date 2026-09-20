import { redirect } from "next/navigation";

/** Link sin mesita (reenviado por WhatsApp): la misma experiencia, sin número de mesa. */
export default function HoyIndex() {
  redirect("/hoy/0");
}
