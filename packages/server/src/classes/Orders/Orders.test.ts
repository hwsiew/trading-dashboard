import Orders from "./Orders";
import {
  Order,
  OrderType
} from './types';

describe('Test Orders class', () => {
  let orders: Orders<Order>;
  beforeEach(() => {
    orders = new Orders(OrderType.Ask);
  });

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

  it('should throw error when deleting an unknown order',() => {
    expect(() => {
      orders.del('c1')
    }).toThrow()
  });

  it('should throw error when reducing an unknown order',() => {
    expect(() => {
      orders.reduce('c1','0.1')
    }).toThrow();
  });

  it('should get sorted prices list', () => {
    orders.add({
      id: 'a1',
      price: '1',
      volume: '0.1',
      type: OrderType.Ask
    });

    orders.add({
      id: 'a2',
      price: '1',
      volume: '0.2',
      type: OrderType.Ask
    });

    orders.add({
      id: 'a3',
      price: '0.8',
      volume: '0.2',
      type: OrderType.Ask
    });

    orders.add({
      id: 'a4',
      price: '1.1',
      volume: '0.2',
      type: OrderType.Ask
    });

    orders.add({
      id: 'a5',
      price: '0.9',
      volume: '0.2',
      type: OrderType.Ask
    });

    expect(orders.getPrices()).toEqual([
      {
        ids: ['a4'],
        price: '1.1',
        volume: '0.2',
      },
      {
        ids: ['a1','a2'],
        price: '1',
        volume: '0.3',
      },
      {
        ids: ['a5'],
        price: '0.9',
        volume: '0.2',
      },
      {
        ids: ['a3'],
        price: '0.8',
        volume: '0.2'
      }
    ])
    

  });

  it('should check if an order exists', () => {
    orders.add({
      id: 'a1',
      price: '1',
      volume: '0.1',
      type: OrderType.Ask
    });

    expect(orders.has('a1')).toBeTruthy();
    expect(orders.has('a2')).toBeFalsy();
  });

  it('should get order type', () => {
    expect(orders.getType()).toBe(OrderType.Ask)
  });

  it('should delete an order', () => {
    orders.add({
      id: 'a1',
      price: '1',
      volume: '0.1',
      type: OrderType.Ask
    });
    expect(orders.getPrices().length).toBe(1);
    orders.del('a1');
    expect(orders.getPrices().length).toBe(0);
    expect(orders.get('a1')).toBeFalsy();
  })
})