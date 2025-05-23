// src/app/api/bot/get-tokens/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const botPath = process.env.BOT_FOLDER_PATH!;
    const configFile = process.env.CONFIG_FILE_NAME || "config.low.toml";

    const command = `cd ${botPath} && grep "mint = " ${configFile} | cut -d'"' -f2`;

    const response = await fetch(`${request.nextUrl.origin}/api/ssh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "execute", command }),
    });

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
