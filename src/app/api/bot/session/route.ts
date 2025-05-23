// src/app/api/bot/session/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { action, command } = await request.json();
    const botPath = process.env.BOT_FOLDER_PATH!;
    
    console.log('Session API called with action:', action);
    
    // Helper function to execute SSH commands
    const executeSSHCommand = async (cmd: string) => {
      const response = await fetch(`${request.nextUrl.origin}/api/ssh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'execute', command: cmd })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `SSH command failed: ${response.statusText}`);
      }
      
      return await response.json();
    };
    
    // Create command prefix with NVM
    const commandPrefix = `cd ${botPath} && export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" && `;
    
    switch (action) {
      case 'start':
        try {
          // First check if tmux is installed
          const tmuxCheck = await executeSSHCommand('which tmux');
          if (!tmuxCheck.result || tmuxCheck.error) {
            throw new Error('tmux is not installed on the server. Please install it with: apt-get install tmux');
          }
          
          // Kill any existing session first
          await executeSSHCommand('tmux kill-session -t bot-interactive 2>/dev/null || true');
          
          // Start new tmux session with the bot
          const startCmd = `${commandPrefix}tmux new-session -d -s bot-interactive 'node new-multi.js'`;
          console.log('Starting tmux with command:', startCmd);
          
          const startResult = await executeSSHCommand(startCmd);
          console.log('Start result:', startResult);
          
          if (startResult.error) {
            throw new Error(startResult.error);
          }
          
          // Give it a moment to start
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // Check if session was created
          const checkResult = await executeSSHCommand('tmux list-sessions | grep bot-interactive');
          if (!checkResult.result) {
            throw new Error('Failed to create tmux session');
          }
          
          return NextResponse.json({ 
            success: true,
            message: 'Session started'
          });
        } catch (error) {
          console.error('Error starting session:', error);
          return NextResponse.json({ 
            success: false,
            error: error instanceof Error ? error.message : 'Failed to start session'
          }, { status: 500 });
        }
        
      case 'send':
        try {
          // Send command to the tmux session
          if (!command) {
            return NextResponse.json({ 
              success: false, 
              error: 'No command provided' 
            }, { status: 400 });
          }
          
          // Send the command to tmux
          const sendCmd = `tmux send-keys -t bot-interactive "${command}" Enter`;
          await executeSSHCommand(sendCmd);
          
          // Wait a bit for the command to process
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Capture the output
          const captureResult = await executeSSHCommand('tmux capture-pane -t bot-interactive -p');
          
          return NextResponse.json({ 
            success: true,
            output: captureResult.result || ''
          });
        } catch (error) {
          console.error('Error sending command:', error);
          return NextResponse.json({ 
            success: false,
            error: error instanceof Error ? error.message : 'Failed to send command'
          }, { status: 500 });
        }
        
      case 'read':
        try {
          // Just read current output without sending anything
          const readResult = await executeSSHCommand('tmux capture-pane -t bot-interactive -p');
          
          return NextResponse.json({ 
            success: true,
            output: readResult.result || ''
          });
        } catch (error) {
          console.error('Error reading output:', error);
          return NextResponse.json({ 
            success: false,
            error: error instanceof Error ? error.message : 'Failed to read output'
          }, { status: 500 });
        }
        
      case 'stop':
        try {
          // Kill the tmux session
          await executeSSHCommand('tmux kill-session -t bot-interactive');
          
          return NextResponse.json({ 
            success: true,
            message: 'Session stopped' 
          });
        } catch {
          // Session might already be stopped
          return NextResponse.json({ 
            success: true,
            message: 'Session stopped' 
          });
        }
        
      default:
        return NextResponse.json({ 
          success: false,
          error: 'Invalid action' 
        }, { status: 400 });
    }
    
  } catch (error) {
    console.error('Session API error:', error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
