
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
    
  }
};