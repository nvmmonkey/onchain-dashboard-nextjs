// src/app/api/bot/delete-token/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { tokenAddress } = await request.json();
    
    // Get environment variables with fallbacks
    const botPath = process.env.BOT_FOLDER_PATH || '/root/onchain-bot';
    const configFile = process.env.CONFIG_FILE_NAME || 'config.low.toml';
    
    console.log('Delete token request:', { tokenAddress, botPath, configFile });
    
    // First check if file exists
    const checkCommand = `[ -f ${botPath}/${configFile} ] && echo "exists" || echo "not found at ${botPath}/${configFile}"`;
    const checkResponse = await executeSSHCommand(request, checkCommand);
    
    console.log('File check response:', checkResponse);
    
    if (checkResponse.result?.includes('not found')) {
      return NextResponse.json({ 
        error: `Config file not found at: ${botPath}/${configFile}`,
        details: checkResponse.result
      }, { status: 404 });
    }
    
    // Read the current config
    const readCommand = `cat ${botPath}/${configFile}`;
    const readResponse = await executeSSHCommand(request, readCommand);
    
    if (!readResponse.result || readResponse.error) {
      return NextResponse.json({ 
        error: `Failed to read config file: ${readResponse.error || 'No content'}` 
      }, { status: 500 });
    }
    
    const configContent = readResponse.result;
    
    // Find and remove the token section
    const tokenSectionRegex = new RegExp(
      `\\[\\[routing\\.mint_config_list\\]\\]\\s*\\n` +
      `(?:[^\\[]*?\\n)*?` +
      `mint\\s*=\\s*"${tokenAddress.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"\\s*\\n` +
      `(?:[^\\[]*?\\n)*?` +
      `(?=\\[\\[routing\\.mint_config_list\\]\\]|\\[(?!\\[)|$)`,
      'gi'
    );
    
    const updatedConfig = configContent.replace(tokenSectionRegex, '');
    
    if (updatedConfig === configContent) {
      return NextResponse.json({ error: 'Token not found in configuration' }, { status: 404 });
    }
    
    // Clean up any double newlines
    const cleanedConfig = updatedConfig.replace(/\n\n\n+/g, '\n\n');
    
    // Save the updated config
    const tempFile = `/tmp/config_${Date.now()}.toml`;
    const escapedContent = cleanedConfig.replace(/'/g, "'\"'\"'");
    
    const saveCommands = [
      `echo '${escapedContent}' > ${tempFile}`,
      `mv ${tempFile} ${botPath}/${configFile}`
    ];
    
    for (const cmd of saveCommands) {
      const response = await executeSSHCommand(request, cmd);
      if (response.error) {
        return NextResponse.json(response);
      }
    }
    
    // Update merge_mints based on remaining tokens
    const remainingTokens = (cleanedConfig.match(/mint\s*=\s*"/g) || []).length;
    if (remainingTokens <= 1) {
      const updateMergeCommand = `cd ${botPath} && sed -i 's/merge_mints = true/merge_mints = false/g' ${configFile}`;
      await executeSSHCommand(request, updateMergeCommand);
    }
    
    return NextResponse.json({ 
      success: true,
      message: `Token ${tokenAddress} removed successfully`,
      remainingTokens
    });
    
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

async function executeSSHCommand(request: NextRequest, command: string) {
  const response = await fetch(`${request.nextUrl.origin}/api/ssh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'execute', command })
  });
  
  return await response.json();
}