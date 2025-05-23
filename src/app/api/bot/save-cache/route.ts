// API route to save cache file to VPS via SSH
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cache } = body;

    if (!cache) {
      return NextResponse.json(
        { error: 'Cache data is required' },
        { status: 400 }
      );
    }

    const botPath = process.env.BOT_FOLDER_PATH || '/root/';
    const cacheFileName = 'gecko-onchain-token-cache.json';
    const cacheFilePath = `${botPath}/${cacheFileName}`;

    // Save cache file on VPS via SSH
    const cacheContent = JSON.stringify(cache, null, 2);
    
    // Escape quotes and special characters for shell command
    const escapedContent = cacheContent
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/`/g, '\\`')
      .replace(/\$/g, '\\$');

    // Use printf instead of echo for better handling of special characters
    const command = `printf '%s' "${escapedContent}" > ${cacheFilePath}`;

    const response = await fetch(`${request.nextUrl.origin}/api/ssh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'execute', command }),
    });

    const result = await response.json();

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    // Verify the file was created
    const verifyCommand = `[ -f ${cacheFilePath} ] && echo "exists" || echo "not found"`;
    const verifyResponse = await fetch(`${request.nextUrl.origin}/api/ssh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'execute', command: verifyCommand }),
    });

    const verifyResult = await verifyResponse.json();
    const fileExists = verifyResult.result?.trim() === 'exists';

    return NextResponse.json({
      success: fileExists,
      message: fileExists ? 'Cache saved to VPS' : 'Failed to verify cache file',
      path: cacheFilePath,
    });
  } catch (error) {
    console.error('Error saving cache to VPS:', error);
    return NextResponse.json(
      { error: 'Failed to save cache to VPS' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve cache from VPS
export async function GET(request: NextRequest) {
  try {
    const botPath = process.env.BOT_FOLDER_PATH || '/root/';
    const cacheFileName = 'gecko-onchain-token-cache.json';
    const cacheFilePath = `${botPath}/${cacheFileName}`;

    // Check if file exists and read it
    const command = `[ -f ${cacheFilePath} ] && cat ${cacheFilePath} || echo '{}'`;

    const response = await fetch(`${request.nextUrl.origin}/api/ssh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'execute', command }),
    });

    const result = await response.json();

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    try {
      const cache = JSON.parse(result.result || '{}');
      return NextResponse.json({
        success: true,
        cache,
        source: 'vps',
      });
    } catch (parseError) {
      console.error('Error parsing cache from VPS:', parseError);
      return NextResponse.json({
        success: true,
        cache: {},
        source: 'vps',
        message: 'Cache file corrupted or empty',
      });
    }
  } catch (error) {
    console.error('Error retrieving cache from VPS:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve cache from VPS' },
      { status: 500 }
    );
  }
}
