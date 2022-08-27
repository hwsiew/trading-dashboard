import Candles from "./Candles";
import {
  trades,
  more_trades
} from '../../__mocks__';

describe("Test Candles", () => {

  it('should calculate empty trades', () => {
    const interval = 60;
    const candles = Candles.calculate([], interval);

    expect(candles).toEqual([]);
  });

  it('should calculate trades into candle', () => {
    const interval = 60;
    const candles = Candles.calculate(trades, interval);

    expect(candles.pop()).toEqual(
      {
        open: '169480.00000000',
        close: '169488.00000000',
        high: '169488.00000000',
        low: '169479.00000000',
        volume: '0.013462',
        timestamp: 1651376760000
      }
    );
  });

  it('should calculate trades into candles', () => {
    const interval = 60;
    const candles = Candles.calculate([...trades, ...more_trades], interval);

    expect(candles.shift()).toEqual(
      {
        open: '169480.00000000',
        close: '169488.00000000',
        high: '169488.00000000',
        low: '169479.00000000',
        volume: '0.013462',
        timestamp: 1651376760000
      }
    );

    expect(candles.shift()).toEqual(
      {
        open: '169480.00000000',
        close: '169480.00000000',
        high: '169480.00000000',
        low: '169480.00000000',
        volume: '0.00147500',
        timestamp: 1651376820000
      }
    );

    expect(candles.shift()).toEqual(
      {
        open: '169480.00000000',
        close: '169477.00000000',
        high: '169480.00000000',
        low: '169477.00000000',
        volume: '0.037182',
        timestamp: 1651376880000
      }
    );

    expect(candles.shift()).toEqual(
      {
        open: '169480.00000000',
        close: '169480.00000000',
        high: '169480.00000000',
        low: '169480.00000000',
        volume: '0.01180100',
        timestamp: 1651376940000
      }
    );

    expect(candles.shift()).toBeUndefined();
  });

});