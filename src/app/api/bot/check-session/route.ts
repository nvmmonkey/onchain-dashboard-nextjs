// src/app/api/bot/check-session/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const response = await fetch(`${request.nextUrl.origin}/api/ssh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "execute",
        command:
          'tmux has-session -t solana-bot 2>/dev/null && echo "exists" || echo "not found"',
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const exists = data.result && data.result.includes("exists");
      return NextResponse.json({ exists });
    }

    return NextResponse.json({ exists: false });
  } catch (error) {
    return NextResponse.json({ exists: false });
  }
}
