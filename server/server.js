import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import 'dotenv/config';
import tasks from './routes/tasks.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/tasks', tasks);
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.name === 'ValidationError' ? 400 : 500).json({ message: err.message });
});

await mongoose.connect(process.env.MONGO_URI);
app.listen(process.env.PORT || 5000, () => console.log('API ready'));
