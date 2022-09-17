import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import{
  PriceTableProps
} from './types';
import clsx from 'clsx';


export default function PriceTable (
  {
    data = [],
    title,
    isBuy
  }: PriceTableProps
) {

  const hasDate = data.every(d => d.date);

  return (
    <div style={{ paddingTop: 5 }}>
      { title && 
        <div style={{ textAlign: 'center' }}>{title}</div>
      }
      <TableContainer style={{ maxHeight: 400 }}> 
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              {
                hasDate &&
                <TableCell align="center">DateTime</TableCell>
              }
              <TableCell align="center">Price</TableCell>
              <TableCell align="center">Amount</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {
              data.map((d,i) => (
                <TableRow key={i} >
                  {
                    hasDate && d.date &&
                    <TableCell align="center">{d.date.toLocaleString()}</TableCell>
                  }
                  <TableCell align="center" sx={{ color: d.isBuy || isBuy ? 'green' : 'red' }}>{d.price} {d.ids && `[${d.ids.length}]`}</TableCell>
                  <TableCell align="center" sx={{ color: d.isBuy || isBuy ? 'green' : 'red' }}>{d.volume}</TableCell>
                </TableRow>
              ))
            }
          </TableBody>
        </Table>
      </TableContainer> 
    </div>
  );
}