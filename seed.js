const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const connectDB = require('./config/db');
const Admin = require('./models/Admin');

const seedAdmin = async () => {
  await connectDB();

  const existingAdmin = await Admin.findOne({ email: 'akshansh9616972677@gmail.com' });
  if (existingAdmin) {
    console.log('Admin already exists');
    return process.exit(0);
  }

  const hashedPassword = await bcrypt.hash('Ritik2002@', 10);

  const admin = new Admin({
    name: 'Ritik Sharma',
    email: 'gyanibabastore.com@gmail.com',
    password: hashedPassword
  });

  await admin.save();
  console.log('Admin user seeded successfully');
  process.exit(0);
};

seedAdmin().catch((err) => {
  console.error('Seeding error:', err);
  process.exit(1);
});
