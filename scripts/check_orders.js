const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME;

if (!MONGODB_URI) {
    console.error('Please define the MONGODB_URI environment variable inside .env.local');
    process.exit(1);
}

if (!DB_NAME) {
    console.error('Please define the DB_NAME environment variable inside .env.local');
    process.exit(1);
}

async function check() {
    const client = new MongoClient(MONGODB_URI);
    try {
        await client.connect();
        console.log(`Connected to MongoDB`);
        console.log(`Using database: ${DB_NAME}`);
        const db = client.db(DB_NAME);
        const lastOrders = await db.collection('orders').find().sort({ createdAt: -1 }).limit(5).toArray();
        console.log('Last 5 Orders:', JSON.stringify(lastOrders, null, 2));

        for (const order of lastOrders) {
            const user = await db.collection('users').findOne({ _id: order.user_id });
            console.log(`Order ${order._id} initiated by user_id: ${order.user_id}, User Object Found:`, !!user);
            if (user) console.log(`User Name: ${user.name}`);
        }
    } finally {
        await client.close();
    }
}
check();
