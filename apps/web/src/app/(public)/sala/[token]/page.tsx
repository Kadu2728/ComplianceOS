import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { RoomView } from "@/components/room/room-view";
import type { RoomPublic } from "@/lib/domain/queries";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://127.0.0.1:8000";

export const metadata: Metadata = {
  title: "Sala de compliance",
  robots: { index: false, follow: false, noarchive: true },
};

/**
 * Visitor page (D36). No cookies are forwarded — the link token is the only credential — and the
 * page is rendered per request (no-store). Anything but a 200 from the API is a "not found" page:
 * unknown, expired and revoked links look identical (threat model T1).
 */
export default async function SalaPublicaPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{20,128}$/.test(token)) notFound();
  const requestId = (await headers()).get("x-request-id") ?? crypto.randomUUID();
  const res = await fetch(`${API_BASE_URL}/api/v1/public/rooms/${token}`, {
    headers: { "x-request-id": requestId },
    cache: "no-store",
  });
  if (res.status === 404 || res.status === 429) notFound();
  if (!res.ok) throw new Error(`API ${res.status} on public room (request ${requestId})`);
  const room = (await res.json()) as RoomPublic;
  return <RoomView room={room} downloadBase={`/api/v1/public/rooms/${token}`} />;
}
