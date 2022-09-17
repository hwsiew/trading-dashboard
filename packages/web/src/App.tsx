import { useState, useEffect } from 'react'

import OrderBook from './components/OrderBook';
import TradeTable from 'components/TradeTable';
import { Box,  Grid, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
import './App.css'
import StockCart from 'components/StockCart';
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
} from 'react-query';

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'center',
  color: theme.palette.text.secondary,
}));

const queryClient = new QueryClient()

function App() {
  const [orders_book, setOrdersBook] = useState({ asks: [], bids: [] })

  useEffect( () => {
    const events = new EventSource('/events');

    events.onmessage = (event) => {

      const parsedData = JSON.parse(event.data);
      if (! ('ready' in parsedData) ){
        setOrdersBook(parsedData)
      }
    }
      
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="App">
        <Box sx={{ flexGrow: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={8}>
              <StockCart />
            </Grid>
            <Grid item xs={4}>
              <OrderBook data={orders_book}/>
              <TradeTable />
            </Grid>
          </Grid>
        </Box>
      </div>
    </QueryClientProvider>
  )
}

export default App
