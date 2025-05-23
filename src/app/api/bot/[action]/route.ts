import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { action: string } }
) {
  try {
    const botPath = process.env.BOT_FOLDER_PATH;
    const configFile = process.env.CONFIG_FILE_NAME;
    
    let command = '';
    
    switch (params.action) {
      case 'run-bot':
        // Kill existing session first, then create new one
        command = `tmux kill-session -t solana-bot 2>/dev/null; cd ${botPath} && tmux new-session -d -s solana-bot -c ${botPath} './smb-onchain run ${configFile} 2>&1'`;
        break;
        
      case 'stop-bot':
        command = `tmux kill-session -t solana-bot`;
        break;
        
      case 'get-config':
        command = `cat ${botPath}/${configFile}`;
        break;
        
      case 'save-config':
        const { content } = await request.json();
        // Use a more robust method to save the config
        const escapedContent = content.replace(/'/g, "'\"'\"'");
        command = `cd ${botPath} && echo '${escapedContent}' > ${configFile}`;
        break;
        
      case 'get-tokens':
        command = `cd ${botPath} && grep "mint = " ${configFile} | cut -d'"' -f2`;
        break;
        
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
    
    // Execute via SSH API
    const response = await fetch(`${request.nextUrl.origin}/api/ssh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'execute', command })
    });
    
    const result = await response.json();
    return NextResponse.json(result);
    
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}