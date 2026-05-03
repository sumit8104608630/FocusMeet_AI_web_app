import {Client} from 'pg';
import  dotenv from 'dotenv';
dotenv.config();
const client=new Client({
    host:process.env.PG_HOST,
    port:process.env.PG_PORT,
    user:process.env.PG_USER,
    password:process.env.PG_PASSWORD,
    database:process.env.PG_DATABASE,
})
client.connect().then(()=>console.log('Connected postgress to database')).catch((err)=>console.log(err));
export default client;
