const keys = require('./keys');
const { promisify } = require('util');

// express app setup
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// pg client setup
const { Pool } = require('pg');
const pgClient = new Pool({
  user: keys.pgUser,
  host: keys.pgHost,
  database: keys.pgDatabase,
  password: keys.pgPassword,
  port: keys.pgPort,
});

pgClient.on('error', () => {
  console.log('lost pg connection');
});

pgClient.query('CREATE TABLE IF NOT EXISTS values (number INT)')
  .catch((err) => console.log(err));

const redis = require('redis');
const redisClient = redis.createClient({
  host: keys.redisHost,
  port: keys.redisPort,
  retry_strategy: () => 1000,
});
const hgetallAsync = promisify(redisClient.hgetall).bind(redisClient);
const hsetAsync = promisify(redisClient.hset).bind(redisClient);
const redisPublisher = redisClient.duplicate();
const publishAsync = promisify(redisPublisher.publish).bind(redisPublisher);

// express route handlers
app.get('/', (req, res) => {
  res.json({ status: 'OK' });
});

app.get('/values/all', async (req, res) => {
  const values = await pgClient.query('SELECT * FROM values');
  res.json({ status: 'OK', values: values.rows });
});

app.get('/values/current', async (req, res) => {
  const values = await hgetallAsync('values');
  res.json({ status: 'OK', values });
});

app.post('/values', async (req, res) => {
  const { index } = req.body;
  if (parseInt(index, 10) > 40) {
    return res.status(422).json({ status: 'error', error: 'index too high' });
  }

  await Promise.all([
    hsetAsync('values', index, 'nothing yet'),
    publishAsync('insert', index),
    pgClient.query('INSERT INTO values(number) VALUES ($1)', [index])
  ]);

  res.json({ status: 'OK', working: true });
});

app.listen(process.env.PORT || 5000, () => {
  console.log('listening');
});
