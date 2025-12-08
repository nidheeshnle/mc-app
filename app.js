const express = require('express');
const morgan = require('morgan');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;

// From env, default for local dev
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/tasksdb';

app.use(morgan('dev'));
app.use(express.json());

let tasksCollection;

// connect to MongoDB then start server
async function start() {
  try {
    const client = new MongoClient(MONGO_URL);
    await client.connect();
    console.log('Connected to MongoDB ✅');

    const db = client.db(); // tasksdb from connection string
    tasksCollection = db.collection('tasks');

    app.listen(PORT, () => {
      console.log(`API listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Mongo connection error:', err);
    process.exit(1);
  }
}

// health check
app.get('/', (req, res) => {
  res.send('Task API with MongoDB is running 🚀');
});

// GET /tasks - list all
app.get('/tasks', async (req, res) => {
  const tasks = await tasksCollection.find().toArray();
  res.json(tasks);
});

// POST /tasks - create one
app.post('/tasks', async (req, res) => {
  const { title, description } = req.body;

  if (!title || title.trim() === '') {
    return res.status(400).json({ error: 'Title is required' });
  }

  const newTask = {
    title,
    description: description || '',
    completed: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const result = await tasksCollection.insertOne(newTask);
  newTask._id = result.insertedId;
  res.status(201).json(newTask);
});

start();
