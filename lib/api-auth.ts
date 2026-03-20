/**
 * Utilidades de autenticación para rutas /api
 * Uso: const { token, error } = await requireAuth(request, ["ADMIN", "BODEGUERO"])
 */
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

type TokenData = {
    sub?: string;
    name?: string;
    email?: string;
    rol?: string;
    bodegaId?: string;
    [key: string]: unknown;
};

export async function requireAuth(
    request: NextRequest | Request,
    roles?: string[],
): Promise<{ token: TokenData; error: null } | { token: null; error: Response }> {
    const token = await getToken({
        req: request as NextRequest,
        secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
        return {
            token: null,
            error: Response.json({ ok: false, error: "No autenticado" }, { status: 401 }),
        };
    }

    if (roles && roles.length > 0) {
        const userRole = (token.rol as string) || "";
        if (!roles.includes(userRole)) {
            return {
                token: null,
                error: Response.json(
                    { ok: false, error: `Acceso denegado. Requiere: ${roles.join(" o ")}` },
                    { status: 403 },
                ),
            };
        }
    }

    return { token: token as TokenData, error: null };
}

/** Verifica que el bodegaId del request coincide con el del token (para BODEGUERO) */
export function assertBodegaOwnership(token: TokenData, bodegaId: string): Response | null {
    if (token.rol === "BODEGUERO" && token.bodegaId && token.bodegaId !== bodegaId) {
        return Response.json(
            { ok: false, error: "Sin permiso para esta bodega" },
            { status: 403 },
        );
    }
    return null;
}
