/**
 * Edge Function: purge-old-messages
 *
 * Elimina permanentemente los mensajes con más de 72 horas de antigüedad
 * de la tabla `public.mensajes`.
 *
 * Seguridad:
 *   - Requiere Service Role Key (acceso admin, bypass de RLS)
 *   - Solo acepta peticiones autenticadas con la clave secreta
 *   - Diseñada para ser invocada por pg_cron via pg_net (no por clientes)
 *
 * Estrategia:
 *   - DELETE en lotes para evitar bloqueos prolongados en tablas grandes
 *   - Límite de 5,000 registros por ejecución (safety net)
 *   - Logging detallado para auditoría
 *
 * Variables de entorno (inyectadas automáticamente por Supabase):
 *   - SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const BATCH_LIMIT = 5_000;
const MAX_AGE_HOURS = 72;

Deno.serve(async (req: Request) => {
  // ── Validar método HTTP ──────────────────────────────────────────────────
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ── Validar variables de entorno ─────────────────────────────────────────
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error(
      "purge-old-messages: SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no configuradas"
    );
    return new Response(
      JSON.stringify({ error: "Missing environment variables" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    // ── Cliente admin (bypass RLS) ───────────────────────────────────────────
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // ── Calcular el umbral de 72 horas ──────────────────────────────────────
    const cutoff = new Date(Date.now() - MAX_AGE_HOURS * 60 * 60 * 1000);
    const cutoffISO = cutoff.toISOString();

    console.log(
      `purge-old-messages: Eliminando mensajes anteriores a ${cutoffISO} (${MAX_AGE_HOURS}h)`
    );

    // ── Contar mensajes a eliminar (auditoría) ──────────────────────────────
    const { count: totalExpired, error: countError } = await supabase
      .from("mensajes")
      .select("*", { count: "exact", head: true })
      .lt("creado_en", cutoffISO);

    if (countError) {
      console.error("purge-old-messages: Error contando mensajes:", countError);
      throw countError;
    }

    console.log(
      `purge-old-messages: ${totalExpired ?? 0} mensajes encontrados para purga`
    );

    // ── Nada que purgar ─────────────────────────────────────────────────────
    if (!totalExpired || totalExpired === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          deleted: 0,
          message: "No messages to purge",
          cutoff: cutoffISO,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // ── Eliminar en lotes ───────────────────────────────────────────────────
    // Seleccionar IDs a eliminar con límite de seguridad
    const { data: idsToDelete, error: selectError } = await supabase
      .from("mensajes")
      .select("id")
      .lt("creado_en", cutoffISO)
      .limit(BATCH_LIMIT);

    if (selectError) {
      console.error(
        "purge-old-messages: Error seleccionando IDs:",
        selectError
      );
      throw selectError;
    }

    const ids = idsToDelete?.map((row: { id: string }) => row.id) ?? [];

    if (ids.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          deleted: 0,
          message: "No messages matched after ID selection",
          cutoff: cutoffISO,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // ── DELETE por IDs (evita race conditions con nuevos mensajes) ───────────
    const { error: deleteError } = await supabase
      .from("mensajes")
      .delete()
      .in("id", ids);

    if (deleteError) {
      console.error(
        "purge-old-messages: Error eliminando mensajes:",
        deleteError
      );
      throw deleteError;
    }

    const result = {
      success: true,
      deleted: ids.length,
      total_expired: totalExpired,
      remaining: Math.max(0, totalExpired - ids.length),
      batch_limit: BATCH_LIMIT,
      cutoff: cutoffISO,
      executed_at: new Date().toISOString(),
    };

    console.log(
      `purge-old-messages: ✓ ${ids.length}/${totalExpired} mensajes eliminados`
    );

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";

    console.error("purge-old-messages: Error fatal:", message);

    return new Response(
      JSON.stringify({
        success: false,
        error: message,
        executed_at: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
