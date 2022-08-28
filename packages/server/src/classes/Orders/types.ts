export enum OrderType {
  Ask = 'ASK',
  Bid = 'BID'
}

export interface Order {
  id: string;
  price: string;
  volume: string;
  type: OrderType;
};