const express = require(`express`);
const app = express();
const nunjucks = require(`nunjucks`);
const bodyParser = require(`body-parser`);
const mongoDB = require(`mongodb-legacy`);
const mongoClient = mongoDB.MongoClient;
const HOST = `localhost`;
const dbPort = `27017`;
const dbURL = `mongodb://${HOST}`;
const dbName = `project`;
const dbCollection = `users`;
const PORT = 3000;
const port = (process.env.PORT || PORT);
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
 * Configure the Node MongoDB client to connect to Mongo, established a database
 * connection and assigning the reference to the “db” variable defined on line
 * 21
 */
mongoClient.connect(`${dbURL}:${dbPort}`, (err, client) => {
    if (err) {
        return console.log(err);
    } else {
        db = client.db(dbName);

        console.log(`MongoDB successfully connected:`);
        console.log(`\tMongo URL:`, colors.green, dbURL, colors.reset);
        console.log(`\tMongo port:`, colors.green, dbPort, colors.reset);
        console.log(`\tMongo database name:`,
            colors.green, dbName, colors.reset, `\n`);
    }
});

/*
 * Configure Node to act as a web server
 */
app.listen(port, HOST, () => {
    console.log(`Host successfully connected:`);
    console.log(`\tServer URL:`, colors.green, `localhost`, colors.reset);
    console.log(`\tServer port:`, colors.green, port, colors.reset);
    console.log(`\tVisit http://localhost:${port}\n`);
});

/*
 * Express’s way of setting a variable. In this case, set the variable “view
 * engine” to “njk” for Nunjucks
 */
app.set(`view engine`, `njk`);

/*
 * Express’s middleware to parse incoming, form-based request data before
 * processing form data
 */
app.use(bodyParser.urlencoded({extended: true}));

/*
 * Express’s middleware to parse incoming request bodies before handlers
 */
app.use(bodyParser.json());

/*
 * Express’s middleware to serve HTML, CSS, and JavaScript files from the
 * included “public” folder. Note: There are no JavaScript files in the
 * “public” folder
 */
app.use(express.static(`public`));

/*
 * Note:
 *   — “req” stands for requests, which arrive from the client/browser
 *   — “res” stands for responses, which are sent to the client/browser
 */

/*
 * This router handles GET requests to the root of the web site
 */
app.get(`/`, (req, res) => {
    console.log(`User requested root of web site.`);
    console.log(`Responding to request with file`,
        colors.green, `index.njk`, colors.reset, `via GET.`);

    res.render(`index.njk`);
});
