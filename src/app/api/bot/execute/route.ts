// src/app/api/bot/execute/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { action, inputs } = await request.json();
    const botPath = process.env.BOT_FOLDER_PATH!;
    const configFile = process.env.CONFIG_FILE_NAME || 'config.low.toml';
    
    // Create a command prefix that loads NVM or uses direct node path
    const nodePath = process.env.NODE_PATH || 'node';
    const commandPrefix = `cd ${botPath} && `;
    
    // For debugging, let's log what we're using
    console.log('Bot path:', botPath);
    console.log('Node path:', nodePath);
    console.log('Config file:', configFile);
    
    // Check if expect is available once at the beginning for interactive commands
    let hasExpect = false;
    if (['modify-spam', 'modify-jito', 'modify-base-mint', 'modify-merge-mints', 'modify-flash-loan'].includes(action) && inputs) {
      const checkExpect = await executeSSHCommand(request, 'which expect');
      hasExpect = checkExpect.result && !checkExpect.error;
      console.log('Expect available:', hasExpect);
    }
    
    // Build command based on action
    let command = '';
    let inputSequence = '';
    
    switch (action) {
      case 'search-token':
        // Build input sequence with proper escaping
        const searchInputs = [
          '1', // Menu option 1: Search and update
          inputs.baseToken || '1', // Base token choice: 1 for SOL, 2 for USDC
          inputs.tokenAddress, // Token address to search
          inputs.jitoEnabled || '0', // Jito enabled/disabled
          inputs.jitoEnabled === '1' ? (inputs.jitoOption || '2') : '', // Jito option if enabled
          inputs.spamEnabled || '1', // Spam enabled/disabled
          inputs.spamEnabled === '1' ? (inputs.spamOption || '1') : '', // Spam option if enabled
          '', // No custom lookup tables
        ];
        
        // Add longer delay before sending 'n' to ensure the prompt is ready
        const inputCommands = searchInputs.map(input => `echo "${input}"`).join(' && sleep 0.5 && ');
        command = `${commandPrefix}(${inputCommands} && sleep 1 && echo "n" && sleep 0.5 && echo "13") | ${nodePath} new-multi.js 2>&1`;
        break;

      case 'modify-config':
        if (inputs && inputs.deleteIndex) {
          // If we have a delete index, send it with proper delays
          const deleteInputs = [
            '2', // Menu option 2: Modify config
            inputs.deleteIndex.toString(), // Token index to delete (1-based)
          ];
          
          const inputCommands = deleteInputs.map(input => `echo "${input}"`).join(' && sleep 1 && ');
          command = `${commandPrefix}(${inputCommands} && sleep 1 && echo "13") | ${nodePath} new-multi.js 2>&1`;
        } else {
          // Just show the list and exit
          command = `${commandPrefix}echo -e "2\\n\\n13" | ${nodePath} new-multi.js 2>&1`;
        }
        break;

      case 'modify-spam':
        if (!inputs) {
          // Just show current settings
          command = `${commandPrefix}echo -e "3\\n\\n13" | ${nodePath} new-multi.js 2>&1`;
        } else {
          if (hasExpect) {
            // Use expect for proper interactive handling
            const expectScript = `
set timeout 5
spawn ${nodePath} new-multi.js
expect "Enter your choice"
send "3\\r"
expect "Enable spam"
send "${inputs.enabled || 'yes'}\\r"
${inputs.enabled === 'yes' ? `expect "Enter option"\nsend "${inputs.option || '1'}\\r"` : ''}
expect "Enter your choice"
send "13\\r"
expect eof
            `.trim();
            
            command = `${commandPrefix}expect -c '${expectScript.replace(/\n/g, '; ')}' 2>&1 && echo "\\n=== Updated Spam Config ===" && grep -A5 "\\[spam\\]" ${configFile}`;
          } else {
            // Fall back to printf approach
            const spamInputs = ['3']; // Menu option
            spamInputs.push(inputs.enabled || 'yes'); // Enable/disable
            
            if (inputs.enabled === 'yes') {
              spamInputs.push(inputs.option || '1'); // Option if enabled
            }
            
            spamInputs.push('13'); // Exit
            
            command = `${commandPrefix}printf '%s\\n' ${spamInputs.map(i => `"${i}"`).join(' ')} | ${nodePath} new-multi.js 2>&1 && echo "\\n=== Updated Spam Config ===" && grep -A5 "\\[spam\\]" ${configFile}`;
          }
        }
        break;

      case 'modify-jito':
        if (!inputs) {
          // Just show current settings
          command = `${commandPrefix}echo -e "4\\n\\n13" | ${nodePath} new-multi.js 2>&1`;
        } else {
          // Build inputs based on choice
          const jitoInputs = ['4']; // Menu option
          jitoInputs.push(inputs.choice || '1'); // Choice
          
          if (inputs.choice === '1') {
            jitoInputs.push(inputs.enabled || 'no');
          } else if (inputs.choice === '2') {
            jitoInputs.push(inputs.minProfit || '17000');
          } else if (inputs.choice === '3') {
            jitoInputs.push(inputs.tipOption || '2');
          }
          
          // Add 'no' for "modify more settings" prompt
          jitoInputs.push('no');
          jitoInputs.push('13'); // Exit
          
          // Create expect script
          const expectScript = `
set timeout 5
spawn ${nodePath} new-multi.js
expect "Enter your choice"
send "4\\r"
expect "Enter your choice"
send "${inputs.choice || '1'}\\r"
expect {
  "Enable Jito" { send "${inputs.enabled || 'no'}\\r" }
  "Enter new" { send "${inputs.minProfit || '17000'}\\r" }
  "Enter option" { send "${inputs.tipOption || '2'}\\r" }
}
expect "modify more"
send "no\\r"
expect "Enter your choice"
send "13\\r"
expect eof
          `.trim();
          
          // Try expect first, fall back to printf
          command = `${commandPrefix}(which expect > /dev/null 2>&1 && expect -c '${expectScript.replace(/\n/g, '; ')}' || (printf '%s\\n' ${jitoInputs.map(i => `"${i}"`).join(' ')} | ${nodePath} new-multi.js)) 2>&1 && echo "\\n=== Updated Jito Config ===" && grep -A20 "\\[jito\\]" ${configFile} | grep -B20 "\\[kamino_flashloan\\]" | head -n -1`;
        }
        break;

      case 'modify-pools':
        if (!inputs || !inputs.setting) {
          // Show current settings first
          const showPoolsCmd = `${commandPrefix}echo -e "5\\n\\n13" | node new-multi.js 2>&1 | grep -A20 "Current Pool Configuration"`;
          const poolsResponse = await executeSSHCommand(request, showPoolsCmd);
          return NextResponse.json({ 
            result: poolsResponse.result,
            interactive: true,
            needsInput: 'poolSettings'
          });
        }
        
        inputSequence = [
          '5', // Menu option 5: Modify DEX pools
          inputs.settingIndex || '1', // Which setting to modify
          inputs.newValue || '', // New value
        ].filter(val => val !== '').join('\\n');
        command = `${commandPrefix}echo -e "${inputSequence}\\n13" | ${nodePath} new-multi.js 2>&1`;
        break;

      case 'modify-base-mint':
        if (!inputs) {
          // Just show current settings
          command = `${commandPrefix}echo -e "6\\n\\n13" | ${nodePath} new-multi.js 2>&1`;
        } else {
          if (hasExpect) {
            // Use expect for proper interactive handling
            const expectScript = `
set timeout 5
spawn ${nodePath} new-multi.js
expect "Enter your choice"
send "6\\r"
expect "Select option"
send "${inputs.option || '1'}\\r"
${inputs.option === '3' ? `expect "Enter custom"
send "${inputs.customAddress || ''}\\r"` : ''}
expect "Enter your choice"
send "13\\r"
expect eof
            `.trim();
            
            command = `${commandPrefix}expect -c '${expectScript.replace(/\n/g, '; ')}' 2>&1 && echo "\\n=== Updated Base Mint ===" && grep -A2 "base_mint" ${configFile}`;
          } else {
            // Fall back to echo approach
            inputSequence = [
              '6', // Menu option 6: Modify Base Mint
              inputs.option || '1', // 1=SOL, 2=USDC, 3=Custom
              inputs.option === '3' ? (inputs.customAddress || '') : '',
            ].filter(val => val !== '').join('\\n');
            command = `${commandPrefix}echo -e "${inputSequence}\\n13" | ${nodePath} new-multi.js 2>&1`;
          }
        }
        break;

      case 'create-lookup-table':
        command = `${commandPrefix}echo -e "7\\n13" | ${nodePath} new-multi.js 2>&1`;
        break;

      case 'extend-lookup-table':
        if (!inputs || !inputs.address) {
          // Get existing lookup tables
          const getLookupTablesCmd = `cd ${botPath} && [ -f lookuptable.json ] && cat lookuptable.json || echo "[]"`;
          const tablesResponse = await executeSSHCommand(request, getLookupTablesCmd);
          return NextResponse.json({ 
            result: tablesResponse.result,
            interactive: true,
            needsInput: 'lookupTableAddress'
          });
        }
        
        inputSequence = [
          '8', // Menu option 8: Extend lookup table
          inputs.selection || inputs.address, // Table selection or address
        ].join('\\n');
        command = `${commandPrefix}echo -e "${inputSequence}\\n13" | ${nodePath} new-multi.js 2>&1`;
        break;

      case 'modify-merge-mints':
        if (hasExpect) {
          // Use expect for proper interactive handling
          const expectScript = `
set timeout 5
spawn ${nodePath} new-multi.js
expect "Enter your choice"
send "10\\r"
expect "Set merge_mints"
send "${inputs.value || 'true'}\\r"
expect "Press Enter"
send "\\r"
expect "Enter your choice"
send "13\\r"
expect eof
          `.trim();
          
          command = `${commandPrefix}expect -c '${expectScript.replace(/\n/g, '; ')}' 2>&1 && echo "\\n=== Updated Merge Mints ===" && grep -A2 "merge_mints" ${configFile}`;
        } else {
          // Use printf approach
          const mergeInputs = ['10', inputs.value || 'true', '', '13'];
          command = `${commandPrefix}printf '%s\\n' ${mergeInputs.map(i => `"${i}"`).join(' ')} | ${nodePath} new-multi.js 2>&1`;
        }
        break;

      case 'modify-flash-loan':
        if (hasExpect) {
          // Use expect for proper interactive handling
          const expectScript = `
set timeout 5
spawn ${nodePath} new-multi.js
expect "Enter your choice"
send "11\\r"
expect "Flash Loan:"
send "${inputs.enabled || '0'}\\r"
expect "Enter your choice"
send "13\\r"
expect eof
          `.trim();
          
          command = `${commandPrefix}expect -c '${expectScript.replace(/\n/g, '; ')}' 2>&1 && echo "\\n=== Updated Flash Loan ===" && grep -A2 "kamino_flashloan" ${configFile}`;
        } else {
          inputSequence = [
            '11', // Menu option 11: Modify Flash Loan
            inputs.enabled || '0', // 1=enable, 0=disable
          ].join('\\n');
          command = `${commandPrefix}echo -e "${inputSequence}\\n13" | ${nodePath} new-multi.js 2>&1`;
        }
        break;

      case 'add-custom-lookup-table':
        if (!inputs || !inputs.address) {
          return NextResponse.json({ 
            interactive: true,
            needsInput: 'lookupTableAddress',
            message: 'Please provide a lookup table address'
          });
        }
        
        inputSequence = [
          '12', // Menu option 12: Add Custom Lookup Table
          inputs.address,
        ].join('\\n');
        command = `${commandPrefix}echo -e "${inputSequence}\\n13" | ${nodePath} new-multi.js 2>&1`;
        break;

      case 'run-bot':
        command = `cd ${botPath} && tmux kill-session -t solana-bot 2>/dev/null; tmux new-session -d -s solana-bot './smb-onchain run ${configFile} 2>&1'`;
        break;

      case 'stop-bot':
        command = `tmux kill-session -t solana-bot`;
        break;

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
    
    // Execute the command
    const result = await executeSSHCommand(request, command);
    
    // Add success indicators for certain actions
    if (action === 'run-bot' && !result.error) {
      result.message = 'Bot started successfully. Switch to Logs tab to view output.';
    } else if (action === 'stop-bot' && !result.error) {
      result.message = 'Bot stopped successfully.';
    }
    
    return NextResponse.json(result);
    
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
