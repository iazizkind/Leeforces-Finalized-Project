const redis=require("redis")
const {createClient}=redis;

const redisClient = createClient({
    username: 'default',
    password: process.env.REDIS_DB,
    socket: {
        host: 'metal-appliance-reason-83260.db.redis.io',
        port: 13759
    }
});


module.exports=redisClient;
