import { Hono } from "hono";
import { ofetch } from 'ofetch';
const app = new Hono();

const httpClient = ofetch.create({
  baseURL: 'https://api.divar.ir',
  retryDelay: 30000,
  retry: 5,
  retryStatusCodes: [429],
  responseType: 'json',
  headers: {
    'Content-Type': 'application/json',
  },
})


// app.get("/api/", (c) => c.json({ name: "Cloudflare" }));


app.get('/divar/*', async (c) => {
  const url = c.req.path.replace(/^\/divar/g, '');
  const payload = c.req.query('payload') ?? '{}';
  return c.json(await httpClient(url, JSON.parse(atob(payload))));
})

export default app;