export interface RowData {
  date?: Date;
  price: string;
  volume: string;
  ids?: string[];
  isBuy?: boolean;
}

export interface PriceTableProps {
  data?: RowData[];
  title?: string;
  isBuy?: boolean;
}