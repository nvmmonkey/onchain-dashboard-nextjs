// GeckoTerminal API service for fetching token information

export interface TokenPool {
  id: string;
  type: string;
  attributes: {
    base_token_price_usd: string;
    base_token_price_native_currency: string;
    quote_token_price_usd: string;
    quote_token_price_native_currency: string;
    base_token_price_quote_token: string;
    quote_token_price_base_token: string;
    address: string;
    name: string;
    pool_created_at: string;
    fdv_usd: string | null;
    market_cap_usd: string | null;
    price_change_percentage: {
      m5: string;
      m15: string;
      m30: string;
      h1: string;
      h6: string;
      h24: string;
    };
    transactions: {
      [key: string]: {
        buys: number;
        sells: number;
        buyers: number;
        sellers: number;
      };
    };
    volume_usd: {
      m5: string;
      m15: string;
      m30: string;
      h1: string;
      h6: string;
      h24: string;
    };
    reserve_in_usd: string;
  };
  relationships: {
    base_token: { data: { id: string; type: string } };
    quote_token: { data: { id: string; type: string } };
    dex: { data: { id: string; type: string } };
  };
}

export interface TokenInfo {
  id: string;
  type: string;
  attributes: {
    address: string;
    name: string;
    symbol: string;
    image_url: string | null;
    coingecko_coin_id: string | null;
  };
}

export interface DexInfo {
  id: string;
  type: string;
  attributes: {
    name: string;
  };
}

export interface GeckoTerminalResponse {
  data: TokenPool[];
  included?: (TokenInfo | DexInfo)[];
}

export interface TokenDetailedInfo {
  address: string;
  symbol: string;
  name: string;
  imageUrl?: string;
  topPool?: {
    address: string;
    name: string;
    dex: string;
    priceUsd: string;
    volume24h: string;
    priceChange24h: string;
    liquidity: string;
  };
  poolCount: number;
  totalVolume24h: number;
  totalLiquidity: number;
  averagePrice: number;
  pools: Array<{
    address: string;
    name: string;
    dex: string;
    priceUsd: string;
    volume24h: string;
    liquidity: string;
    baseTokenReserve?: string;
    quoteTokenReserve?: string;
    baseTokenSymbol?: string;
    quoteTokenSymbol?: string;
  }>;
}

export interface TokenCache {
  [tokenAddress: string]: {
    info: TokenDetailedInfo;
    lastUpdated: number;
  };
}

const API_BASE_URL = 'https://api.geckoterminal.com/api/v2';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const PAGE_DELAY = 500; // 500ms delay between pages

class GeckoTerminalService {
  private cache: TokenCache = {};

  async searchToken(tokenAddress: string, maxPages: number = 3): Promise<TokenDetailedInfo | null> {
    try {
      // Check cache first
      const cached = this.cache[tokenAddress];
      if (cached && Date.now() - cached.lastUpdated < CACHE_DURATION) {
        return cached.info;
      }

      console.log(`Fetching token info for ${tokenAddress} from GeckoTerminal...`);
      
      const allPools: TokenPool[] = [];
      const allIncluded: (TokenInfo | DexInfo)[] = [];
      
      // Fetch multiple pages
      for (let page = 1; page <= maxPages; page++) {
        const params = new URLSearchParams({
          query: tokenAddress,
          network: 'solana',
          include: 'base_token,quote_token,dex',
          page: page.toString(),
        });

        const response = await fetch(
          `${API_BASE_URL}/search/pools?${params}`,
          {
            headers: {
              'Accept': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }

        const data: GeckoTerminalResponse = await response.json();

        if (data.data && data.data.length > 0) {
          allPools.push(...data.data);
          
          if (data.included) {
            // Deduplicate included items by ID
            const existingIds = new Set(allIncluded.map(item => item.id));
            const newIncluded = data.included.filter(item => !existingIds.has(item.id));
            allIncluded.push(...newIncluded);
          }

          // Add delay between requests
          if (page < maxPages && data.data.length > 0) {
            await new Promise(resolve => setTimeout(resolve, PAGE_DELAY));
          }
        } else {
          // No more results
          break;
        }
      }

      if (allPools.length === 0) {
        return null;
      }

      // Process the data
      const tokenInfo = this.processTokenData(tokenAddress, allPools, allIncluded);
      
      // Update cache
      this.cache[tokenAddress] = {
        info: tokenInfo,
        lastUpdated: Date.now(),
      };

      return tokenInfo;
    } catch (error) {
      console.error('Error fetching token from GeckoTerminal:', error);
      return null;
    }
  }

  private processTokenData(
    tokenAddress: string,
    pools: TokenPool[],
    included: (TokenInfo | DexInfo)[]
  ): TokenDetailedInfo {
    // Find token info
    const tokenInfo = included.find(
      (item): item is TokenInfo =>
        item.type === 'token' &&
        'address' in item.attributes &&
        item.attributes.address.toLowerCase() === tokenAddress.toLowerCase()
    );

    // Calculate aggregated data
    let totalVolume24h = 0;
    let totalLiquidity = 0;
    let priceSum = 0;
    let priceCount = 0;

    const processedPools = pools.map(pool => {
      const isBaseToken = pool.relationships.base_token.data.id.includes(tokenAddress);
      const priceUsd = isBaseToken
        ? parseFloat(pool.attributes.base_token_price_usd)
        : parseFloat(pool.attributes.quote_token_price_usd);
      
      const baseTokenPriceUsd = parseFloat(pool.attributes.base_token_price_usd);
      const quoteTokenPriceUsd = parseFloat(pool.attributes.quote_token_price_usd);
      
      const volume24h = parseFloat(pool.attributes.volume_usd.h24 || '0');
      const liquidity = parseFloat(pool.attributes.reserve_in_usd || '0');
      
      totalVolume24h += volume24h;
      totalLiquidity += liquidity;
      
      if (priceUsd > 0) {
        priceSum += priceUsd;
        priceCount++;
      }

      // Find DEX info
      const dexInfo = included.find(
        (item): item is DexInfo =>
          item.type === 'dex' && item.id === pool.relationships.dex.data.id
      );

      // Find base and quote token info
      const baseTokenInfo = included.find(
        (item): item is TokenInfo =>
          item.type === 'token' && 
          item.id === pool.relationships.base_token.data.id
      );
      
      const quoteTokenInfo = included.find(
        (item): item is TokenInfo =>
          item.type === 'token' && 
          item.id === pool.relationships.quote_token.data.id
      );

      // Calculate reserves
      let baseTokenReserve = 'N/A';
      let quoteTokenReserve = 'N/A';
      
      if (liquidity > 0 && baseTokenPriceUsd > 0 && quoteTokenPriceUsd > 0) {
        // For AMM pools, liquidity is typically split 50/50 between tokens
        // This is an approximation since GeckoTerminal doesn't provide exact reserves
        const baseReserveUsd = liquidity / 2;
        const quoteReserveUsd = liquidity / 2;
        
        // Calculate token amounts
        const baseReserveAmount = baseReserveUsd / baseTokenPriceUsd;
        const quoteReserveAmount = quoteReserveUsd / quoteTokenPriceUsd;
        
        // Format reserves with appropriate precision
        baseTokenReserve = this.formatTokenAmount(baseReserveAmount);
        quoteTokenReserve = this.formatTokenAmount(quoteReserveAmount);
      }

      return {
        address: pool.attributes.address,
        name: pool.attributes.name,
        dex: dexInfo?.attributes.name || pool.relationships.dex.data.id,
        priceUsd: priceUsd.toFixed(6),
        volume24h: volume24h.toFixed(2),
        liquidity: liquidity.toFixed(2),
        priceChange24h: pool.attributes.price_change_percentage.h24,
        baseTokenReserve,
        quoteTokenReserve,
        baseTokenSymbol: baseTokenInfo?.attributes.symbol || 'Unknown',
        quoteTokenSymbol: quoteTokenInfo?.attributes.symbol || 'Unknown',
      };
    });

    // Sort pools by volume
    processedPools.sort((a, b) => parseFloat(b.volume24h) - parseFloat(a.volume24h));

    const topPool = processedPools[0];
    const averagePrice = priceCount > 0 ? priceSum / priceCount : 0;

    return {
      address: tokenAddress,
      symbol: tokenInfo?.attributes.symbol || 'Unknown',
      name: tokenInfo?.attributes.name || 'Unknown Token',
      imageUrl: tokenInfo?.attributes.image_url || undefined,
      topPool: topPool
        ? {
            ...topPool,
            priceChange24h: pools[0].attributes.price_change_percentage.h24,
          }
        : undefined,
      poolCount: pools.length,
      totalVolume24h,
      totalLiquidity,
      averagePrice,
      pools: processedPools.slice(0, 10), // Top 10 pools
    };
  }

  // Get cache for persistence
  getCache(): TokenCache {
    return this.cache;
  }

  // Load cache from saved data
  loadCache(savedCache: TokenCache): void {
    this.cache = savedCache;
  }

  // Clear expired cache entries
  cleanCache(): void {
    const now = Date.now();
    Object.keys(this.cache).forEach(key => {
      if (now - this.cache[key].lastUpdated > CACHE_DURATION) {
        delete this.cache[key];
      }
    });
  }

  // Format token amount with appropriate precision
  private formatTokenAmount(amount: number): string {
    if (amount === 0) return '0';
    if (amount < 0.01) return amount.toExponential(2);
    if (amount < 1) return amount.toFixed(4);
    if (amount < 1000) return amount.toFixed(2);
    if (amount < 1000000) return `${(amount / 1000).toFixed(2)}K`;
    if (amount < 1000000000) return `${(amount / 1000000).toFixed(2)}M`;
    return `${(amount / 1000000000).toFixed(2)}B`;
  }
}

export const geckoTerminal = new GeckoTerminalService();
