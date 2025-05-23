// Enhanced Token Status Component with detailed information
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, TrendingDown, DollarSign, Activity, Users, ChevronDown, ChevronUp, Copy, ExternalLink } from 'lucide-react';
import { TokenDetailedInfo } from '@/services/gecko-terminal';
import { useToast } from '@/contexts/ToastContext';

interface TokenStatusProps {
  tokens: string[];
  isConnected: boolean;
  onRefresh?: () => void;
}

export default function TokenStatus({ tokens, isConnected, onRefresh }: TokenStatusProps) {
  const [tokenInfos, setTokenInfos] = useState<TokenDetailedInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedTokens, setExpandedTokens] = useState<Set<string>>(new Set());
  const { showToast } = useToast();
  
  console.log('TokenStatus component rendered with:', { tokens, isConnected });

  const fetchTokenInfo = async () => {
    // Filter out SOL token address as it's the native token
    const filteredTokens = tokens.filter(token => 
      token !== 'So11111111111111111111111111111111111111112'
    );
    
    console.log('TokenStatus: Fetching info for tokens:', filteredTokens);
    
    if (!isConnected || filteredTokens.length === 0) {
      console.log('TokenStatus: Not fetching - connected:', isConnected, 'tokens:', filteredTokens.length);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/bot/token-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tokens: filteredTokens,
          syncWithVPS: isConnected // Sync with VPS when connected
        }),
      });

      const data = await response.json();
      console.log('TokenStatus: Received data:', data);

      if (data.success) {
        setTokenInfos(data.tokens);
      } else {
        setError(data.error || 'Failed to fetch token information');
      }
    } catch (err) {
      setError('Failed to fetch token information');
      console.error('Error fetching token info:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('TokenStatus: useEffect triggered, tokens:', tokens);
    if (tokens.length > 0) {
      fetchTokenInfo();
    }
  }, [tokens.join(','), isConnected]); // Re-fetch when tokens or connection status change

  const toggleTokenExpansion = (key: string) => {
    const newExpanded = new Set(expandedTokens);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedTokens(newExpanded);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1_000_000) {
      return `$${(num / 1_000_000).toFixed(2)}M`;
    } else if (num >= 1_000) {
      return `$${(num / 1_000).toFixed(2)}K`;
    }
    return `$${num.toFixed(2)}`;
  };

  const formatPrice = (price: string | number): string => {
    const priceNum = typeof price === 'string' ? parseFloat(price) : price;
    if (priceNum < 0.00001) {
      return priceNum.toExponential(2);
    } else if (priceNum < 0.01) {
      return priceNum.toFixed(6);
    } else if (priceNum < 1) {
      return priceNum.toFixed(4);
    } else if (priceNum < 100) {
      return priceNum.toFixed(2);
    }
    return priceNum.toFixed(0);
  };

  const handleRefresh = async () => {
    await fetchTokenInfo();
    if (onRefresh) {
      onRefresh();
    }
  };

  // Pool Logos Component
  const PoolLogos = ({ pools }: { pools: any[] }) => {
    // DEX configuration with logos and variant info - defined first
    const dexConfig = [
      { key: 'raydium', logo: 'https://raydium.io/favicon.ico', isVariant: false },
      { key: 'raydium-clmm', logo: 'https://raydium.io/favicon.ico', isVariant: true },
      { key: 'meteora', logo: 'https://pbs.twimg.com/profile_images/1623689233813864450/XDk-DpAP_400x400.jpg', isVariant: false },
      { key: 'meteora-dlmm', logo: 'https://pbs.twimg.com/profile_images/1623689233813864450/XDk-DpAP_400x400.jpg', isVariant: true },
      { key: 'orca', logo: 'https://pbs.twimg.com/profile_images/1898099113859678208/1NOETPA8_400x400.png', isVariant: false },
      { key: 'whirlpool', logo: 'https://pbs.twimg.com/profile_images/1898099113859678208/1NOETPA8_400x400.png', isVariant: true },
      { key: 'pump', logo: 'https://dd.dexscreener.com/ds-data/dexes/pumpfun.png', isVariant: false },
      { key: 'pumpswap', logo: 'https://dd.dexscreener.com/ds-data/dexes/pumpfun.png', isVariant: true },
      { key: 'solfi', logo: 'https://statics.solscan.io/cdn/imgs/s60?ref=68747470733a2f2f737461746963732e736f6c7363616e2e696f2f736f6c7363616e2d696d672f736f6c66695f69636f6e2e6a7067', isVariant: false },
    ];

    // Count pools by DEX
    const dexCounts: Record<string, number> = {};
    dexConfig.forEach(dex => {
      dexCounts[dex.key] = 0;
    });
    
    // Count actual pools
    if (pools && pools.length > 0) {
      pools.forEach((pool) => {
        const dexKey = pool.dex.toLowerCase();
        if (dexKey in dexCounts) {
          dexCounts[dexKey]++;
        }
      });
    }

    return (
      <div className="flex items-center gap-1 flex-wrap">
        {dexConfig.map((dex) => {
          const count = dexCounts[dex.key] || 0;
          
          return (
            <div 
              key={dex.key} 
              className={`flex items-center gap-0.5 rounded px-1.5 py-0.5 ${
                count > 0 
                  ? 'bg-gray-100 dark:bg-gray-800' 
                  : 'bg-gray-50 dark:bg-gray-900'
              }`}
              title={`${dex.key}: ${count} pool${count !== 1 ? 's' : ''}`}
            >
              <img 
                src={dex.logo} 
                alt={dex.key} 
                className={`w-3 h-3 rounded-sm ${dex.isVariant ? 'grayscale' : ''}`}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <span className="text-[10px] font-medium">{count}</span>
            </div>
          );
        })}
      </div>
    );
  };

  if (tokens.filter(token => token !== 'So11111111111111111111111111111111111111112').length === 0) {
    console.log('TokenStatus: No tokens to display (after filtering SOL)');
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-gray-500">No active tokens</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Active Tokens ({tokens.filter(token => token !== 'So11111111111111111111111111111111111111112').length})</CardTitle>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={loading || !isConnected}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="text-red-500 text-sm mb-4">{error}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tokenInfos.length === 0 && loading && (
            <div className="col-span-full text-center py-4">
              <p className="text-gray-500">Loading token information...</p>
            </div>
          )}

          {tokenInfos.map((tokenInfo, index) => {
            const isExpanded = expandedTokens.has(`${tokenInfo.address}-${index}`);
            const priceChange = parseFloat(tokenInfo.topPool?.priceChange24h || '0');
            const isPositive = priceChange >= 0;

            return (
              <div
                key={`${tokenInfo.address}-${index}`}
                className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 flex flex-col h-full"
              >
                {/* Token Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    {tokenInfo.imageUrl && (
                      <img
                        src={tokenInfo.imageUrl}
                        alt={tokenInfo.symbol}
                        className="w-10 h-10 rounded-full flex-shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                    <div className="min-w-0">
                      <h4 className="font-semibold truncate">{tokenInfo.symbol}</h4>
                      <p className="text-sm text-gray-500 truncate">{tokenInfo.name}</p>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleTokenExpansion(`${tokenInfo.address}-${index}`)}
                    className="flex-shrink-0"
                  >
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>

                {/* Token Metrics */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <p className="text-xs text-gray-500">Price</p>
                    <p className="font-medium text-sm">
                      ${formatPrice(tokenInfo.topPool?.priceUsd || tokenInfo.averagePrice)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">24h Change</p>
                    <p className={`font-medium text-sm flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {Math.abs(priceChange).toFixed(2)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">24h Volume</p>
                    <p className="font-medium text-sm">{formatNumber(tokenInfo.totalVolume24h)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Liquidity</p>
                    <p className="font-medium text-sm">{formatNumber(tokenInfo.totalLiquidity)}</p>
                  </div>
                </div>

                {/* Pool Information */}
                <div className="mb-3">
                  <div className="text-xs text-gray-500 mb-1">
                    <div>{tokenInfo.poolCount} pools</div>
                    <div>Top: {tokenInfo.topPool?.dex}</div>
                    <div className="text-[10px]">{tokenInfo.topPool?.name}</div>
                  </div>
                  {/* Pool DEX breakdown */}
                  <PoolLogos pools={tokenInfo.pools} />
                </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`https://solscan.io/token/${tokenInfo.address}`, '_blank')}
                      className="text-xs flex-1 inline-flex items-center justify-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View on Solscan
                    </Button>
                  </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t">
                    <h5 className="font-medium text-sm mb-2">Top Pools</h5>
                    <div className="space-y-1">
                      {tokenInfo.pools.slice(0, 5).map((pool, poolIndex) => (
                        <div key={`${pool.address}-${poolIndex}`} className="border-b border-gray-100 dark:border-gray-700 last:border-0 pb-2 last:pb-0">
                          <div className="flex items-start justify-between text-xs">
                            <div className="flex items-start gap-1 flex-1 min-w-0">
                              <span className="text-gray-500 flex-shrink-0">#{poolIndex + 1}</span>
                              <span className="font-medium flex-shrink-0">{pool.dex}</span>
                              <div className="flex-1 min-w-0">
                                <div className="text-gray-500">{pool.name}</div>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(pool.address);
                                      showToast('Pool address copied!', 'success');
                                    }}
                                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 inline-flex items-center gap-0.5"
                                    title="Click to copy pool address"
                                  >
                                    <Copy className="h-3 w-3" />
                                    <span className="text-[10px]">{pool.address.slice(0, 4)}...{pool.address.slice(-4)}</span>
                                  </button>
                                  <button
                                    onClick={() => window.open(`https://solscan.io/account/${pool.address}`, '_blank')}
                                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 inline-flex items-center"
                                    title="View pool on Solscan"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </button>
                                </div>
                                {/* Pool reserves */}
                                <div className="text-[10px] text-gray-500 mt-1" title="Estimated reserves based on liquidity">
                                  <div>≈ {pool.baseTokenSymbol}: {pool.baseTokenReserve}</div>
                                  <div>≈ {pool.quoteTokenSymbol}: {pool.quoteTokenReserve}</div>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end ml-2 flex-shrink-0">
                              <span className="font-medium">${formatPrice(pool.priceUsd)}</span>
                              <span className="text-gray-500 text-[10px]">Vol: {formatNumber(parseFloat(pool.volume24h))}</span>
                              <span className="text-gray-500 text-[10px]">Liq: {formatNumber(parseFloat(pool.liquidity))}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-2 text-xs">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(tokenInfo.address);
                          showToast('Token address copied!', 'success');
                        }}
                        className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 inline-flex items-center gap-1 w-full text-left"
                      >
                        <Copy className="h-3 w-3 flex-shrink-0" />
                        <span className="break-all text-[10px]">Address: {tokenInfo.address}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {tokenInfos.length === 0 && !loading && tokens.length > 0 && (
            <div className="col-span-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tokens.filter(token => token !== 'So11111111111111111111111111111111111111112').map((token, index) => (
                <div key={`${token}-${index}`} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                  <p className="font-mono text-sm">{token}</p>
                  <p className="text-xs text-gray-500 mt-1">Token information not available</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`https://solscan.io/token/${token}`, '_blank')}
                    className="text-xs mt-2 inline-flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View on Solscan
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary Statistics */}
        {tokenInfos.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <h4 className="font-medium mb-3">Portfolio Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Total Tokens</p>
                <p className="font-medium">
                  {tokenInfos.length}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Volume (24h)</p>
                <p className="font-medium">
                  {formatNumber(tokenInfos.reduce((sum, t) => sum + t.totalVolume24h, 0))}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Liquidity</p>
                <p className="font-medium">
                  {formatNumber(tokenInfos.reduce((sum, t) => sum + t.totalLiquidity, 0))}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Pools</p>
                <p className="font-medium">
                  {tokenInfos.reduce((sum, t) => sum + t.poolCount, 0)}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
