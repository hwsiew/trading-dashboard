import OrderBook from "./OrderBook";
import {
  ask_orders,
  bid_orders
} from '../__mocks__'
import { Order, OrderType, CreateOrder } from "../types";

describe('Test OrderBook', () => {
  let order_book: OrderBook<Order>;
  beforeEach(() => {
    order_book = new OrderBook(ask_orders, bid_orders);
  });

  it('should initialize', () => {
    expect(order_book.top(OrderType.Ask)).toEqual(ask_orders);
    expect(order_book.top(OrderType.Bid)).toEqual(bid_orders);
  });

  it('counting', () => {
    expect(order_book.count(OrderType.Ask)).toBe(5);
    expect(order_book.count(OrderType.Bid)).toBe(5);
  });

  it('looping', () => {
    const total = 3;
    const orders: Order[] = [];
    for(let i = 0; i < total; i++){
      orders.push({...ask_orders[i]});
    }

    expect(order_book.top(OrderType.Ask,3)).toEqual(orders);
  });

  it('should delete orders', () => {
    let delete_count = 0;
    const orders = [...ask_orders];
    let order = {...orders[0]};

    // delete first
    order_book.delete(order.id);
    delete_count++;
    expect(order_book.count(OrderType.Ask)).toBe(ask_orders.length-delete_count);

    orders.shift(); // remove the first one
    expect(order_book.top(OrderType.Ask)).toEqual([ ...orders ]);

    // delete middle
    expect(order_book.count(OrderType.Ask)).toBeGreaterThan(3);

    const index = Math.floor(orders.length/2);
    order = { ...orders[index] };
    order_book.delete(order.id);
    delete_count++;
    expect(order_book.count(OrderType.Ask)).toBe(ask_orders.length-delete_count);

    orders.splice(index,1);
    expect(order_book.top(OrderType.Ask)).toEqual([ ...orders ]);

    // delete last 
    order = { ...orders[orders.length-1] };
    order_book.delete(order.id);
    delete_count++;
    expect(order_book.count(OrderType.Ask)).toBe(ask_orders.length-delete_count);

    orders.pop();
    expect(order_book.top(OrderType.Ask)).toEqual([ ...orders ]);

    // delete all
    for(let i = 0 ; i < orders.length; i++) {
      order = orders[i];
      order_book.delete(order.id);
    }
    expect(order_book.count(OrderType.Ask)).toBe(0);
    expect(order_book.top(OrderType.Ask)).toEqual([]);
  });

  it('should add ask orders', () => {
    const order_type = OrderType.Ask;
    const order: Order = {
      id: 'a100',
      price: '100000.0000',
      volume: '1',
      type: OrderType.Ask
    };
    let current_list: Order[] = [...ask_orders];

    // add to the front of the list
    order_book.add(order);
    current_list.unshift({ ...order });
    expect(order_book.top(order_type))
      .toEqual(current_list);

    // add to the middle of the list 
    order.id = 'a101';
    order.price = '100003.00000001'
    order_book.add(order);
    let index = current_list.findIndex(n => n.price === '100004.00000000');
    current_list.splice(index, 0, { ...order });
    expect(order_book.top(order_type))
      .toEqual(current_list);

    // add to the end of the list
    order.id = 'a102';
    order.price = '100005.00000001'
    order_book.add(order);
    current_list.push({ ...order });
    expect(order_book.top(order_type))
      .toEqual(current_list);

    // add the same at the middle
    order.id = 'a103';
    order.price = '100000.00000000'
    order_book.add(order);
    current_list.splice(1, 0, { ...order });
    expect(order_book.top(order_type))
      .toEqual(current_list);

     // add the same at the end
     order.id = 'a104';
     order.price = '100005.00000001'
     order_book.add(order);
     current_list.push({ ...order });
     expect(order_book.top(order_type))
       .toEqual(current_list);
  });

  it('should add bid orders', () => {
    const order_type = OrderType.Bid;
    const order: Order = {
      id: 'b100',
      price: '170006.0000',
      volume: '1',
      type: order_type
    };
    let current_list: Order[] = [ ...bid_orders ];

    // add to the front of the list
    order_book.add(order);
    current_list.unshift({...order});
    expect(order_book.top(order_type))
      .toEqual(current_list);

    // add to the middle of the list 
    order.id = 'b101';
    order.price = '170003.00000001';
    order_book.add(order);
    let index = current_list.findIndex(n => n.price === '170003.00000000');
    current_list.splice(index, 0, { ...order });
    expect(order_book.top(order_type))
      .toEqual(current_list);

    // add to the end of the list
    order.id = 'b102';
    order.price = '169999.00000001'
    order_book.add(order);
    current_list.push({ ...order });
    expect(order_book.top(order_type))
      .toEqual(current_list);

    // add the same at the middle
    order.id = 'b103';
    order.price = '170006.0000';
    order_book.add(order);
    current_list.splice( 1, 0, { ...order });
    expect(order_book.top(order_type))
      .toEqual(current_list);

    // add the same at the end
    order.id = 'b104';
    order.price = '169999.00000001';
    order_book.add(order);
    current_list.push({ ...order });
    expect(order_book.top(order_type))
      .toEqual(current_list);
  });

  it('should reduce orders', () => {
    // reduce the first one
    order_book.reduce('a1','0.01');
    let order = order_book.getOrder('a1');
    expect(order?.volume).toBe('0.048821');

    // reduce the middle
    order_book.reduce('a3','0.00321');
    order = order_book.getOrder('a3');
    expect(order?.volume).toBe('0.055611');

    // reduce the last
    order_book.reduce('a5','0.0231');
    order = order_book.getOrder('a5');
    expect(order?.volume).toBe('0.035721');

    // reduce to remove
    order_book.reduce('a3','0.055611');
    order = order_book.getOrder('a3');
    expect(order).toBeUndefined();
    expect(order_book.count(OrderType.Ask)).toBe(ask_orders.length - 1);
  });
});