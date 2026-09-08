import { redirect } from "next/navigation";

/** La pantalla de apertura pasó a ser el home. Este link viejo sigue funcionando. */
export default function AperturaRedirect() {
  redirect("/");
}
