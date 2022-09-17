import { Box, Chip } from "@mui/material";

import PriceTable from 'components/PriceTable';
import { useState } from "react";

export default function TradeTable () {

  const [ownOnly, setOwnOnly] = useState<boolean>(false);

  const data= [
    {
      date: new Date(),
      price: '103,850',
      volume: '1.01',
      isBuy: true
    },
    {
      date: new Date(),
      price: '1',
      volume: '1.01',
      isBuy: false
    },
  ]

  return (
    <Box sx={{ marginTop:'10px' }}>
      <Box sx={{ display: 'flex', alignItems: 'center'}}>
        <Box component={'span'} sx={{ flexGrow: 1}}>Trades</Box>
        <Chip label="Own" onClick={() => setOwnOnly(!ownOnly)} variant={ ownOnly ? "filled" : "outlined" } />
      </Box>
      <PriceTable data={data}/>
    </Box>
  );
}