import mongoose from "mongoose";

async function connect() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined in environment variables");
  }

  try {
    const connection = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10_000,
      connectTimeoutMS: 10_000,
      maxPoolSize: Math.min(Math.max(Number(process.env.MONGODB_MAX_POOL_SIZE) || 20, 5), 100),
      minPoolSize: Math.min(Math.max(Number(process.env.MONGODB_MIN_POOL_SIZE) || 2, 0), 20),
      maxIdleTimeMS: 60_000,
    });
    console.log(`MongoDB connected: ${connection.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exitCode = 1;
    throw error;
  }
}

export default connect;
