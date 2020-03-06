
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
    
    
    
  },
  add_student: function(data) {
    
    var query_vals = `("${oid}", "${oid}", "${fname}", "${lname}", "${date}", "${email}", "${address}", "${phone}", "${user_id}")`;
  var query =
    "INSERT INTO students (s_id, fname, lname, dob, address, gender, bl_grp, bl_typ, class, prior_health, prior_med, weight) VALUES " +
    query_vals;
  db.serialize(() => {
    db.run(query);
  });

    
    
    
  }
};