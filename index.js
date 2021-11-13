const express = require('express');
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;

require('dotenv').config();
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;

//middlewear
app.use(cors())
app.use(express.json())

// Test root
app.get('/', (req, res) => {
    res.send('Running ApartmentShark server side')
});

// Connect to mongo db

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.6reqm.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {

    try {

        await client.connect()
        const database = client.db('apartmentShark');
        const apartmentCollection = database.collection('apartments');
        const bookingsCollection = database.collection('bookingitems');
        const reviewCollection = database.collection('reviews');
        const usersCollection = database.collection('users');


        //GET API for ALL data

        app.get('/apartments', async (req, res) => {

            const cursor = apartmentCollection.find({});
            const apartments = await cursor.toArray();
            res.send(apartments);

        })


        //Add Reviews
        app.post('/reviews', async (req, res) => {
            const review = req.body;
            await reviewCollection.insertOne(review).then((result) => {
                res.send(result.insertedCount > 0);
            });
        });

        //Read revews and show

        app.get('/reviews', async (req, res) => {

            const cursor = reviewCollection.find({});
            const reviews = await cursor.toArray();
            res.send(reviews);

        })


        // //POST API

        app.post('/bookingitems', async (req, res) => {
            const newBooking = req.body;
            await bookingsCollection.insertOne(newBooking).then((result) => {
                res.send(result.insertedCount > 0);
            });
        });

        // // Show data for login user (Read)
        app.get('/myorders', (req, res) => {
            // console.log(req.query.email)
            bookingsCollection
                .find({ email: req.query.email })
                .toArray((err, documents) => {
                    res.send(documents);
                });
        });


        // //Delete API

        app.delete('/deleteBooking/:id', async (req, res) => {

            const id = req.params.id;

            const query = { _id: ObjectId(id) }

            const result = await bookingsCollection.deleteOne(query);

            res.json(result);

        });


        // // Admin dashboard, show all users (Read)
        app.get('/adminTasks', (req, res) => {
            bookingsCollection.find({}).toArray((err, documents) => {
                res.send(documents);
            });
        });

        // // Delete Task from Admin Dashboard
        app.delete('/deleteTask/:_id', (req, res) => {
            bookingsCollection
                .deleteOne({ _id: ObjectId(req.params._id) })
                .then((result) => {
                    res.send(result.deletedCount > 0);
                });
        });



        // //GET API for one service

        // app.get('/services/:id', async (req, res) => {

        //     const id = req.params.id;
        //     console.log('getting id', id);

        //     const query = { _id: ObjectId(id) }

        //     const service = await servicesCollection.findOne(query);

        //     res.json(service);

        // })

        // //POST API TO ADD A NEW Apartment
        app.post('/apartments', async (req, res) => {
            const newApartment = req.body;
            await apartmentCollection.insertOne(newApartment).then((result) => {
                res.send(result.insertedCount > 0);
            });
        });

        // GET User


        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        })


        // POST Users

        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.json(result);
        });

        // PUT Users

        app.put('/users', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        });


        // PUT Admin

        app.put('/users/admin', async (req, res) => {
            const user = req.body;

            const filter = { email: user.email }

            const updateDoc = { $set: { role: 'admin' } };

            const result = await usersCollection.updateOne(filter, updateDoc);

            res.json(result);

        })







    }

    finally {
        // await client.close()
    }

}

run().catch(console.dir);


app.listen(port, () => {
    console.log('Listening to port', port)
});