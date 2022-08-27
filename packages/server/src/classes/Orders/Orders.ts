import {
  Order,
  OrderType
} from 'types';
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
      return
    }

    this._index.delete(id);
    
    const price = this._prices.get(order.price);
    if (price) {
      const i = price.ids.indexOf(order.id);
      price.ids.splice(i,1);

      if(Big(price.volume).eq(0) || !price.ids.length){
        this._prices.delete(order.price);
      }
    }
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
   * reduce order volume
   */
  reduce (id: O['id'], volume: string) {
    const order = this._index.get(id)
    if (!order) {
      throw new Error('Order id is not found!');
    }

    order.volume = Big(order.volume).minus(volume).toString();
    if (Big(order.volume).eq(0)) {
      this.del(order.id)
    }

    const price = this._prices.get(order.price);
    if (price) {
      price.volume = Big(price.volume).minus(volume).toString();
    }
  }

}