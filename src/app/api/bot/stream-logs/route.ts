import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  
  // Keep track of the last line count to avoid duplicates
  let lastLineCount = 0;
  let lastContent = "";

  const stream = new ReadableStream({
    async start(controller) {
      const sendLog = (log: string) => {
        const data = `data: ${JSON.stringify({ log })}\n\n`;
        controller.enqueue(encoder.encode(data));
      };

      // Send initial connection message
      sendLog("[System] Connected to log stream...");

      // First, get initial logs
      try {
        const initialResponse = await fetch(`${request.nextUrl.origin}/api/ssh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "execute",
            command: "tmux capture-pane -t solana-bot -p -S -100 2>/dev/null || echo 'No active session'",
          }),
        });

        if (initialResponse.ok) {
          const initialData = await initialResponse.json();
          if (initialData.result && !initialData.result.includes('No active session')) {
            const lines = initialData.result.split("\n").filter(Boolean);
            lines.forEach((line: string) => sendLog(line));
            lastContent = initialData.result;
            lastLineCount = lines.length;
          }
        }
      } catch (error) {
        console.error("Error getting initial logs:", error);
      }

      // Poll for new logs
      const interval = setInterval(async () => {
        try {
          // Use a more efficient approach: only get the last part of the buffer
          const response = await fetch(`${request.nextUrl.origin}/api/ssh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "execute",
              command: "tmux capture-pane -t solana-bot -p -S -200 2>/dev/null || echo ''",
            }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.result && data.result !== lastContent) {
              const currentLines = data.result.split("\n");
              const lastLines = lastContent.split("\n");
              
              // Find new lines by comparing from the end
              let newLines = [];
              let matchFound = false;
              
              // Try to find where the last content ends in the current content
              for (let i = currentLines.length - 1; i >= 0; i--) {
                let isNew = true;
                
                // Check if this line existed in the last content
                for (let j = lastLines.length - 1; j >= 0; j--) {
                  if (currentLines[i] === lastLines[j] && !matchFound) {
                    matchFound = true;
                    isNew = false;
                    break;
                  }
                }
                
                if (isNew && matchFound) {
                  newLines.unshift(currentLines[i]);
                }
              }
              
              // If no match found, it means the buffer was cleared or we have all new content
              if (!matchFound && currentLines.length > 0) {
                // Send only the last few lines to avoid flooding
                newLines = currentLines.slice(-10);
              }
              
              // Send new lines
              newLines.forEach((line: string) => {
                if (line.trim()) {
                  sendLog(line);
                }
              });
              
              lastContent = data.result;
              lastLineCount = currentLines.length;
            }
          }
        } catch (error) {
          console.error("Error fetching logs:", error);
          sendLog("[Error] Failed to fetch logs: " + error);
        }
      }, 500); // Poll every 500ms for faster updates

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
      "X-Accel-Buffering": "no", // Disable nginx buffering
    },
  });
}
