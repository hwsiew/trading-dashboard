import {
  Order,
  OrderType,
  OHLCV,
  Class
} from 'types';
import events from 'events';
// import { Strategy } from 'classes/Strategy';

export enum Crypto {
  Bitcoin = 'XBT',
  Ethereum = 'ETH',
}

export enum CurrencyPair {
  XBTMYR = 'XBTMYR',
  ETHMYR = 'ETHMYR',
}

export enum Timeframe {
  OneMin = 60,
  FiveMin = 300,
  FifteenMin = 900,
  ThirtyMin = 1800,
  OneHour = 3600 
}

interface Pair {
  id: CurrencyPair,
  candles: Timeframe[];
  // strategies: Class<Strategy>[];
}

export type Options = {
  api_key_id: string;
  api_key_secret: string;
  pairs: Pair[];
  event_lord: events;
  dry_run?: boolean; // Paper trading or live trading
}

export type CreateOrder = {
  order_id: string;
  type: OrderType;
  price: string;
  volume: string;
};

type DeleteOrder = {
  order_id: string;
};

type TradeOrder = {
  base: string; // trade volume
  counter: string; //  trade volume * order.price
  maker_order_id: string;
  taker_order_id: string;
};

type StatusUpdate = {
  // "ACTIVE" when the market is trading normally
  // "POSTONLY" when the market has been suspended and only post-only orders will be accepted
  // "DISABLED" when the market is shutdown and no orders can be accepted
  status: string; 
};

export interface OnMessageMeta {
  sequence: string;
  timestamp: number;
}

export interface OnOrderBookMessage extends OnMessageMeta {
  status: string;
  asks: Order[];
  bids: Order[];
}

export interface OnOrderUpdateMessage extends OnMessageMeta {
  trade_updates: TradeOrder[];
  create_update: null | CreateOrder;
  delete_update: null | DeleteOrder;
  status_update: null | StatusUpdate;
}

type TradeDate = {
  is_buy: boolean,
  price: string,
  sequence: number,
  timestamp: string,
  volume: string
}

export type ApiTradesResponse = {
  trades : TradeDate[];
}

export type ApiCandlesResponse = {
  candles: OHLCV[];
  duration: number;
  pair: string;
}