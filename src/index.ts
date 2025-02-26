import { Hono } from 'hono';
import { Redis } from '@upstash/redis/cloudflare';
import { cors } from 'hono/cors';

const app = new Hono();
app.use(cors());

const redis = new Redis({
  url: 'improved-ladybug-19708.upstash.io',
  token: 'AUz8AAIjcDE3NDExOGE4ZTMzMGI0NjAzODNlOGMxZDUxOTE1ZmE1ZHAxMA',
});

// Register contract endpoint
app.post('/register-contract', async (c) => {
  const { contractAddress, aliasName, description, receiverAddress, senderAddress, amount } = await c.req.json();

  const link = `/contract/${contractAddress}`;

  await redis.hset(contractAddress, {
    aliasName,
    description,
    receiverAddress,
    senderAddress,
    amount
  });

  return c.json({ link, contractAddress });
});

// Get contract details
app.get('/contract/:contractAddress', async (c) => {
  const contractAddress = c.req.param('contractAddress');
  const contract = await redis.hgetall(contractAddress);

  if (!contract) {
    return c.json({ error: 'Contract not found' }, 404);
  }

  return c.json(contract);
});

// Get user's contracts
app.get('/contracts/:userAddress', async (c) => {
  const userAddress = c.req.param('userAddress');
  const keys = await redis.keys('*');
  const contracts = [];

  for (const key of keys) {
    const contract = await redis.hgetall(key);
    // @ts-ignore
    if (contract.senderAddress?.toLowerCase() === userAddress.toLowerCase() ||
        // @ts-ignore
        contract.receiverAddress?.toLowerCase() === userAddress.toLowerCase()) {
      contracts.push({ contractAddress: key, ...contract });
    }
  }

  return c.json({ contracts });
});

// Remove contract
app.post('/remove-contract', async (c) => {
  const { contractAddress } = await c.req.json();
  await redis.del(contractAddress);
  return c.json({ success: true });
});

export default app;
