export * from './order';
export * from './luno';

export interface OHLCV {
  open: string;
  close: string;
  high: string;
  low: string;
  volume: string;
  timestamp: number;
};

export interface Trade {
  price: string;
  timestamp: number;
  volume: string;
  counter: string;
  meta?: Record<string, unknown>
}

export interface Class<T> {
  new(...args: any[]): T; 
}

export enum LogType {
  Info = 'info',
  Error = 'error',
  Warning = 'warning'
};

export type Timestamp = number;

export interface OHLCVWithTrades extends OHLCV {
  trades?: Trade[];
}