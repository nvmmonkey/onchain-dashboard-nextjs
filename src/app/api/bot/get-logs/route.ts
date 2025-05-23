import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { lines = 100 } = await request.json();
    const botPath = process.env.BOT_FOLDER_PATH;

    // Try multiple log locations
    const commands = [
      `tmux capture-pane -t solana-bot -p -S -${lines}`, // From tmux
      `tail -n ${lines} ${botPath}/bot.log 2>/dev/null`, // From log file
      `tail -n ${lines} ${botPath}/logs/bot.log 2>/dev/null`, // Alternative log location
      `journalctl -u solana-bot -n ${lines} --no-pager 2>/dev/null`, // From systemd
    ];

    for (const command of commands) {
      const response = await fetch(`${request.nextUrl.origin}/api/ssh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "execute", command }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.result && data.result.trim()) {
          return NextResponse.json({ logs: data.result });
        }
      }
    }

    return NextResponse.json({
      logs: "No logs found. Make sure the bot is running.",
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
