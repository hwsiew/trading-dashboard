import {
  OHLCV,
  Trade,
  OHLCVWithTrades,
} from 'types';
import Big from 'big.js';

export default class Candles {

  private _data: OHLCVWithTrades[] = [];
  private _index = new Map<number, OHLCVWithTrades>();
  private _interval: number; // seconds 
  private _loading: boolean = false; // to check if loading data is in progress
  private _initialized: boolean = false; // flag to indicate Candles is ready for trades update

  /**
   * Calculate trades into candles
   * @param trades 
   * @param interval 
   * @returns 
   */
  static calculate(trades: Trade[], interval: number){
    const candles = new Map<number, OHLCV>();
    trades.sort((a,b) => a.timestamp - b.timestamp);

    for(const trade of trades){
      const timestamp = Math.floor(trade.timestamp/(interval*1000))*(interval*1000);
      
      let ohlcv = candles.get(timestamp);

      if(!ohlcv){
        ohlcv = {
          open: trade.price,
          close: trade.price,
          high: trade.price,
          low: trade.price,
          volume: trade.volume,
          timestamp
        };
        candles.set(timestamp, ohlcv);
      } else {
        ohlcv.close = trade.price;
        ohlcv.volume = new Big(ohlcv.volume).add(trade.volume).toString();
        if(new Big(trade.price).gt(ohlcv.high)){
          ohlcv.high = trade.price;
        } else if (new Big(trade.price).lt(ohlcv.low)){
          ohlcv.low = trade.price;
        }
      }
    }

    return [ ...candles.values() ];
  }

  constructor(interval: number){
    this._interval = interval;
  }

  /**
   * Get the latest candle
   */
  get latest() {
    const len = this.size;
    if(len === 0) return undefined;
    return this._data[len-1];
  }

  /**
   * Check if candles had been initialized
   */
  get ready(){
    return this._initialized;
  }

  /**
   * Get the size of candels
   */
  get size(){
    return this._data.length;
  }

  /**
   * recursively fetch a list of OHCLV from api
   * @param cb a fetch function to get list of OHCLV
   * @param timestamp since timestamp
   * @param added how many added after this recursive call
   * @return a promise which should resolve to number of bar added
   */
  load(
    cb: (timestamp: number, duration?: number) => Promise<OHLCV[]|undefined>, 
    timestamp?: number,
    added: number = 0
  ): Promise<number> {
    const now = Date.now();
    if(!timestamp) {
      const len = this._data.length
      if(len === 0) timestamp = now;
      else timestamp = this._data[len-1].timestamp;
    }

    // less than time interval
    if(now - timestamp < this._interval * 1000) 
      return Promise.resolve(added);

    if(this._loading) return Promise.resolve(added);

    this._loading = true;
    return cb(timestamp, this._interval)
      .then(candles => {
        this._loading = false;

        // todo: reload if candles is not return
        if(!Array.isArray(candles)){
          return Promise.resolve(added);
        }

        candles.forEach(ohlcv => {
          added += this.append(ohlcv);
        });

        if(candles.length !== 0){
          const last = this.latest;
          if(last && last.timestamp !== timestamp)
            return new Promise(resolve => {
              setTimeout(() => 
                resolve(this.load(cb, last.timestamp + this._interval*1000, added)), 
                1000
              );
            })   
        }

        return Promise.resolve(added);
      });
  }

  /**
   * Append one ohlcv to the end of candles
   * It is on purpose to only add one at a time in order to trigger stategy
   * @param ohlcv an ohlcv
   */
  append(ohlcv: OHLCVWithTrades): number {
    const len = this.size;
    let added = false;
    if(len === 0){
      this._data.push(ohlcv);
      this._index.set(ohlcv.timestamp, ohlcv);
      added = true;
    } else {
      const last = this._data[len - 1];
      if(ohlcv.timestamp - last.timestamp === this._interval * 1000){
        this._data.push(ohlcv);
        this._index.set(ohlcv.timestamp, ohlcv);
        added = true;
      }
    }  
    
    if(added) {
      // for(const strategy of this._strategies){
      //   strategy.next(ohlcv, this.ready)
      // }
    }
    
    return added ? 1 : 0; // how many are added
  }

  /**
   * Set the candle to be ready for updates
   */
  setReady() {
    this._initialized = true;
  }

  /**
   * Compute trades into OHLCV
   * @param trades 
   * @returns 
   */
  getBars(trades: Trade[]): OHLCV[]{
    return Candles.calculate(trades, this._interval);
  }
}