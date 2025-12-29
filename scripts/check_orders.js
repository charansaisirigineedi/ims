const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function check() {
    const client = new MongoClient(process.env.MONGODB_URI);
    try {
        await client.connect();
        const db = client.db();
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
