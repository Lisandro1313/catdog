import { NextResponse, type NextRequest } from "next/server";

/**
 * Le pasa al layout del panel la ruta pedida, para que el login vuelva ahí
 * (la app instalada arranca en /admin/gastos y no queremos que aterrice en el inicio).
 */
export function proxy(req: NextRequest) {
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-admin-path", req.nextUrl.pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/admin/:path*"],
};
