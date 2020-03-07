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

app.set('view engine', 'ejs');

// init sqlite db
const dbFile = "./.data/sqlite.db";
const exists = fs.existsSync(dbFile);
const sqlite3 = require("sqlite3").verbose();


const db = new sqlite3.Database(dbFile);

// if ./.data/sqlite.db does not exist, create it, otherwise print records to console
db.serialize(() => {
  if (!exists) {
//     db.run(
//       "CREATE TABLE Dreams (id INTEGER PRIMARY KEY AUTOINCREMENT, dream TEXT)"
//     );
//     console.log("New table Dreams created!");

//     // insert default dreams
//     db.serialize(() => {
//       db.run(
//         'INSERT INTO Dreams (dream) VALUES ("Find and count some sheep"), ("Climb a really tall mountain"), ("Wash the dishes")'
//       );
//     });
  } else {
    db.serialize(() => {
      
//       db.run(
//       "DELETE from  nurses"
//     );
      
//       db.run(
//       "DROP table nurses"
//     );
    
//     db.run(
//       "DROP table std_complaints"
//     );
    
//     db.run(
//       "DROP table students"
//     );
    
    db.run(
      "CREATE TABLE IF NOT EXISTS  nurses (" +
        "nurse_id INTEGER PRIMARY KEY AUTOINCREMENT," +
        "fname varchar(30) NOT NULL," +
        "lname varchar(30) NOT NULL," +
        "level varchar(30) NOT NULL,"+
        "uname varchar(30) NOT NULL,"+ 
        "upass varchar(30) NOT NULL"+ 
        ")"
    );
    
    db.run(
      
      "CREATE TABLE IF NOT EXISTS students (" +
        "s_id varchar(30) NOT NULL," +
        "fname varchar(30) NOT NULL," +
        "lname varchar(30) NOT NULL," +
        "dob date," +
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
        "nurse_id INTEGER NOT NULL," +
        "date date," +
        "FOREIGN KEY (s_id) REFERENCES students (s_id)" +
        "FOREIGN KEY (nurse_id) REFERENCES nurses (nurse_id)" +
        ")"
      
    );
      
      // db.run(
      //   'INSERT INTO nurses (fname, lname, level) VALUES ("JOhn", "Freecs", "1"), ("ken", "francis", "2")'
      // );
      
    });
    
    
    console.log('Databases ready to go!');
    // db.each("SELECT * from nurses", (err, row) => {
    //   if (row) {
    //     console.log(`record: ${row.fname}`);
    //   }
    // });
  }
});

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", (request, response) => {
  response.sendFile(`${__dirname}/views/index.html`);
});


app.get("/nurse-profile", (request, response) => {
  response.render('n-profile');
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
  // if (!process.env.DISALLOW_WRITE) {
  //   const cleansedDream = cleanseString(request.body.dream);
  //   db.run(`INSERT INTO Dreams (dream) VALUES (?)`, cleansedDream, error => {
  //     if (error) {
  //       response.send({ message: "error!" });
  //     } else {
  //       response.send({ message: "success" });
  //     }
  //   });
  // }
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