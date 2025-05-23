import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendLog = (log: string) => {
        const data = `data: ${JSON.stringify({ log })}\n\n`;
        controller.enqueue(encoder.encode(data));
      };

      // Execute command to capture tmux output
      const interval = setInterval(async () => {
        try {
          const response = await fetch(`${request.nextUrl.origin}/api/ssh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "execute",
              command: "tmux capture-pane -t solana-bot -p | tail -n 50",
            }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.result) {
              const newLines = data.result.split("\n").filter(Boolean);
              newLines.forEach((line) => sendLog(line));
            }
          }
        } catch (error) {
          console.error("Error fetching logs:", error);
        }
      }, 1000); // Poll every second

      // Cleanup
      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
