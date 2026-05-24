/** OHLC series used by market API routes and future chart modules. */
export type OhlcCandle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};
