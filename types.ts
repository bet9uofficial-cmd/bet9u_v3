
export interface User {
  user_id: string;
  email: string;
  mobileNum?: string; // Matched with Supabase column
  username: string;
  created_at: string;
}

export interface Wallet {
  user_id: string;
  balance: number;
  bonus_balance: number;
  currency_code: string;
}

export interface Transaction {
  transaction_id: number;
  user_id: string;
  transaction_type: string;
  amount: number;
  external_ref_id?: string;
  status: 'Pending' | 'Success' | 'Failed';
  payment_method: string;
  created_at: string;
}

export interface VIPLevel {
  level_id: number;
  level_name: string;
  min_cumulative_deposit: number;
  min_cumulative_turnover: number;
  daily_rebate_rate: number;
  withdrawal_limit_multiplier: number;
}

export interface UserVIPStatus {
  user_id: string;
  current_level_id: number;
  cumulative_deposit: number;
  cumulative_turnover: number;
  vip_level?: VIPLevel; // Joined view
}

export interface Game {
  game_id: number;
  provider_id: number;
  game_title: string;
  game_category: string;
  is_active: boolean;
  icon_url?: string;
}

export interface RGLimits {
  user_id: string;
  deposit_limit_daily?: number;
  deposit_limit_weekly?: number;
  deposit_limit_monthly?: number;
  current_deposit_today: number;
  self_exclusion_end_date?: string;
  is_active: boolean;
}

export interface CMSContent {
  content_id: number;
  content_key: string;
  title: string;
  body?: string;
  action_link?: string;
  image_url?: string;
  sort_order: number;
}

export interface DepositBank {
  id: number;
  payid?: string;
  acc_name: string;
  acc_num?: string;
  bsb?: string;
}

export enum TabView {
  MENU = 'MENU',
  CASINO = 'CASINO',
  BONUS = 'BONUS',
  SPORTS = 'SPORTS',
  SEARCH = 'SEARCH',
  WALLET = 'WALLET' // Modal/Subpage view
}
