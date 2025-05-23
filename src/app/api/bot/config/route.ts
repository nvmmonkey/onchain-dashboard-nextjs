// src/app/api/bot/config/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const botPath = process.env.BOT_FOLDER_PATH!;
    const configFile = process.env.CONFIG_FILE_NAME || "config.low.toml";

    const command = `cat ${botPath}/${configFile}`;

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

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json();
    const botPath = process.env.BOT_FOLDER_PATH!;
    const configFile = process.env.CONFIG_FILE_NAME || "config.low.toml";

    // Create a temporary file and move it to avoid issues with special characters
    const tempFile = `/tmp/config_${Date.now()}.toml`;
    const escapedContent = content.replace(/'/g, "'\"'\"'");

    const commands = [
      `echo '${escapedContent}' > ${tempFile}`,
      `mv ${tempFile} ${botPath}/${configFile}`,
      `cat ${botPath}/${configFile} | head -5`, // Verify by reading first 5 lines
    ];

    for (const cmd of commands) {
      const response = await fetch(`${request.nextUrl.origin}/api/ssh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "execute", command: cmd }),
      });

      const result = await response.json();
      if (result.error) {
        return NextResponse.json(result);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Configuration saved successfully",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
