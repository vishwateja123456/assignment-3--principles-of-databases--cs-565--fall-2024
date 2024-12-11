const express = require(`express`);
const app = express();
const nunjucks = require(`nunjucks`);
const bodyParser = require(`body-parser`);
const mongoDB = require(`mongodb-legacy`);
const mongoClient = mongoDB.MongoClient;

const HOST = `localhost`;
const dbPort = `27017`;
const dbURL = `mongodb://127.0.0.1:${dbPort}`; // Use IPv4 to avoid ::1 issues
const dbName = `project`;
const dbCollection = `users`;
const PORT = process.env.PORT || 3000;

const colors = {
    reset: `\x1b[0m`,
    red: `\x1b[31m`,
    green: `\x1b[32m`,
    yellow: `\x1b[33m`,
};

let db;

/*
 * Configure the “views” folder to work with Nunjucks
 */
nunjucks.configure(`views`, {
    express: app,
    autoescape: true
});

/*
 * MongoDB connection with retry logic
 */
const connectToMongoDB = (retries = 5, delay = 2000) => {
    mongoClient.connect(dbURL, (err, client) => {
        if (err) {
            console.error(colors.red, `Failed to connect to MongoDB:`, err.message, colors.reset);
            if (retries > 0) {
                console.log(colors.yellow, `Retrying in ${delay / 1000} seconds... (${retries} retries left)`, colors.reset);
                setTimeout(() => connectToMongoDB(retries - 1, delay), delay);
            } else {
                console.error(colors.red, `Unable to connect to MongoDB after multiple attempts.`, colors.reset);
                process.exit(1);
            }
        } else {
            db = client.db(dbName);
            console.log(colors.green, `MongoDB successfully connected:`, colors.reset);
            console.log(`\tMongo URL:`, dbURL);
            console.log(`\tMongo Database Name:`, dbName, `\n`);
        }
    });
};

connectToMongoDB();

/*
 * Configure Node to act as a web server
 */
app.listen(PORT, HOST, () => {
    console.log(colors.green, `Host successfully connected:`, colors.reset);
    console.log(`\tServer URL: http://localhost:${PORT}\n`);
});

/*
 * Express middleware
 */
app.set(`view engine`, `njk`);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(`public`));

/*
 * Routes
 */

// Root route
app.get(`/`, (req, res) => {
    console.log(colors.green, `Serving root page.`, colors.reset);
    res.render(`index.njk`);
});

// Read Records
app.get(`/read-a-db-record`, (req, res) => {
    const popupMessage = req.query.popupMessage || '';
    if (!db) return res.status(500).send(`Database not connected.`);
    db.collection(dbCollection).find().toArray((err, arrayObject) => {
        if (err) {
            console.error(colors.red, `Error fetching records:`, err, colors.reset);
            return res.status(500).send(`Error fetching records.`);
        }
        res.render(`read-from-database.njk`, { mongoDBArray: arrayObject, popupMessage });
    });
});

// Create Record
app.get(`/create-a-db-record`, (req, res) => {
    res.render(`create-a-record-in-database.njk`);
});

app.post(`/create-a-db-record`, (req, res) => {
    if (!db) return res.status(500).send(`Database not connected.`);
    db.collection(dbCollection).insertOne(req.body, (err) => {
        if (err) {
            console.error(colors.red, `Error creating record:`, err, colors.reset);
            return res.status(500).send(`Error creating record.`);
        }
        console.log(colors.green, `Record created successfully:`, req.body, colors.reset);
        res.redirect(`/read-a-db-record?popupMessage=Record successfully created!`);
    });
});

// Update Record
app.get(`/update-a-db-record`, (req, res) => {
    const popupMessage = req.query.popupMessage || '';
    if (!db) return res.status(500).send(`Database not connected.`);
    db.collection(dbCollection).find().toArray((err, arrayObject) => {
        if (err) {
            console.error(colors.red, `Error fetching records:`, err, colors.reset);
            return res.status(500).send(`Error fetching records.`);
        }
        res.render(`update-a-record-in-database.njk`, { mongoDBArray: arrayObject, popupMessage });
    });
});

app.post(`/update-a-db-record`, (req, res) => {
    if (!db) return res.status(500).send(`Database not connected.`);
    const { name, password } = req.body;
    db.collection(dbCollection).updateOne(
        { name },
        { $set: { password } },
        (err, result) => {
            if (err) {
                console.error(colors.red, `Error updating record:`, err, colors.reset);
                return res.status(500).send(`Error updating record.`);
            } else if (result.matchedCount === 0) {
                console.warn(colors.yellow, `No record found for name: ${name}`, colors.reset);
                return res.redirect(`/update-a-db-record?popupMessage=No record found for user "${name}".`);
            }
            console.log(colors.green, `Record updated for name: ${name}`, colors.reset);
            res.redirect(`/read-a-db-record?popupMessage=Record successfully updated!`);
        }
    );
});

// Delete Record
app.get(`/delete-a-db-record`, (req, res) => {
    const popupMessage = req.query.popupMessage || '';
    if (!db) return res.status(500).send(`Database not connected.`);
    db.collection(dbCollection).find().toArray((err, arrayObject) => {
        if (err) {
            console.error(colors.red, `Error fetching records:`, err, colors.reset);
            return res.status(500).send(`Error fetching records.`);
        }
        res.render(`delete-a-record-in-database.njk`, { mongoDBArray: arrayObject, popupMessage });
    });
});

app.post(`/delete-a-db-record`, (req, res) => {
    if (!db) return res.status(500).send(`Database not connected.`);
    const { name } = req.body;
    db.collection(dbCollection).deleteOne({ name }, (err, result) => {
        if (err) {
            console.error(colors.red, `Error deleting record:`, err, colors.reset);
            return res.status(500).send(`Error deleting record.`);
        } else if (result.deletedCount === 0) {
            console.warn(colors.yellow, `No record found for name: ${name}`, colors.reset);
            return res.redirect(`/delete-a-db-record?popupMessage=No record found for user "${name}".`);
        }
        console.log(colors.green, `Record deleted for name: ${name}`, colors.reset);
        res.redirect(`/read-a-db-record?popupMessage=Record successfully deleted!`);
    });
});
