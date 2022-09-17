import { 
  Grid, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow 
} from "@mui/material";
import PriceTable from "components/PriceTable";

interface Order {
  ids: string[],
  price: string,
  volume: string
}

interface OrderBookProps {
  data: { 
    asks: Order[],
    bids: Order[]
  }
}

export default function OrderBook (
  {
    data
  }: OrderBookProps
) {

  return (
    <Grid container spacing={2}>
      <Grid item xs={6}>
        <PriceTable title="BUY" data={data.bids} isBuy/>
      </Grid>
      <Grid item xs={6}>
        <PriceTable title='SELL' data={data.asks}/>
      </Grid>
    </Grid>
  );
}