import OrdersBook from "./OrdersBook";
import {
  Order,
  OrderType
} from 'classes/Orders';

describe('Test OrdersBook class', () => {
  let orders_book: OrdersBook<Order>;
  beforeEach(() => {
    orders_book = new OrdersBook();
  });

  it('should add orders', () => {
    const orders: Order[] = [
      {
        id: 'a1',
        price: '1',
        volume: '0.1',
        type: OrderType.Ask
      },
      {
        id: 'a2',
        price: '1.2',
        volume: '0.2',
        type: OrderType.Ask
      },
      {
        id: 'b1',
        price: '1',
        volume: '0.1',
        type: OrderType.Bid
      },
      {
        id: 'b2',
        price: '0.9',
        volume: '0.2',
        type: OrderType.Bid
      },
      {
        id: 'a3',
        price: '1',
        volume: '0.5',
        type: OrderType.Ask
      },
    ];

    orders_book.add(orders);

    expect(orders_book.getTopAsks()).toEqual([
      {
        ids: ['a2'],
        price: '1.2',
        volume: '0.2'
      },
      {
        ids: ['a1','a3'],
        price: '1',
        volume: '0.6'
      },
    ]);

    expect(orders_book.getTopBids()).toEqual([
      {
        ids: ['b1'],
        price: '1',
        volume: '0.1'
      },
      {
        ids: ['b2'],
        price: '0.9',
        volume: '0.2'
      },
    ]);

  });

  it('should delete order', () => {
    const ask_orders: Order[] = [
      {
        id: 'a1',
        price: '1',
        volume: '0.1',
        type: OrderType.Ask
      },
      {
        id: 'a2',
        price: '0.9',
        volume: '0.1',
        type: OrderType.Ask
      }
    ];

    orders_book.add(ask_orders);
    expect(orders_book.getTopAsks().length).toBe(ask_orders.length);
    orders_book.del(ask_orders[0].id);
    expect(orders_book.getTopAsks().length).toBe(ask_orders.length -1);
  
    const bid_orders: Order[] = [
      {
        id: 'b1',
        price: '1',
        volume: '0.1',
        type: OrderType.Bid
      },
      {
        id: 'b2',
        price: '0.9',
        volume: '0.1',
        type: OrderType.Bid
      }
    ];

    orders_book.add(bid_orders);
    expect(orders_book.getTopBids().length).toBe(bid_orders.length);
    orders_book.del(bid_orders[0].id);
    expect(orders_book.getTopBids().length).toBe(bid_orders.length - 1);
  });

  it('should throw error when an order id is not found', () => {
    expect(orders_book.find('no_exists')).toBeUndefined();
  });

  it('should update order book with trade', () => {
    const orders: Order[] = [
      {
        id: 'a1',
        price: '1',
        volume: '0.5',
        type: OrderType.Ask
      },
      {
        id: 'b1',
        price: '1',
        volume: '0.5',
        type: OrderType.Bid
      }
    ];

    orders_book.add(orders);

    expect(orders_book.getTopAsks()).toEqual([
      {
        ids: ['a1'],
        price: '1',
        volume: "0.5"
      }
    ]);
    orders_book.trade('a1', "0.2");
    expect(orders_book.getTopAsks()).toEqual([
      {
        ids: ['a1'],
        price: '1',
        volume: "0.3"
      }
    ]);

    expect(orders_book.getTopBids()).toEqual([
      {
        ids: ['b1'],
        price: '1',
        volume: "0.5"
      }
    ]);
    orders_book.trade('b1', "0.3");
    expect(orders_book.getTopBids()).toEqual([
      {
        ids: ['b1'],
        price: '1',
        volume: "0.2"
      }
    ]);
  });

  it('should throw error when id exists in both ask and bid', () => {
    const orders: Order[] = [
      {
        id: 'a1',
        price: '1',
        volume: '0.5',
        type: OrderType.Ask
      },
      {
        id: 'a1',
        price: '1',
        volume: '0.5',
        type: OrderType.Bid
      }
    ];

    orders_book.add(orders);
    expect(() => orders_book.find('a1')).toThrow();
  })
})