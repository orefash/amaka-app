// server.js
// where your node app starts

// init project
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const fs = require("fs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// we've started you off with Express,
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

// http://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));

// init sqlite db
const dbFile = "./.data/sqlite.db";
const exists = fs.existsSync(dbFile);
const sqlite3 = require("sqlite3").verbose();


const db = new sqlite3.Database(dbFile);

// if ./.data/sqlite.db does not exist, create it, otherwise print records to console
db.serialize(() => {
  if (!exists) {
    db.run(
      "CREATE TABLE Dreams (id INTEGER PRIMARY KEY AUTOINCREMENT, dream TEXT)"
    );
    console.log("New table Dreams created!");

    // insert default dreams
    db.serialize(() => {
      db.run(
        'INSERT INTO Dreams (dream) VALUES ("Find and count some sheep"), ("Climb a really tall mountain"), ("Wash the dishes")'
      );
    });
  } else {
    
    db.run(
      "CREATE TABLE IF NOT EXISTS nurses (" +
        "nurse_id INTEGER PRIMARY KEY AUTOINCREMENT," +
        "fname varchar(30) NOT NULL," +
        "lname varchar(30) NOT NULL," +
        "PRIMARY KEY (nurse_id)" +
        ")"
    );
    
    db.run(
      
      "CREATE TABLE IF NOT EXISTS students (" +
        "s_id varchar(30) NOT NULL," +
        "fname varchar(30) NOT NULL," +
        "lname varchar(30) NOT NULL," +
        "dob date," +
        "phone varchar(15) DEFAULT NULL," +
        "address text," +
        "gender varchar(10) DEFAULT NULL," +
        "bl_grp varchar(10) DEFAULT NULL," +
        "bl_typ varchar(10) DEFAULT NULL," +
        "class varchar(30) DEFAULT NULL," +
        "prior_health text DEFAULT NULL," +
        "prior_med text DEFAULT NULL," +
        "weight decimal(10,2) DEFAULT NULL," +
        "height decimal(10,2)," +
        "date date NOT NULL," +
        "PRIMARY KEY (s_id)" +
        ")"
      
    );
    
    
    db.run(
      
      "CREATE TABLE IF NOT EXISTS std_complaints (" +
        "c_id INTEGER PRIMARY KEY AUTOINCREMENT," +
        "s_id varchar(30) NOT NULL," +
        "complaint text," +
        "treatment text," +
        "feedback text," +
        "date date," +
        "phone varchar(15) DEFAULT NULL," +
        "address text," +
        "gender varchar(10) DEFAULT NULL," +
        "bl_grp varchar(10) DEFAULT NULL," +
        "bl_typ varchar(10) DEFAULT NULL," +
        "class varchar(30) DEFAULT NULL," +
        "prior_health text DEFAULT NULL," +
        "prior_med text DEFAULT NULL," +
        "weight decimal(10,2) DEFAULT NULL," +
        "height decimal(10,2)," +
        "date date NOT NULL," +
        "PRIMARY KEY (s_id)" +
        ")"
      
    );
    
    console.log('Database "Dreams" ready to go!');
    db.each("SELECT * from Dreams", (err, row) => {
      if (row) {
        console.log(`record: ${row.dream}`);
      }
    });
  }
});

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", (request, response) => {
  response.sendFile(`${__dirname}/views/index.html`);
});

app.get("/name", (request, response) => {
  response.send(JSON.stringify(1));
});

// endpoint to get all the dreams in the database
app.get("/getDreams", (request, response) => {
  db.all("SELECT * from Dreams", (err, rows) => {
    response.send(JSON.stringify(rows));
  });
});

// endpoint to add a dream to the database
app.post("/addDream", (request, response) => {
  console.log(`add to dreams ${request.body.dream}`);

  // DISALLOW_WRITE is an ENV variable that gets reset for new projects
  // so they can write to the database
  if (!process.env.DISALLOW_WRITE) {
    const cleansedDream = cleanseString(request.body.dream);
    db.run(`INSERT INTO Dreams (dream) VALUES (?)`, cleansedDream, error => {
      if (error) {
        response.send({ message: "error!" });
      } else {
        response.send({ message: "success" });
      }
    });
  }
});

// endpoint to clear dreams from the database
app.get("/clearDreams", (request, response) => {
  // DISALLOW_WRITE is an ENV variable that gets reset for new projects so you can write to the database
  if (!process.env.DISALLOW_WRITE) {
    db.each(
      "SELECT * from Dreams",
      (err, row) => {
        console.log("row", row);
        db.run(`DELETE FROM Dreams WHERE ID=?`, row.id, error => {
          if (row) {
            console.log(`deleted row ${row.id}`);
          }
        });
      },
      err => {
        if (err) {
          response.send({ message: "error!" });
        } else {
          response.send({ message: "success" });
        }
      }
    );
  }
});



// listen for requests :)
var listener = app.listen(process.env.PORT, () => {
  console.log(`Your app is listening on port ${listener.address().port}`);
});