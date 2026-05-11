const { sequelize } = require('../config/database');
const User = require('../models/Users');
const bcrypt = require('bcrypt');

const createAdmin = async () => {
  await sequelize.sync();

  const existing = await User.findOne({ where: { email: 'admin@gmail.com' } });

  if (!existing) {
    const hashedPassword = await bcrypt.hash('admin123', 10);

    await User.create({
      username: 'Admin',
      email: 'admin@gmail.com',
      password: hashedPassword,
      role: 'admin'
    });

    console.log('Admin user created');
  } else {
    console.log('Admin already exists');
  }

  process.exit();
};

createAdmin();