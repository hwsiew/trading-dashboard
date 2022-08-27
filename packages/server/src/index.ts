import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import Luno, { CurrencyPair, Timeframe } from 'classes/Luno';
import events from 'events';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3001;
const clients: {
  id: number;
  response: Response
}[] = [];
const event_lord = new events.EventEmitter();

const luno = Luno({
  api_key_id: process.env.LUNO_API_KEY_ID ?? '',
  api_key_secret: process.env.LUNO_API_KEY_SECRET?? '',
  pairs: [
    {
      id: CurrencyPair.XBTMYR,
      candles: [Timeframe.OneMin], 
    }
  ],
  event_lord
});

luno.then((l) => l.stream());

event_lord.on('message', (data) => {

  console.log('onmessage ', clients.length) 
  for(const client of clients){
    client.response.write(`data: ${JSON.stringify(data)}\n\n`)
  }
})

app.get('/', (req: Request, res: Response) => {
  res.send('Express + TypeScript Server 1');
});

app.get('/events', (eq: Request, res: Response) => {
  const headers = {
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache'
  };
  res.writeHead(200, headers);

  const data = `data: ${JSON.stringify({ready: true})}\n\n`;

  res.write(data);

  const clientId = Date.now();

  const newClient = {
    id: clientId,
    response: res
  };

  clients.push(newClient);
});

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at https://localhost:${port}`);
});