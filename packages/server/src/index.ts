import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import Luno, { CurrencyPair, Timeframe } from 'classes/Luno';
import events from 'events';
import axios from 'axios';

dotenv.config();
const remote = axios.create({
  baseURL: 'https://api.luno.com',
  auth:  {
    username: process.env.LUNO_API_KEY_ID??'',
    password: process.env.LUNO_API_KEY_SECRET??''
  }
});

function writeMessage (res: Response, data: string, id?: number, eventType?: string) {
  eventType && res.write(`event: ${eventType}\n`);
  id && res.write(`id: ${id}\n`);
  res.write(`data: ${data}\n\n`);
}

const app: Express = express();
const port = process.env.PORT || 3001;
let clients: {
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

// luno.then((l) => l.stream());

event_lord.on(`${CurrencyPair.XBTMYR}:ordersbook`, (data) => {
  for(const client of clients){
    client.response.write(`data: ${JSON.stringify(data)}\n\n`)
  }
})

app.get('/', (req: Request, res: Response) => {
  res.send('Express + TypeScript Server 1');
});

app.get('/events', (req: Request, res: Response) => {
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

  req.on('close', () => {
    console.log(`${clientId} Connection closed`);
    clients = clients.filter(client => client.id !== clientId);
  });
});

app.all('/luno/*', async function(req, res) {
  const path =  req.url = '/' + req.url.split('/').slice(2).join('/');

  const response = await remote.get(
    path, {
      params: {
        pair: CurrencyPair.XBTMYR,
        duration: Timeframe.OneMin,
        since: new Date('2022-01-01').getTime()
      }
    }
  ).then(response => response.data)
   .catch(err => console.log(err));
  
  res.json(response)
})

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at https://localhost:${port}`);
});