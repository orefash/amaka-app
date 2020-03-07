const fs = require("fs");
const dbFile = "./.data/sqlite.db";
const exists = fs.existsSync(dbFile);
const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database(dbFile);

module.exports = {
  sum: function(a, b) {
    return a + b;
  },
  get_students: function() {
    db.all("SELECT * from students", (err, rows) => {
      return rows;
    });
  },
  get_student: function(s_id) {
    db.all("SELECT * from students where s_id='" + s_id + "'", (err, rows) => {
      if (!err) {
        return rows[0];
      } else {
        console.log(err.message);
        return -1;
      }
    });
  },
  add_student: function(data) {
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
          return 1;
        } else {
          console.log(`A row has been inserted with rowid ${this.lastID}`);
          return 0;
        }
        // get the last insert id
      });
    });
  },
  update_student: function(data) {
    db.run(
      `UPDATE students SET class = ?, weight = ?, height = ?  WHERE s_id = ?`,
      [data.class, data.weight, data.height],
      function(err) {
        if (err) {
          console.error(err.message);
          return -1;
        } else {
          console.log(`Row(s) updated: ${this.changes}`);
          return 0;
        }
      }
    );
  },
  add_nurse: function(data) {
    var query_vals = `("${data.fname}", "${data.lname}", "${data.level}", "${data.uname}", "${data.upass}")`;
    var query =
      "INSERT INTO nurses ( fname, lname, level, uname, upass) VALUES " + query_vals;
    db.serialize(() => {
      db.run(query, function(err) {
        if (err) {
          console.log(err.message);
          return 1;
        } else {
          console.log(`A row has been inserted with rowid ${this.lastID}`);
          return 0;
        }
        // get the last insert id
      });
    });
  },
  add_complaint: function(data) {
    
    var now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60 * 1000;
  const dateLocal = new Date(now.getTime() - offsetMs);
  var date = dateLocal
    .toISOString()
    .slice(0, 19)
    .replace(/-/g, "/")
    .replace("T", " ")
    .split(" ")[0];
    
    var query_vals = `("${data.s_id}", "${data.complaint}", "${data.treatment}", "${data.feedback}", ${data.nurse_id}, "${date}")`;
    var query =
      "INSERT INTO std_complaints (s_id, complaint, treatment, feedback, nurse_id, date) VALUES " + query_vals;
    db.serialize(() => {
      db.run(query, function(err) {
        if (err) {
          console.log(err.message);
          return 1;
        } else {
          console.log(`A row has been inserted with rowid ${this.lastID}`);
          return 0;
        }
        // get the last insert id
      });
    });
  },
  get_complaints: function() {
    db.all("SELECT * from std_complaints", (err, rows) => {
      return rows;
    });
  },
  get_complaint: function(c_id) {
    db.all("SELECT * from std_complaints where c_id = "+c_id, (err, rows) => {
      return rows[0];
    });
  },
  update_complaint: function(data) {
    
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
      [data.treatment, data.feedback, data.nurse_id, date, data.c_id],
      function(err) {
        if (err) {
          console.error(err.message);
          return -1;
        } else {
          console.log(`Row(s) updated: ${this.changes}`);
          return 0;
        }
      }
    );
  }
};
