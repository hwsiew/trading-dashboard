import {
  Order,
  OrderType
} from './types';
import Big from 'big.js';

export default class Orders<O extends Order>{
  private _index = new Map<O['id'], O>();
  private _prices = new Map<O['price'], { volume: string, ids: O['id'][] }>();
  private _type: OrderType;
  
  constructor(type: OrderType){
    this._type = type;
  }

  /**
   * get the total number of orders
   */
  get total () {
    return this._index.size;
  }

  /**
   * get the number of different prices
   */
  get size () {
    return this._prices.size;
  }

  /**
   * add an order
   */
  add(order: O){
    if(this._index.has(order.id)){
      throw new Error('Duplicated id is found in the order list!');
    }

    if (order.type !== this._type) {
      throw new Error('Invalid order type!');
    }

    this._index.set(order.id, order);

    // to calculate price volume summary
    const price = this._prices.get(order.price);
    if(!price){
      this._prices.set(order.price, {
        volume: order.volume,
        ids: [order.id]
      });
    } else {
      price.volume = Big(price.volume).add(order.volume).toString();
      price.ids.push(order.id);

      this._prices.set(order.price, price);
    }
  }

  /**
   * delete order by id and remove from price volume list
   */
  del (id: O['id']) {
    const order = this._index.get(id);
    if (!order) {
      throw new Error('Order is not found!')
    }

    this.reduce(id, order.volume);
  }

  /**
   * get order by id
   */
  get (id: O['id']) {
    if(!this._index.has(id)){
      return null;
    }

    return this._index.get(id);
  }

  /**
   * check if an order id exists
   */
  has (id: O['id']) {
    return this._index.has(id);
  }

  /**
   * reduce order volume
   */
  reduce (id: O['id'], volume: string) {
    const order = this._index.get(id)
    if (!order) {
      throw new Error('Order id is not found!');
    }

    let deleted = false;
    order.volume = Big(order.volume).minus(volume).toString();
    if (Big(order.volume).eq(0)) {
      this._index.delete(id);
      deleted = true;
    }

    const price = this._prices.get(order.price);
    if (price) {
      price.volume = Big(price.volume).minus(volume).toString();
      
      if (deleted) {
        const i = price.ids.indexOf(order.id);
        price.ids.splice(i,1);
      }

      if(Big(price.volume).eq(0) || !price.ids.length){
        this._prices.delete(order.price);
      }
    }
  }

  /**
   * get sorted price list with optional count
   */
  getPrices (count?: number) {
    const all_prices = Array.from(this._prices.keys());
    all_prices.sort((a,b) => Big(b).minus(a).toNumber());

    const selected = all_prices.slice(0, count);

    const list = selected.reduce<{
      volume: string, 
      ids: O['id'][], 
      price: O["price"]
    }[]>((acc, price) => {
      const entry = this._prices.get(price);

      entry && acc.push({
          ...entry,
          price
        });
    
      return acc;
    },[]);
    
    return list.filter(e => e !== undefined);
  }
}