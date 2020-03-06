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
    db.all("SELECT * from students where sid='" + s_id + "'", (err, rows) => {
      if (!err) {
        return rows[0];
      } else {
        console.log(err.message);
        return -1;
      }
    });
  },
  add_student: function(data) {
    var query_vals = `("${data.s_id}", "${data.fname}", "${data.lname}", "${data.dob}", "${data.dob}", "${data.address}", "${data.gender}", "${data.bl_grp}", "${data.bl_typ}", "${data.class}", "${data.prior_health}", "${data.prior_med}", ${data.weight}, ${data.height}, "${data.date}")`;
    var query =
      "INSERT INTO students (s_id, fname, lname, dob, address, gender, bl_grp, bl_typ, class, prior_health, prior_med, weight, height, date) VALUES " +
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
    var query_vals = `("${data.nurse_id}", "${data.fname}", "${data.lname}", "${data.level}")`;
    var query =
      "INSERT INTO nurses (nurse_id, fname, lname, level) VALUES " + query_vals;
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
  }
};
