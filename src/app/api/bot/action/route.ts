import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    const botPath = process.env.BOT_FOLDER_PATH;
    const configFile = process.env.CONFIG_FILE_NAME;

    switch (action) {
      case 'run-bot':
        const runCommand = `cd ${botPath} && tmux kill-session -t solana-bot 2>/dev/null; tmux new-session -d -s solana-bot './smb-onchain run ${configFile} 2>&1'`;
        await executeCommand(request, runCommand);
        return NextResponse.json({ 
          result: 'Bot started in tmux session "solana-bot"',
          message: 'Switch to Logs tab to view output'
        });

      case 'create-lookup-table':
        const createCommand = `cd ${botPath} && ./smb-onchain create-lookup-table ${configFile}`;
        const createResponse = await executeCommand(request, createCommand);
        return NextResponse.json(createResponse);

      case 'search-token':
      case 'modify-config':
      case 'modify-spam':
      case 'modify-jito':
      case 'modify-pools':
      case 'modify-base-mint':
      case 'extend-lookup-table':
      case 'add-custom-lookup-table':
      case 'modify-merge-mints':
      case 'modify-flash-loan':
        // These require interactive input
        return NextResponse.json({ 
          interactive: true,
          message: `Action ${action} requires user input`
        });

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

async function executeCommand(request: NextRequest, command: string) {
  const response = await fetch(`${request.nextUrl.origin}/api/ssh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'execute', command })
  });
  
  return await response.json();
}
