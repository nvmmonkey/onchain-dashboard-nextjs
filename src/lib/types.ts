export interface SSHConfig {
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
}

export interface BotConfig {
  routing: {
    mint_config_list: Array<{
      mint: string;
      pump_pool_list?: string[];
      meteora_dlmm_pool_list?: string[];
      raydium_pool_list?: string[];
      raydium_clmm_pool_list?: string[];
      whirlpool_pool_list?: string[];
      solfi_pool_list?: string[];
      lookup_table_accounts: string[];
      process_delay: number;
    }>;
  };
  rpc: {
    url: string;
  };
  spam: {
    enabled: boolean;
    sending_rpc_urls: string[];
    compute_unit_price: {
      strategy: string;
      from: number;
      to: number;
      count: number;
    };
    skip_preflight: boolean;
  };
  jito: {
    enabled: boolean;
    min_profit?: number;
    block_engine_urls: string[];
    uuid: string;
    no_failure_mode: boolean;
    use_separate_tip_account: boolean;
    block_engine_strategy: string;
    tip_config: {
      strategy: string;
      from: number;
      to: number;
      count: number;
    };
  };
  kamino_flashloan: {
    enabled: boolean;
  };
  bot: {
    base_mint: string;
    compute_unit_limit: number;
    merge_mints: boolean;
  };
  wallet: Record<string, unknown>;
}

export interface Token {
  address: string;
  symbol: string;
  pools: number;
}

export interface MenuOption {
  id: number;
  label: string;
  action: string;
  icon?: string;
}
