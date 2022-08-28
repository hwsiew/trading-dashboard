import Orders, { Order, OrderType } from "classes/Orders";

export default class OrdersBook<O extends Order> {
  private _asks = new Orders<O>(OrderType.Ask);
  private _bids = new Orders<O>(OrderType.Bid);

  add (orders: O[]) {
    orders.forEach(o => {
      if (o.type === OrderType.Ask) {
        this._asks.add(o);
      } else if (o.type === OrderType.Bid) {
        this._bids.add(o);
      } 
    });
  }

  del (id: O['id']) {
    const target = this.find(id);
    target && target.del(id);
  }

  find (id: O['id']) {
    const func_name = 'OrdersBook.find';
    if (this._asks.has(id) && this._bids.has(id)) {
      throw new Error(`[${func_name}] Order Id appears in both ask and bid!`);
    } else if (this._asks.has(id)) {
      return this._asks;
    } else if (this._bids.has(id)) {
      return this._bids;
    } else {
      return undefined;
    }
  }

  trade (id: O['id'], volume: O['volume']) {
    const target = this.find(id);
    target && target.reduce(id, volume);
  }

  getTopAsks (count?: number) {
    return this._asks.getPrices(count);
  }

  getTopBids (count?: number) {
    return this._bids.getPrices(count);
  }
}