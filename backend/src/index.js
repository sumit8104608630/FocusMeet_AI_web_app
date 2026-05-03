import server from './app.js';
import dotenv from 'dotenv';
import connectDB from '../databases_config/mongodb.config.js';

dotenv.config();

// Connect to MongoDB
connectDB();

server.listen(process.env.PORT || 9090, () => {
    console.log(`server is running on port ${process.env.PORT || 9090}`)
})


  