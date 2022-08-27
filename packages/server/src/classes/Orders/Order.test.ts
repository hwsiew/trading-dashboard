import Orders from "./Orders";
import {
  Order,
  OrderType
} from 'types';

describe('Test Orders class', () => {
  let orders: Orders<Order>;
  beforeEach(() => {
    orders = new Orders(OrderType.Ask);
  })

  it('should add order',() => {
    orders.add({
      id: 'a1',
      price: '1',
      volume: '0.1',
      type: OrderType.Ask
    });

    expect(orders.size).toBe(1);
    expect(orders.total).toBe(1);

    orders.add({
      id: 'a2',
      price: '1',
      volume: '0.2',
      type: OrderType.Ask
    });

    // same price 
    expect(orders.size).toBe(1);
    expect(orders.total).toBe(2);

    orders.add({
      id: 'a3',
      price: '1.1',
      volume: '0.1',
      type: OrderType.Ask
    });

    // different price
    expect(orders.size).toBe(2);
    expect(orders.total).toBe(3);

  });

  it('should throw error when add incompatible type', () => {
    expect(() => {
      orders.add({
        id: 'b1',
        price: '1',
        volume: '0.1',
        type: OrderType.Bid
      });  
    }).toThrow();
  });

  it('should throw error when add order with same id', () => {
    orders.add({
      id: 'a1',
      price: '1',
      volume: '0.1',
      type: OrderType.Ask
    });  

    expect(() => {
      orders.add({
        id: 'a1',
        price: '1',
        volume: '0.1',
        type: OrderType.Ask
      });  
    }).toThrow();
  });

  it('should get order by id', () => {
    const order = {
      id: 'a1',
      price: '1',
      volume: '0.1',
      type: OrderType.Ask
    };

    orders.add(order);
    expect(orders.get(order.id)).toEqual(order);
  });

  it('should return null when order id not found', () => {
    const order = {
      id: 'a1',
      price: '1',
      volume: '0.1',
      type: OrderType.Ask
    };

    orders.add(order);
    expect(orders.get('b1')).toBeNull();
  });

  it('should reduce order by volume', () => {
    const order = {
      id: 'a1',
      price: '1',
      volume: '0.1',
      type: OrderType.Ask
    };

    orders.add(order);

    orders.reduce(order.id, '0.05');

    expect(orders.get(order.id)?.volume).toBe('0.05');

    orders.reduce(order.id, '0.05');

    // because order volume is 0 so will be removed;
    expect(orders.get(order.id)).toBeNull();
    expect(orders.size).toBe(0);
    expect(orders.total).toBe(0);
  });
})