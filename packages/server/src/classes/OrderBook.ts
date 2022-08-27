import {
  Order,
  OrderType,
  Trade,
  OHLCV,
  Timestamp
} from 'types';
import Decimal from 'decimal.js';
import { LinkedNode } from './LinkedNode';

Decimal.set({ precision: 40 });

interface OrderSummary<O extends Order>{
  price: string;
  volume: string;
  ids: string[]; // list of order id
}

export default class OrderBook<O extends Order> {
  // a list of ask orders
  private _asks: LinkedNode<O> | undefined = undefined;
  // a list of bid orders
  private _bids: LinkedNode<O> | undefined = undefined;
  // indexes which combines both ask and bid orders
  private _indexes = new Map<string, LinkedNode<O>>();
  // trade dictionary where key is timestamp
  private _trades = new Map<Timestamp, Trade[]>();
  private _last_timmestamp = 0;
  private _summarized_asks = new Map<string, OrderSummary<O>>();
  private _summarized_bids = new Map<string, OrderSummary<O>>();

  constructor(asks?: O[], bids?: O[]){
    asks && (this.asks = asks);
    bids && (this.bids = bids);
  }

  set asks(orders: O[]){
    this._enlistOrders(OrderType.Ask, orders);
  }

  set bids(orders: O[]){
    this._enlistOrders(OrderType.Bid, orders);
  }

  /**
   * bid-ask spread
   */
  get ticker() {
    const ask = this._asks;
    const bid = this._bids;
    const trade = this._trades.get(this._last_timmestamp);

    if( !ask || !bid ) 
      return null;

    return {
      ask: ask.data.price,
      bid: bid.data.price,
      spread: (new Decimal(ask.data.price)).minus(bid.data.price),
      last_trade: trade ? trade[0].price : ''
    };
  }

  public isAsk(type: OrderType){
    return type === OrderType.Ask;
  }

  public isBid(type: OrderType){
    return type === OrderType.Bid;
  }

  public getSummarizeOrder(type: OrderType, len?: number){
    const list = this.isAsk(type) ? this._summarized_asks : this._summarized_bids;
    return Array.from(list, ([key, value]) => value).slice(0,len);
  }

  /**
   * to combine orders with same price into one entity
   */
  private _summarizeOrder(type: OrderType, order: O){
    const list = type === OrderType.Ask ? this._summarized_asks : this._summarized_bids;

    const target: OrderSummary<O> = list.get(order.price) || {
      price: order.price,
      volume: order.volume,
      ids: [order.id]
    };

    if( target.ids.indexOf(order.id) === -1 ){
      target.volume = Decimal.add(target.volume, order.volume).toString();
      target.ids.push(order.id)

    }
    
    list.set(order.price, target);
  }

  private _enlistOrders(type: OrderType, orders: O[]){
    let current;
    for(const order of orders){
      const order_node = new LinkedNode<O>({ ...order, type });

      // setup indexes
      if(this._indexes.has(order.id)){
        throw new Error('[ERR] Duplicated order id!')
      } else this._indexes.set(order.id, order_node);

      // attach order to list
      if(!current){
        if(type === OrderType.Ask) this._asks = order_node;
        else this._bids = order_node;
        current = order_node;
      }else {
        current.next = order_node;
        order_node.previous = current;
        current = order_node;
      }

      this._summarizeOrder(type, order);
    }
  }

  private _getList(type: OrderType){
    return type === OrderType.Ask ? this._asks : this._bids;
  }

  private _insertBefore(node: LinkedNode<O>, order: LinkedNode<O>){
    const pre = node.previous;

    node.previous = order;
    order.next = node;
    order.previous = pre;

    pre && (pre.next = order);

    if(node === this._asks) this._asks = order;
    else if(node === this._bids) this._bids = order;
  }

  private _insertAfter(node: LinkedNode<O>, order: LinkedNode<O>){
    const next = node.next;

    node.next = order;
    order.previous = node;
    order.next = next;

    next && (next.previous = order);
  }

  /**
   * perform a trade and add to trade history
   * @param trade an excuted trade 
   */
  trade(
    timestamp: number, 
    price: string, 
    volume: string, 
    counter?: string, 
    meta?: Record<string, unknown>
  ){
    if(!counter){
      counter = (new Decimal(price).times(volume)).toString()
    }

    const trade: Trade = {
      price,
      volume,
      timestamp,
      counter,
      meta: meta
    };

    // Normalize timestamp to seconds and remove millisecond from timestamp
    const _timestamp = Math.floor(timestamp/1000) * 1000;
    this._last_timmestamp = _timestamp;

    if(this._trades.has(_timestamp)){
      const arr = this._trades.get(_timestamp);
      if(arr){
        arr.push(trade)
        this._trades.set(_timestamp, arr)
      }
    } else this._trades.set(_timestamp, [ trade ]);
  }

  /**
   * add an order to order book
   * @param order
   */
  add(order: O){
    // ask is in ascending order, lowest first
    // bid is in descending order, highest first
    let sort_modifier = order.type === OrderType.Ask ? 1 : -1;
    let list = this._getList(order.type);
    // let { order_id, ...others } = order;
    // let order_node = new OrderNode<O>({ ...others, id: order_id })
    let order_node = new LinkedNode<O>({...order});

    if(!list) list = order_node;
    else {
      // look for a suitable position in list for order
      let current: LinkedNode<O> | undefined = list; 
      const order_price = new Decimal(order.price);
      while(current){
        if(
          sort_modifier * order_price.comparedTo(current.data.price) < 0
        ){
          // order should be before current
          // ask.price < current.price
          // bid.price > current.price
          this._insertBefore(current, order_node);
          break;
        } else if (!current.next) { 
          // add order to the end of list
          this._insertAfter(current, order_node);
          break;
        } 

        // else check next
        current = current.next;
      }
    }

    if(this._indexes.has(order.id)){
      throw new Error('[ERR] Duplicated id in add order');
    }

    // update index
    this._indexes.set(order.id, order_node);
  }

  /**
   * Delete an order by `order_id`
   * @param order_id
   */
  delete(order_id: string){
    const target = this._indexes.get(order_id);
  
    if(!target) return;

    if(target.next){
      target.next.previous = target.previous;
    }

    if(target.previous){
      target.previous.next = target.next;
    }

    // if target is the first node, update the list 
    if(target === this._asks) this._asks = target.next;
    else if(target === this._bids) this._bids = target.next;

    // update indexes
    this._indexes.delete(order_id);
  }

  /**
   * Reduce order's volume by `volume_to_reduce`
   * @param order_id 
   * @param volume_to_reduce 
   * @returns 
   */
  reduce(order_id: string, volume_to_reduce: string){
    const order = this.getOrder(order_id);
    if(!order) throw new Error(`[ERROR] Order ${order_id} not found`);

    const old_volume = new Decimal(order.volume);
    const new_volume = old_volume.minus(volume_to_reduce);

    if(new_volume.lessThanOrEqualTo(0)){
      this.delete(order_id);
    } else {
      order.volume = new_volume.toString();
    }
  }

  /**
   * get an order by `id`
   * @param id order id
   * @returns 
   */
  getOrder(id: string){
    if(!this._indexes.has(id)) return undefined;
    else return this._indexes.get(id)?.data;
  }

  getTrades(since: number){
    let timestamp = since+1000;
    const result: Trade[] = [];
    while( timestamp <= this._last_timmestamp){
      const trades = this._trades.get(timestamp);
      if(trades){
        result.push(...trades);
      }

      timestamp += 1000;
    }

    return result;
  }

  /**
   * get a list of ask/bid orders
   * @param type 
   * @param num 
   * @returns an array of orders
   */
  top(type: OrderType, num: number = 10): Order[]{
    const arr: Order[] = [];
    let current = this._getList(type);

    if(current){
      for(let i = num; i > 0; i--){
        const order = current?.data;
        if(order){
          arr.push(order);
          current = current?.next;
        } else break;
      }
    }

    return arr 
  }

  /**
   * count the number of orders  by `type`
   * @param type order type
   * @returns number of orders
   */
  count(type: OrderType){
    let current = this._getList(type);
    let total = 0;
    while(current){
      total++;
      current = current.next;
    }

    return total;
  }

  /**
   * reset the order book
   */
  reset(){
    this._asks = undefined;
    this._bids = undefined;
    this._indexes = new Map();
    this._last_timmestamp = 0;
  }
}
