import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { lines = 500 } = await request.json();
    const botPath = process.env.BOT_FOLDER_PATH;

    // First try to get logs from the active tmux session
    const tmuxCommand = `tmux capture-pane -t solana-bot -p -S -${lines} 2>/dev/null`;
    
    const tmuxResponse = await fetch(`${request.nextUrl.origin}/api/ssh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "execute", command: tmuxCommand }),
    });

    if (tmuxResponse.ok) {
      const tmuxData = await tmuxResponse.json();
      if (tmuxData.result && tmuxData.result.trim() && !tmuxData.result.includes('no server running')) {
        return NextResponse.json({ logs: tmuxData.result });
      }
    }

    // If tmux fails, try to find log files
    const logCommands = [
      `tail -n ${lines} ${botPath}/bot.log 2>/dev/null`,
      `tail -n ${lines} ${botPath}/logs/bot.log 2>/dev/null`,
      `tail -n ${lines} ${botPath}/logs/latest.log 2>/dev/null`,
      `find ${botPath} -name "*.log" -type f -exec tail -n ${lines} {} \\; 2>/dev/null | head -n ${lines}`,
      `journalctl -u solana-bot -n ${lines} --no-pager 2>/dev/null`,
    ];

    for (const command of logCommands) {
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

    // If still no logs, check if there's any output from the bot binary itself
    const directCommand = `cd ${botPath} && timeout 2 ./smb-onchain 2>&1 | head -n 20`;
    const directResponse = await fetch(`${request.nextUrl.origin}/api/ssh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "execute", command: directCommand }),
    });

    if (directResponse.ok) {
      const directData = await directResponse.json();
      if (directData.result && directData.result.trim()) {
        return NextResponse.json({ 
          logs: `[No active session or log files found]\n\nBot binary output:\n${directData.result}` 
        });
      }
    }

    return NextResponse.json({
      logs: "No logs found. Make sure the bot is running in a tmux session named 'solana-bot'.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        logs: "Error loading logs. Please check your connection."
      },
      { status: 500 }
    );
  }
}
