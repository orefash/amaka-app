// init sqlite db

const fs = require("fs");
const dbFile = ".data/sqlite.db";
const exists = fs.existsSync(dbFile);
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database(dbFile);

// if ./.data/sqlite.db does not exist, create it, otherwise print records to console
db.serialize(() => {
  if (!exists) {
  } else {
    // db.run("Drop Table order_items");
    // db.run("Drop Table userorders");
    // db.run("Drop Table ctokens");

    db.run(
      "CREATE TABLE IF NOT EXISTS userorders (" +
        "order_id varchar(30) NOT NULL," +
        "pay_ref varchar(30)," +
        "fname varchar(30) NOT NULL," +
        "lname varchar(30) NOT NULL," +
        "email varchar(50) DEFAULT NULL," +
        "phone varchar(15) DEFAULT NULL," +
        "address text," +
        "delivery_district varchar(30) DEFAULT NULL," +
        "total_price decimal(10,2) DEFAULT NULL," +
        "takeaway decimal(10,2) DEFAULT NULL," +
        "status varchar(30) DEFAULT NULL," +
        "time_slot varchar(30) DEFAULT NULL," +
        "chat_id varchar(30) DEFAULT NULL," +
        "order_info text," +
        "date date NOT NULL," +
        "PRIMARY KEY (order_id)" +
        ")"
    );
    console.log("New table User ORders created!");

    db.run(
      "CREATE TABLE IF NOT exists order_items (" +
        "oitem_id INTEGER PRIMARY KEY AUTOINCREMENT," +
        "order_id varchar(30) NOT NULL," +
        "item_id int(11) NOT NULL," +
        "title varchar(30) NOT NULL," +
        "price decimal(10,2) NOT NULL," +
        "takeaway decimal(10,2) NOT NULL," +
        "img_url varchar(50) NOT NULL," +
        "meal_opt_lbl varchar(20) DEFAULT NULL," +
        "meal_opt varchar(20) DEFAULT NULL," +
        "side_option varchar(20) DEFAULT NULL," +
        "sauce_option varchar(20) DEFAULT NULL," +
        "quantity int(11) DEFAULT NULL," +
        "FOREIGN KEY (order_id) REFERENCES userorders (order_id)" +
        ")"
    );

    db.run(
      "CREATE TABLE IF NOT exists ctokens (" +
        "tid INTEGER PRIMARY KEY AUTOINCREMENT," +
        "order_id varchar(30) NOT NULL," +
        "cid varchar(30)  NOT NULL," +
        "amount decimal(10,2) NOT NULL," +
        "FOREIGN KEY (order_id) REFERENCES userorders (order_id)" +
        ")"
    );

    db.run(
      "CREATE TABLE IF NOT exists push_notifications (" +
        "nid INTEGER PRIMARY KEY AUTOINCREMENT," +
        "msg text," +
        "date date  NOT NULL" +
        ")"
    );
    // db.serialize(() => {
    //   db.run(
    //     'INSERT INTO userorders (order_id, fname, lname, date) VALUES ("O1", "John", "C Reilly", "2020/01/09")'
    //   );
    // });
    console.log('Database "User Orders" ready to go!');
    db.each("SELECT * from userorders", (err, row) => {
      if (row) {
        console.log(`record: ${row.order_id}`);
      } else {
        console.log("error: " + err);
      }
    });
  }
});

module.exports = {
  db: db
}