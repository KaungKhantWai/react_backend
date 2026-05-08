const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { sequelize, connectDB } = require('./config/database');
const Post = require('./models/Post');
const User = require('./models/Users');
const authRoutes = require('./routes/authRoute');
const postRoutes = require('./routes/postRoute');
const userRoutes = require('./routes/userRoute');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

User.hasMany(Post, { foreignKey: 'user_id', as: 'posts' });
Post.belongsTo(User, { foreignKey: 'user_id', as: 'authorDetail' });

app.use('/api/auth', authRoutes);
app.use('/api/users', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);

const startServer = async () => {
  await connectDB();
  await sequelize.sync({ alter: true });
  console.log('Database & tables synced');

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

startServer().catch((error) => {
  console.error('Server startup error:', error);
  process.exit(1);
});
