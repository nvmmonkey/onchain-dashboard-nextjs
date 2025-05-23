// API route to fetch token information from GeckoTerminal
import { NextRequest, NextResponse } from 'next/server';
import { geckoTerminal, TokenCache } from '@/services/gecko-terminal';
import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

const CACHE_FILE_NAME = 'gecko-onchain-token-cache.json';

// Get cache file path - use local directory for development
function getCacheFilePath(): string {
  // For local development, use a .cache directory
  const isDevelopment = process.env.NODE_ENV !== 'production';
  if (isDevelopment) {
    const cacheDir = path.join(process.cwd(), '.cache');
    return path.join(cacheDir, CACHE_FILE_NAME);
  }
  
  // For production/VPS, use the bot folder path
  const botFolderPath = process.env.BOT_FOLDER_PATH || '/root/';
  return path.join(botFolderPath, CACHE_FILE_NAME);
}

// Ensure cache directory exists
async function ensureCacheDirectory(): Promise<void> {
  const cacheFilePath = getCacheFilePath();
  const cacheDir = path.dirname(cacheFilePath);
  
  try {
    if (!existsSync(cacheDir)) {
      await fs.mkdir(cacheDir, { recursive: true });
      console.log('Created cache directory:', cacheDir);
    }
  } catch (error) {
    console.error('Error creating cache directory:', error);
  }
}

// Load cache from file
async function loadCacheFromFile(): Promise<TokenCache> {
  try {
    await ensureCacheDirectory();
    const cacheFilePath = getCacheFilePath();
    
    // Check if file exists
    try {
      await fs.access(cacheFilePath);
    } catch {
      // File doesn't exist, return empty cache
      console.log('Cache file does not exist yet, will be created on first save');
      return {};
    }
    
    const data = await fs.readFile(cacheFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.log('Error reading cache:', error);
    return {};
  }
}

// Save cache to file
async function saveCacheToFile(cache: TokenCache): Promise<void> {
  try {
    await ensureCacheDirectory();
    const cacheFilePath = getCacheFilePath();
    await fs.writeFile(cacheFilePath, JSON.stringify(cache, null, 2));
    console.log('Cache saved to:', cacheFilePath);
  } catch (error) {
    console.error('Error saving cache:', error);
  }
}

export async function POST(request: NextRequest) {
  console.log('[token-info API] POST request received');
  try {
    const body = await request.json();
    const { tokens, syncWithVPS = false } = body;
    console.log('[token-info API] Tokens requested:', tokens);

    if (!tokens || !Array.isArray(tokens)) {
      return NextResponse.json(
        { error: 'Invalid request: tokens array required' },
        { status: 400 }
      );
    }

    // Load existing cache
    let savedCache = await loadCacheFromFile();
    
    // If requested, try to sync with VPS cache first
    if (syncWithVPS) {
      try {
        const vpsResponse = await fetch(`${request.nextUrl.origin}/api/bot/save-cache`, {
          method: 'GET',
        });
        
        if (vpsResponse.ok) {
          const vpsData = await vpsResponse.json();
          if (vpsData.success && vpsData.cache) {
            // Merge VPS cache with local cache
            savedCache = { ...savedCache, ...vpsData.cache };
            console.log('Synced cache from VPS');
          }
        }
      } catch (error) {
        console.log('Could not sync with VPS cache:', error);
      }
    }
    
    geckoTerminal.loadCache(savedCache);

    // Fetch information for each token
    const tokenInfos = [];
    
    for (const tokenAddress of tokens) {
      const info = await geckoTerminal.searchToken(tokenAddress);
      if (info) {
        tokenInfos.push(info);
      }
      
      // Small delay between token fetches to avoid rate limiting
      if (tokens.indexOf(tokenAddress) < tokens.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    // Clean expired cache entries
    geckoTerminal.cleanCache();

    // Save updated cache locally
    await saveCacheToFile(geckoTerminal.getCache());
    
    // If requested, also save to VPS
    if (syncWithVPS && tokenInfos.length > 0) {
      try {
        const vpsSaveResponse = await fetch(`${request.nextUrl.origin}/api/bot/save-cache`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cache: geckoTerminal.getCache() }),
        });
        
        if (vpsSaveResponse.ok) {
          const vpsSaveData = await vpsSaveResponse.json();
          console.log('Cache saved to VPS:', vpsSaveData.message);
        }
      } catch (error) {
        console.log('Could not save cache to VPS:', error);
      }
    }

    return NextResponse.json({
      success: true,
      tokens: tokenInfos,
    });
  } catch (error) {
    console.error('Error fetching token info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch token information' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve cached data
export async function GET() {
  try {
    const cache = await loadCacheFromFile();
    const tokenInfos = Object.values(cache).map(item => item.info);
    
    return NextResponse.json({
      success: true,
      tokens: tokenInfos,
      cacheSize: Object.keys(cache).length,
    });
  } catch (error) {
    console.error('Error retrieving cached data:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve cached data' },
      { status: 500 }
    );
  }
}
