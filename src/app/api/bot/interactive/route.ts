import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { action, inputs } = await request.json();
    const botPath = process.env.BOT_FOLDER_PATH;

    let command = '';
    
    switch (action) {
      case 'search-token':
        // Build the input sequence for the Node.js script
        const { tokenAddress, jitoEnabled, spamEnabled } = inputs;
        const inputSequence = [
          '1', // Search and update
          tokenAddress,
          'n', // Don't add more tokens
          jitoEnabled,
          jitoEnabled === '1' ? '2' : '', // Jito option
          spamEnabled,
          spamEnabled === '1' ? '1' : '', // Spam option
          '', // No custom lookup tables
          '13' // Exit
        ].filter(Boolean).join('\\n');
        
        command = `cd ${botPath} && echo -e "${inputSequence}" | node new-multi.js`;
        break;

      case 'modify-spam':
        const { spamEnabledNew, spamOption } = inputs;
        const spamSequence = [
          '3', // Modify spam
          spamEnabledNew,
          spamOption || '1',
          '13' // Exit
        ].join('\\n');
        
        command = `cd ${botPath} && echo -e "${spamSequence}" | node new-multi.js`;
        break;

      // Add other interactive actions...
      
      default:
        return NextResponse.json({ error: 'Unknown interactive action' }, { status: 400 });
    }

    // Execute the command
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