const mongoose = require('mongoose');

const connectDB = async (connectionString) => {
  try {
    await mongoose.connect(connectionString);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('Could not connect to MongoDB', err);
    process.exit(1);
  }
};

module.exports = connectDB;
