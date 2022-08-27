import WebSocket from 'ws';
import axios from 'axios';

import OrderBook from 'classes/OrderBook';
import Candles from 'classes/Candles';
import {
  Options,
  OnMessageMeta,
  OnOrderBookMessage,
  OnOrderUpdateMessage,
  ApiTradesResponse,
  ApiCandlesResponse,
  CurrencyPair,
} from './types'
import {
  OHLCV,
  Order,
  OrderType
} from 'types'
import { logError, logInfo } from 'utils/log';
// import { Strategy } from 'classes/Strategy';

function createWSConnection(
  endpoint: string, 
  onOpen: (ws: WebSocket) => () => void,
  onMessage: (ws: WebSocket) => (data: WebSocket.RawData) => void,
  onClose: (ws: WebSocket) => () => void,
  onError: (ws: WebSocket) => (error: Error) => void,
){

  const ws = new WebSocket(endpoint, {
    perMessageDeflate: false
  });

  ws.on('open', onOpen(ws));
  ws.on('error', onError(ws));
  ws.on('close', onClose(ws));
  ws.on('message', onMessage(ws))

  return ws;
}

const Luno = (async function(options: Options){
  const ws_host   = 'ws.luno.com';
  const api_host  = 'api.luno.com';
  const version   = 1;
  const pairs     = options.pairs;
  const auth      = {
    api_key_id: options.api_key_id, 
    api_key_secret: options.api_key_secret
  };
  const event_lord = options.event_lord;
  
  const api_endpoint = `https://${api_host}`
  const stream_endpoint = `wss://${ws_host}/api/${version}/stream`;
  const userstream_endpoint = `wss://${ws_host}/api/${version}/userstream`;

  const tickers: Map<CurrencyPair, {
    initial: boolean, // check if inital message is sent
    order_book: OrderBook<Order>,
    last_sequence:  number, // sequence number to ensure message are in order
    candles: Map<number, Candles>,
    // strategies: Strategy[]
  }> = new Map();

  const remote = axios.create({
    baseURL: api_endpoint,
    auth:  {
      username: auth.api_key_id,
      password: auth.api_key_secret
    }
  });

  /**
   * Request list of trades since
   * @param since timestamp in milliseconds
   * @returns 
   */
   const requestTrades = (pair: CurrencyPair) => async function(
    since: number
  ): Promise<ApiTradesResponse|undefined> {
    const response = await remote.get(
      '/api/1/trades', {
      params: {
        pair: 'XBTMYR',//pair,
        since
      }
    });

    return response.status === 200 ? response.data : undefined;
  };

  /**
   * Request list of candles
   * @param timestamp 
   * @param duration [60|300|900|...]
   * @returns candles are return in ascending time order which latest come last
   * 
   * @see https://www.luno.com/en/developers/api#operation/GetCandles
   */
  const requestCandles = (pair: CurrencyPair) => async function(
    since: number,
    duration: number = 300
  ): Promise<OHLCV[]|undefined> {
    const response = await remote.get<ApiCandlesResponse>(
      `/api/exchange/1/candles`, {
        params: {
          pair,
          duration,
          since
        }
      });

    return response.status === 200 ? response.data.candles : undefined;
  }

  const onOpenProvider = (pair: CurrencyPair) => {
    return (ws: WebSocket) => () => {
      logInfo(`Connection open for ${pair}`);
      logInfo('Sending authentication...');
      ws.send(JSON.stringify(auth));
    };
  }

  const onErrorProvider = (pair: CurrencyPair) => {
    return (ws: WebSocket) => (error: Error) => {
      logInfo(`[${pair}] socket error...`);
      logError(error.message);
    };
  }

  const onCloseProvider = (pair: CurrencyPair) => {
    const ticker = tickers.get(pair);
    return (ws: WebSocket) => () => {
      logInfo(`[${pair}] socket close...`);
      if(!ticker) return;

      ticker.last_sequence = 0;
      ticker.order_book.reset();
      setTimeout(function(){
        logInfo(`[${pair}] restart connection...`);
        createWSConnection(
          `${stream_endpoint}/${pair}`, 
          onOpenProvider(pair),
          onMessageProvider(pair),
          onCloseProvider(pair),
          onErrorProvider(pair)
        );
      }, 5000);
    };
  }
 
  const onMessageProvider = (pair: CurrencyPair) => {
    const ticker = tickers.get(pair);
    return (ws: WebSocket) => (data: WebSocket.RawData) => {
      const message = JSON.parse(data.toString()) as OnMessageMeta;
      const sequence = parseInt(message.sequence);

      logInfo(sequence)

      if (!ticker) {
        logError(`${pair} target not found`);
        return
      }

      const { initial, last_sequence, order_book, candles } = ticker;

      /*
       * to detect if meesage is out of sequence 
       */
      if(last_sequence !== 0 && last_sequence + 1 !== sequence){
        // message is out of order 
        // so it means to be reconnect
        logError('Out of order...', last_sequence);
        ws.terminate();
        return;
      } else {
        ticker.last_sequence = sequence;
      }

      /**
       * Initialization
       */
      if(!initial){ // this will only run for the first message
        ticker.initial = true; // immediate set to true to prevent this block runnning again
        const update = message as OnOrderBookMessage;

        order_book.reset();
        order_book.asks = [...update.asks];
        order_book.bids = [...update.bids];

        return;
      }

      const update = message as OnOrderUpdateMessage;

      /**
       * Order Delete Update
       */
      if(update.delete_update){
        const order_id = update.delete_update.order_id;
        order_book.delete(order_id);
      }

      /**
       * Order Create Update
       */
      if(update.create_update){
        const { order_id, ...order } = update.create_update;
        order_book.add({ ...order, id: order_id });
      }

      /**
       * Trades Update
       */
      if(update.trade_updates.length){
        update.trade_updates.forEach(trade => {
          const order = order_book.getOrder(trade.maker_order_id);
          if(!order) {
            logError(`Order ${trade.maker_order_id} is not found!`);
            return;
          }
          
          // add to trade history
          order_book.trade(
            update.timestamp,
            order.price,
            trade.base, 
            trade.counter, 
            {
              order_id: order.id,
              order_type: order.type
            }
          );

          // reduce trade order volume
          order_book.reduce(order.id, trade.base);
        });

        for(const [interval, candle] of candles.entries()){
          if(candle.ready)
            candle.load(requestCandles(pair))
              .then(msg => {
                console.log('added ', msg);
                console.log(candle.size);
                // console.log(candle.latest)
              });
        }
      }

      /**
       *  Status Update
       */
      if(update.status_update){
        console.log('status ', update.status_update)
      }

      event_lord.emit('message', order_book.top(OrderType.Ask,10))

    };
  }

  return {
    requestTrades,
    requestCandles,
    stream: async function ( ) {
      for(const { id: pair, candles } of pairs){

        const _candles: Map<number, Candles> = new Map();
        const now = Date.now();
        logInfo('Requesting candles...');
        for(const interval of candles){
          const candle = new Candles(interval);
          _candles.set(interval, candle);
          await candle.load(
            requestCandles(pair), 
            now - 7*24*60*60*1000 // up to 7 days data
          );
          logInfo(
            `Candle ${interval} for ${pair} initialized with ${candle.size} candles`
          );
        }
        
        tickers.set(pair, {
          initial: false,
          order_book: new OrderBook<Order>(),
          last_sequence: 0,
          candles: _candles
        });

        createWSConnection(
          `${stream_endpoint}/${pair}`, 
          onOpenProvider(pair),
          onMessageProvider(pair),
          onCloseProvider(pair),
          onErrorProvider(pair)
        );
    
      }
    },
  };
});

export default Luno;


// deprecated: function(){
      
//   last_sequence = 0;
//   order_book.reset();

//   const ws = new WebSocket(`${stream_endpoint}/${pairs[0]}`, {
//     perMessageDeflate: false
//   });

//   ws.on('open', function open() {
//     logInfo('Connection open...');
//     logInfo('Sending authentication...');
//     ws.send(JSON.stringify(auth));
//   });

//   ws.on('error', (error) => {
//     logInfo('socket error...');
//     logError(error.message);
//   });

//   ws.on('close', () => {
//     logInfo('socket close...');
//     setTimeout(() => this.stream(), 5000);
//   });

//   ws.on('message', async (data) => {
//     const message = JSON.parse(data.toString()) as OnMessageMeta;
//     const sequence = parseInt(message.sequence);

//     /*
//      * to detect if meesage is out of sequence 
//      */
//     if(last_sequence !== 0 && last_sequence + 1 !== sequence){
//       // message is out of order 
//       // so it means to be reconnect
//       logError('Out of order...', last_sequence);
//       ws.terminate();
//       return;
//     } else {
//       last_sequence = sequence;
//     }

//     /**
//      * Initialization
//      */
//     if(!initial){ // this will only run for the first message
//       initial = true; // immediate set to true to prevent this block runnning again
//       const update = message as OnOrderBookMessage;

//       order_book.reset();
//       order_book.asks = [...update.asks];
//       order_book.bids = [...update.bids];

//       return;
//     }

//     const update = message as OnOrderUpdateMessage;

//     /**
//      * Order Delete Update
//      */
//     if(update.delete_update){
//       const order_id = update.delete_update.order_id;
//       order_book.delete(order_id);
//     }

//     /**
//      * Order Create Update
//      */
//     if(update.create_update){
//       const { order_id, ...order } = update.create_update;
//       order_book.add({ ...order, id: order_id });
//     }

//     /**
//      * Trades Update
//      */
//     if(update.trade_updates.length){
//       update.trade_updates.forEach(trade => {
//         const order = order_book.getOrder(trade.maker_order_id);
//         if(!order) {
//           logError(`Order ${trade.maker_order_id} is not found!`);
//           return;
//         }
        
//         // add to trade history
//         order_book.trade(
//           update.timestamp,
//           order.price,
//           trade.base, 
//           trade.counter, 
//           {
//             order_id: order.id,
//             order_type: order.type
//           }
//         );

//         // reduce trade order volume
//         order_book.reduce(order.id, trade.base);
//       });

//       for(const [interval, candle] of candles.entries()){
//         if(candle.ready)
//           candle.load(this.requestCandles)
//             .then(msg => {
//               console.log('added ', msg);
//               console.log(candle.size);
//               // console.log(candle.latest)
//             });
//       }
//     }

//     /**
//      *  Status Update
//      */
//     if(update.status_update){
//       console.log('status ', update.status_update)
//     }

//     /**
//      * Regular prompt
//      */
//     // if(sequence%1000 === 0){
//     //   logInfo(order_book.ticker);
//     // }
//   });
// }