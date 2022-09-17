import axios from 'axios';
import  {
  API_HOST
} from './constant';
import {
  OHLCV
} from 'types'
import {
  CurrencyPair,
  Timeframe,
  ApiCandlesResponse,
  ApiTradesResponse
} from './types'

export default class LunoAPI {
  private _client;

  constructor (api_key_id: string, api_key_secret: string) {
    this._client = axios.create({
      baseURL: `https://${API_HOST}`,
      auth:  {
        username: api_key_id,
        password: api_key_secret
      }
    });
  }

  /**
   * Request list of candles
   * @param since 
   * @param duration [60|300|900|...]
   * @returns candles are return in ascending time order which latest come last
   * 
   * @see https://www.luno.com/en/developers/api#operation/GetCandles
   */
  async requestCandles (
    pair: CurrencyPair, 
    since: number, 
    duration: Timeframe
  ):Promise<OHLCV[]|undefined> {
    const response = await this._client.get<ApiCandlesResponse>(
      `/api/exchange/1/candles`, {
        params: {
          pair,
          duration,
          since
        }
      });

    return response.status === 200 ? response.data.candles : undefined;
  }

  /**
   * Request list of trades since
   * @param since timestamp in milliseconds
   * @returns 
   */
  async requestTrades(
    pair: CurrencyPair,
    since: number
  ): Promise<ApiTradesResponse|undefined> {
    const response = await this._client.get(
      '/api/1/trades', {
      params: {
        pair: 'XBTMYR', 
        since
      }
    });

    return response.status === 200 ? response.data : undefined;
  }
}