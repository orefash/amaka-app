// server.js
// where your node app starts

// init project
const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const app = express();
const fs = require("fs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({ secret: "fash" }));

// we've started you off with Express,
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

// http://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));

var helper = require("./data-helper.js");

app.set("view engine", "ejs");

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
//             db.run(
//             "DELETE from  nurses"
//           );
//        db.run(
//             "DELETE from  std_complaints"
//           );

//        db.run(
//             "DELETE from  students"
//           );


//             db.run(
//             "DROP table nurses"
//           );

      //     db.run(
      //       "DROP table std_complaints"
      //     );

      //     db.run(
      //       "DROP table students"
      //     );

      db.run(
        "CREATE TABLE IF NOT EXISTS  nurses (" +
          "nurse_id INTEGER PRIMARY KEY AUTOINCREMENT," +
          "nfname varchar(30) NOT NULL," +
          "nlname varchar(30) NOT NULL," +
          "level varchar(30) NOT NULL," +
          "uname varchar(30) NOT NULL," +
          "upass varchar(30) NOT NULL" +
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
          "house varchar(30) DEFAULT NULL," +
          "allergy text DEFAULT NULL," +
          "prior_health text DEFAULT NULL," +
          "prior_med text DEFAULT NULL," +
          "weight decimal(10,2) DEFAULT NULL," +
          "height decimal(10,2)," +
          "date date ," +
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

    console.log("Databases ready to go!");
    // db.each("SELECT * from nurses", (err, row) => {
    //   if (row) {
    //     console.log(`record: ${row.fname}`);
    //   }
    // });
  }
});

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", (request, response) => {
  var sess = request.session;

  if (sess.uname) {
    response.redirect("/view-students");
  } else {
    response.redirect("/login");
  }
});

app.get("/login", (request, response) => {
  response.render("login");
});

app.get("/register", (request, response) => {
  response.render("register");
});

app.post("/new-nurse", (request, response) => {
  var params = request.body;

  console.log(params);
  if (params.pass == params.rpass) {
    add_nurse(params, function(status) {
      if (status == 0) {
        return response.redirect("/login");
      } else {
        return response.render("register");
      }
    });
  } else {
    return response.render("register");
  }
});

app.post("/sign-in", (request, response) => {
  var params = request.body;
  var sess = request.session;

  console.log(params);

  get_nurse(params.uname, params.upass, function(status) {
    
  console.log(status);
    
    if (status !== -1) {
      sess.fname = status.fname;
      sess.lname = status.lname;
      sess.nid = status.nurse_id;
      sess.uname = status.uname;
      return response.redirect("/view-students");
    } else {
      return response.redirect("/register");
    }
  });
});

app.get("/nurse-profile", (request, response) => {
  response.render("n-profile");
});

app.get("/add-student", (request, response) => {
  response.render("add-student");
});

app.post("/new-student", (request, response) => {
  var params = request.body;

  console.log(params);

  add_student(params, function(status) {
    if (status == 0) {
      return response.redirect("/view-student/?sid=" + params.s_id);
    } else {
      return response.render("add-student");
    }
  });
});

app.get("/view-student/", (request, response) => {
  var sid = request.query.sid;

  get_student(sid, function(data) {
    if (data == -1) {
      // response.redirect("/");
    } else {
      console.log(data);
      response.render("view-student", { student: data });
    }
  });
});

app.get("/view-students", (request, response) => {
  get_students(function(data) {
    if (data == -1) {
      // response.redirect("/");
    } else {
      console.log(data);
      response.render("search-students", { students: data });
    }
  });
});

app.post("/update-student", (request, response) => {
  var params = request.body;

  console.log("in update:", params);

  update_student(params, function(status) {
    // if (status == 0) {
    response.redirect("/view-student/" + params.s_id);
    // }
  });
});

app.get("/add-complaint/:fname/:lname/", (request, response) => {
  var sid = request.query.sid;
  var fname = request.params.fname;
  var lname = request.params.lname;

  response.render("add-complaint", { sid: sid, fname: fname, lname: lname });
});

app.post("/new-complaint", (request, response) => {
  var params = request.body;
  
  var sess = request.session;

  params.n_id = sess.nid;
  
  console.log(params);

  add_complaint(params, function(status) {
    console.log(status);
    if (status[0] == 0) {
      return response.redirect("/view-complaint/" + status[1]);
    } else {
      return response.render("add-student");
    }
  });
  
});

app.get("/view-complaint/:c_id", (request, response) => {
  var cid = request.params.c_id;

  get_complaint(cid, function(data) {
    if (data == -1) {
      // response.redirect("/");
    } else {
      console.log(data);

      response.render("view-complaint", { complaint: data });
    }
  });

  // response.render("view-complaint");
});

app.get("/view-s-complaints/", (request, response) => {
  var sid = request.query.sid;

  get_s_complaints(sid, function(data) {
    if (data == -1) {
      // response.redirect("/");
    } else {
      console.log(data);
      response.render("search-complaint", { complaints: data });
    }
  });

  // response.render("search-complaint");
});

app.get("/view-complaints", (request, response) => {
  get_complaints(function(data) {
    if (data == -1) {
      // response.redirect("/");
    } else {
      console.log(data);
      response.render("search-complaint", { complaints: data });
    }
  });

  // response.render("search-complaint");
});

app.post("/update-complaint", (request, response) => {
  var params = request.body;
  
  var sess = request.session;

  params.n_id = sess.nid;
  

  console.log("in update:", params);

  update_complaint(params, function(status) {
    // if (status == 0) {
    response.redirect("/view-complaint/" + params.cid);
    // }
  });
});

function get_students(data) {
  db.all("SELECT * from students", (err, rows) => {
    data(rows);
  });
}

function get_student(s_id, data) {
  db.all("SELECT * from students where s_id='" + s_id + "'", (err, rows) => {
    if (!err) {
      data(rows[0]);
      return;
    } else {
      console.log(err.message);
      data(-1);
      return;
    }
  });
}
function add_student(data, status) {
  var now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60 * 1000;
  const dateLocal = new Date(now.getTime() - offsetMs);
  var date = dateLocal
    .toISOString()
    .slice(0, 19)
    .replace(/-/g, "/")
    .replace("T", " ")
    .split(" ")[0];

  var query_vals = `("${data.s_id}", "${data.fname}", "${data.lname}", "${data.dob}", "${data.address}", "${data.house}", "${data.allergy}", "${data.gender}", "${data.bl_grp}", "${data.bl_typ}", "${data.class}", "${data.prior_health}", "${data.prior_med}", ${data.weight}, ${data.height}, "${date}")`;
  var query =
    "INSERT INTO students (s_id, fname, lname, dob, address, house, allergy, gender, bl_grp, bl_typ, class, prior_health, prior_med, weight, height, date) VALUES " +
    query_vals;

  db.serialize(() => {
    db.run(query, function(err) {
      if (err) {
        console.log(err.message);
        status(1);
        return;
      } else {
        console.log(`A row has been inserted with rowid ${this.lastID}`);
        status(0);
        return;
      }
      // get the last insert id
    });
  });
}

function update_student(data, status) {
  db.run(
    `UPDATE students SET class = ?, weight = ?, height = ?  WHERE s_id = ?`,
    [data.class, data.weight, data.height, data.s_id],
    function(err) {
      if (err) {
        console.error(err.message);
        // return -1;
        status(1);
      } else {
        console.log(`Row(s) updated: ${this.changes}`);
        // return 0;
        status(0);
      }
    }
  );
}

function add_nurse(data, status) {
  var query_vals = `("${data.fname}", "${data.lname}", "${data.level}", "${data.uname}", "${data.upass}")`;
  var query =
    "INSERT INTO nurses ( fname, lname, level, uname, upass) VALUES " +
    query_vals;
  db.serialize(() => {
    db.run(query, function(err) {
      if (err) {
        console.log(err.message);
        status(1);
      } else {
        console.log("insert: ",data);
        console.log(`A row has been inserted with rowid ${this.lastID}`);
        status(0);
      }
      // get the last insert id
    });
  });
}

function get_nurse(un, pass, data) {
  db.all(
    "SELECT * from nurses",
    // "SELECT * from nurses where uname = '" + un + "' AND upass = '" + pass + "'",
    (err, rows) => {
      console.log(rows);
      if (err) {
        console.log(err.message);
        data(-1);
      } else {
        if(rows.length>0){          
        data(rows[0]);
        }else{
          
        data(-1);
        }
      }
    }
  );
}

function add_complaint(data, status) {
  var now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60 * 1000;
  const dateLocal = new Date(now.getTime() - offsetMs);
  var date = dateLocal
    .toISOString()
    .slice(0, 19)
    .replace(/-/g, "/")
    .replace("T", " ")
    .split(" ")[0];

  // var query_vals = `("${data.s_id}", "${data.complaint}", "${data.treatment}", "${data.feedback}", 1, "${date}")`;
  var query_vals = `("${data.s_id}", "${data.complaint}", "${data.treatment}", "${data.feedback}", ${data.n_id}, "${date}")`;
  var query =
    "INSERT INTO std_complaints (s_id, complaint, treatment, feedback, nurse_id, date) VALUES " +
    query_vals;
  db.serialize(() => {
    db.run(query, function(err) {
      if (err) {
        console.log(err.message);
        status([1]);
      } else {
        console.log(`A row has been inserted with rowid ${this.lastID}`);
        status([0, this.lastID]);
      }
      // get the last insert id
    });
  });
}

function get_complaints(data) {
  db.all(
    "SELECT * from std_complaints JOIN students on students.s_id = std_complaints.s_id JOIN nurses on nurses.nurse_id = std_complaints.nurse_id",
    (err, rows) => {
      data(rows);
    }
  );
}

function get_s_complaints(sid, data) {
  db.all(
    "SELECT * from std_complaints JOIN students on students.s_id = std_complaints.s_id JOIN nurses on nurses.nurse_id = std_complaints.nurse_id where std_complaints.s_id='" +
      sid +
      "'",
    (err, rows) => {
      data(rows);
    }
  );
}

function get_complaint(c_id, data) {
  db.all(
    "SELECT * from std_complaints JOIN students on students.s_id = std_complaints.s_id JOIN nurses on nurses.nurse_id = std_complaints.nurse_id where std_complaints.c_id = " +
      c_id,
    (err, rows) => {
      data(rows[0]);
    }
  );
}

function update_complaint(data, status) {
  var now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60 * 1000;
  const dateLocal = new Date(now.getTime() - offsetMs);
  var date = dateLocal
    .toISOString()
    .slice(0, 19)
    .replace(/-/g, "/")
    .replace("T", " ")
    .split(" ")[0];

  db.run(
    `UPDATE std_complaints SET treatment = ?, feedback = ?, nurse_id = ?, date = ?  WHERE c_id = ?`,
    [data.treatment, data.feedback, data.n_id, date, data.cid],
    // [data.treatment, data.feedback, 1, date, data.cid],
    function(err) {
      if (err) {
        console.error(err.message);
        status(1);
      } else {
        console.log(`Row(s) updated: ${this.changes}`);
        status(0);
      }
    }
  );
}

// listen for requests :)
var listener = app.listen(process.env.PORT, () => {
  console.log(`Your app is listening on port ${listener.address().port}`);
});
