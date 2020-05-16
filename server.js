// where your node app starts

// init project
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
var cors = require("cors");

var crypto = require("crypto");

const moment = require("moment");
const tz = require("moment-timezone");

var path = require("path");

var sha512 = require("js-sha512");
var request = require("request");

var httpBuildQuery = require("http-build-query");

var compression = require("compression");
var helmet = require("helmet");

const date = require("date-and-time");

const url = require("url");
const requestPromise = require("request-promise");
const chatfuelBroadcast = require("chatfuel-broadcast").default;

var mailer = require("./my-mailer.js");
var m_security = require("./security.js");

const { fetch_loc } = require("./fetch.js");

//Interswitch params

const mac = process.env.INTERSWITCH_KEY;

const prodid = process.env.PRODID;

const qurl = process.env.QUR;

const ps_key = process.env.PAYSTACK_KEY;
// const ps_key= process.env.CHOP_PAYSTACK_KEY;

//Pay params end

const fs = require("fs");

app.use(compression()); //Compress all routes
app.use(helmet());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.static("public"));

app.engine("html", require("ejs").renderFile);

const base_url = process.env.BASE_URLX;

// init sqlite db
const dbFile = "./.data/sqlite.db";
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

const frameguard = require("frameguard");

app.use(
  frameguard({
    action: "allow-from",
    domain: "https://www.messenger.com/"
  })
);
app.use(
  frameguard({
    action: "allow-from",
    domain: "https://www.facebook.com/"
  })
);

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", (request, response) => {
  response.sendFile(__dirname + "/views/confirm.html");
});

app.get("/push-notifications", (request, response) => {
  response.sendFile(__dirname + "/views/push.html");
});


function send_msgs(cid){
  
  var chat_bot_id = process.env.CB_ID;
  var chat_token = process.env.CB_TOKEN;
  var user_id = request.params.uid;

  var url_st =
    "https://api.chatfuel.com/bots/" +
    cid +
    "/users/" +
    user_id +
    "/send?chatfuel_token=" +
    chat_token +
    "&chatfuel_block_name=order_confirm";

  const options = {
    uri: url_st,
    headers: {
      "Content-Type": "application/json"
    }
  };

  requestPromise.post(options).then(() => {
  });
  
  
}


function get_uid(){
  var chat_bot_id = process.env.CB_ID;
  var chat_token = process.env.CB_TOKEN;
  
    db.all("SELECT DISTINCT chat_id FROM userorders where chat_id != 'undefined' ", (err, rows) => {
      console.log("in test - -  row");
      
      if (rows.length > 0) {
          rows.forEach(row => {
            let cid = row.chat_id;
            console.log(cid);
            // send_msgs(cid);
            
            
            
          });
                       
      }
      
      
    });
  }





// endpoint to get all the dreams in the database
app.get("/testingr", (request, response) => {
  get_uid();
  response.send(JSON.stringify("DOne"));
});

app.post("/n-broadcast", (request, response) => {
  var chat_bot_id = process.env.CB_ID;
  var chat_token = process.env.CB_TOKEN;
  var user_id = request.params.uid;

  var url_st =
    "https://api.chatfuel.com/bots/" +
    chat_bot_id +
    "/users/" +
    user_id +
    "/send?chatfuel_token=" +
    chat_token +
    "&chatfuel_block_name=order_confirm";

  const options = {
    uri: url_st,
    headers: {
      "Content-Type": "application/json"
    }
  };

  requestPromise.post(options).then(() => {
    response.json({});
  });
});




// endpoint to get all the dreams in the database
app.get("/mailing", (request, response) => {
  var params = {
    subject: "ChopNowNow Order Successful",
    cname: "Ore Faseru",
    cmail: "orefash@gmail.com",
    template: "customer"
  };
  mailer.send_mail(params, params.cmail);
  // console.log("Value: "+value);

  response.send(JSON.stringify("DOne"));
});

app.get("/receipt", (request, response) => {
  var oid = request.query.oid;
  // var oid = "20200118173554";
  
  console.log("Item rec");

  var district = "";

  var address = "";
  var cname = "";
  var phone = "";
  var email = "";
  var total = "";

  var elements = [];

  db.serialize(() => {
    db.each(
      "SELECT * from userorders where order_id='" + oid + "'",
      (err, row) => {
        console.log("row", row);
        address = row.address;
        cname = row.fname + " " + row.lname;
        phone = row.phone;
        email = row.email;
        total = row.total_price;
        district = row.delivery_district;
      }
    );

    db.all(
      "SELECT * from order_items where order_id='" + oid + "' AND quantity > 0",
      (err, rows) => {
        if (rows.length > 0) {
          rows.forEach(row => {
            var price = row.price;
            var img = row.img_url;
            var subtitle = "Quantity: " + row.quantity;
            var title = row.title;

            var object = {
              title: title,
              subtitle: subtitle,
              price: price,
              currency: "NGN",
              image_url: img
            };

            elements.push(object);
          });

          const timestamp = (new Date() / 1000) | 0;

          var message = {
            messages: [
              {
                attachment: {
                  type: "template",
                  payload: {
                    template_type: "receipt",
                    recipient_name: cname,
                    merchant_name: "Chopnownow",
                    order_number: oid,
                    currency: "NGN",
                    payment_method: "Online Payment",
                    order_url:
                      "https://rockets.chatfuel.com/store?order_id=12345678901",
                    timestamp: timestamp,

                    address: {
                      street_1: address,
                      street_2: "",
                      city: ", " + district,
                      postal_code: "0000",
                      state: "Lagos",
                      country: "Nigeria"
                    },
                    summary: {
                      total_cost: total
                    },
                    elements: elements
                  }
                }
              }
            ]
          };

          response.json(message);
        }
      }
    );
  });
});

app.post("/confirm", function(req, res) {
  console.log("In post");
  console.log(req.body); // req data
  var xtxn = req.body.txnref; // txnref posted from webpay redirect
  var amount = req.body.amount; // amount posted from webpay redirect
  var parameters = {
    productid: prodid,
    transactionreference: xtxn,
    amount: amount
  };

  console.log("PARAMS: ", parameters);

  var init_oid = req.query.oid;

  // parameter buider using http.build-query
  var params = httpBuildQuery(parameters);

  // computing hash value with product_id, transaction ref, mac key
  const hashv = prodid + xtxn + mac;
  var thash = sha512(hashv); // using js-sha512

  // http get request options
  const options = {
    Accept: "*/*",
    url: qurl + params,
    method: "GET",
    //  proxy: proxy,

    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.9.0.1) Gecko/2008070208 Firefox/3.0.1",
      "Accept-Language": "en-us,en;q=0.5",
      "Keep-Alive": "300",
      Connection: "keep-alive",
      Hash: thash
    }
  };

  request(options, function(err, result) {
    var rst = JSON.parse(result.body);
    var address = "";
    var cname = "";
    var phone = " ";
    var email = "";
    var uid = "";

    if (rst.ResponseCode !== "00") {
      console.log("unsuccessful");
      var new_oid = createOid();

      var query =
        "update userorders set pay_ref = " +
        new_oid +
        " where order_id=" +
        init_oid;

      db.serialize(() => {
        db.run(query, function(err) {
          if (err) {
            console.log("Update oid error: ", err);
          } else {
            var site_redirect_url =
              "https://amaka-server.glitch.me/confirm?oid=" + init_oid;

            // hash value computation
            var hashv =
              new_oid + prodid + "101" + amount + site_redirect_url + mac;
            var hash = sha512(hashv);

            db.all(
              "SELECT * from userorders where order_id='" + init_oid + "'",
              (err, rows) => {
                var row = rows[0];

                console.log("in redirect - -  row", row);

                var request_response = {
                  hash: hash,
                  url: site_redirect_url,
                  new_oid: new_oid,
                  address: row.address,
                  cname: row.fname + " " + row.lname,
                  phone: row.phone,
                  email: row.email,
                  uid: row.chat_id,

                  qurl: qurl,
                  prodid: prodid,

                  // response from transaction leg
                  r_amt: row.total_price * 100,
                  r_resp: req.body.resp,
                  r_txnref: req.body.txnref,
                  r_payRef: req.body.payRef,
                  r_desc: req.body.desc,

                  // respoanse from confrimation leg
                  c_amt: formatNaira(row.total_price),
                  c_transRef: rst.MerchantReference,
                  c_ref: rst.PaymentReference,
                  c_respCode: rst.ResponseCode,
                  c_respDsc: rst.ResponseDescription,
                  c_date: rst.TransactionDate
                };
                console.log("R_RESP: %j", request_response);

                // return payment status page; webpay status return before confrimation leg and return after confirmation leg
                res.render("redirect.html", request_response);
              }
            );
          }
        });
      });
    } else {
      console.log("successful");

      var request_response = {};

      db.all(
        "SELECT * from userorders where order_id='" + init_oid + "'",
        (err, rows) => {
          // console.log("in redirect - -  row", row);
          var row = rows[0];

          request_response = {
            address: row.address,
            cname: row.fname + " " + row.lname,
            phone: row.phone,
            email: row.email,
            uid: row.chat_id,
            slot: row.slot,
            district: row.delivery_district,
            disc: row.discount,
            itotal: row.itotal,
            delivery: row.delivery,
            tprice: row.total_price,
            pchoice: row.pay_choice,



            qurl: qurl,
            prodid: prodid,

            // response from transaction leg
            r_amt: req.body.amount / 100,
            r_resp: req.body.resp,
            r_txnref: req.body.txnref,
            r_payRef: req.body.payRef,
            r_desc: req.body.desc,

            // respoanse from confrimation leg
            c_amt: formatNaira(rst.Amount / 100),
            c_transRef: rst.MerchantReference,
            c_ref: rst.PaymentReference,
            c_respCode: rst.ResponseCode,
            c_respDsc: rst.ResponseDescription,
            c_date: rst.TransactionDate
          };

          sendConfirmMails(request_response, init_oid);

          res.render("redirect.html", request_response);
        }
      );
    }

    // res.send(rst);
  }).end();
});

app.get("/cgate-callback", function(req, res) {
  console.log("In cgate callback");
  console.log("query ", req.query);

  const rcode = req.query.ResponseCode;

  db.all(
    "SELECT * from ctokens where ctokens.cid='" + req.query.TransactionID + "'",
    (err, rows) => {
      console.log("in cgate redirect - -  row", rows);
      var row = rows[0];

      const oid = row.order_id;
      const amt = row.amount;

      if (rcode === "00") {
        let query = "SELECT * from userorders where order_id='" + oid + "'";

        console.log("Select q: ", query);

        db.all(query, (err, rows) => {
          console.log("in redirect - -  row", rows);
          var row = rows[0];

          let request_response = {
            address: row.address,
            cname: row.fname + " " + row.lname,
            phone: row.phone,
            email: row.email,
            uid: row.chat_id,
            slot: row.slot,
            amt: amt,
            oid: oid,
            district: row.delivery_district,
            disc: row.discount,
            itotal: row.itotal,
            delivery: row.delivery,
            tprice: row.total_price
          };

          sendConfirmMails(request_response, oid);

          res.render("cpay.html", request_response);
        });
      } else {
        let request_response = {
          amt: amt,
          oid: oid
        };

        res.render("cpayerr.html", request_response);
      }
    }
  );
});

function testFn(res, amt, oid) {
  // let un = "chopnownow";
  // let pass = "2009011220@012#8";
  // let mid = "1057CH020000002";
  // let tid = "1057CH02";
  // let uri = "https://testdev.coralpay.com/CgatePayV2/api/Pay";
  // let pk = "0030ceb3-484b-41b6-bd47-febc63e521d4";

  let un = "chopnownow";
  let pass = "2018040920@002#2";
  let mid = "405804301004851";
  let tid = "40580431";
  let uri = "https://cgateweb.coralpay.com/api/pay";
  let pk = "40fd5ed0-264c-4fee-b069-f19e9735f680";

  // let amt = "400";
  let rtUrl = "https://amaka-server.glitch.me/cgate-callback";
  let tt = "0";

  let signStr =
    un +
    "|" +
    pass +
    "|" +
    mid +
    "|" +
    tid +
    "|" +
    amt +
    "|" +
    rtUrl +
    "|" +
    tt;

  signStr += pk;

  var hash = crypto
    .createHash("md5")
    .update(signStr)
    .digest("hex");

  let pObj = {
    Username: un,
    Password: pass,
    MerchantID: mid,
    TerminalID: tid,
    Amount: amt,
    ReturnUrl: rtUrl,
    TransactionType: tt,
    signature: hash
  };

  console.log(pObj);
  const options = {
    uri: uri,
    json: true,
    body: pObj
  };

  requestPromise.post(options).then(function(data) {
    // console.log(data);
    var parsedResponse = data;

    console.log(parsedResponse);

    let status = data.Header.ResponseMessage;

    if (status === "Success") {
      var query_vals = `("${oid}", "${data.TransactionId}", "${amt}")`;
      var query =
        "INSERT INTO ctokens (order_id, cid , amount) VALUES " + query_vals;

      console.log("QUery: " + query);

      // db.serialize(() => {
      db.run(query, (err, res) => {
        if (err) {
          console.log("Token error: " + err);
        } else {
          console.log("Token result: " + res);
        }
      });
      // });

      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, OPTIONS, PUT, PATCH, DELETE"
      ); // If needed
      res.setHeader(
        "Access-Control-Allow-Headers",
        "X-Requested-With,contenttype"
      ); // If needed
      res.setHeader("Access-Control-Allow-Credentials", true); // If needed
      res.send(JSON.stringify(data.WebPayURI));

      // res.redirect(data.WebPayURI);
    }
  });
}

app.post("/cpay-fn", function(req, res) {
  var oid = req.body.oid;
  var amount = req.body.amt;
  amount = parseInt(amount) / 100;

  testFn(res, amount, oid);
});

app.post("/ps-mail", function(req, res) {
  console.log("In post");

  var oid = req.body.oid;
  var amount = req.body.amount;

  var request_response = {};

  db.all(
    "SELECT * from userorders where order_id='" + oid + "'",
    (err, rows) => {
      // console.log("in redirect - -  row", row);
      var row = rows[0];

      request_response = {
        address: row.address,
        cname: row.fname + " " + row.lname,
        phone: row.phone,
        email: row.email,
        uid: row.chat_id,
        slot: row.slot,
        district: row.delivery_district,
            disc: row.discount,
            itotal: row.itotal,
            delivery: row.delivery,
            tprice: row.total_price,
            pchoice: row.pay_choice,
        c_amt: formatNaira(amount / 100)
      };

      sendConfirmMails(request_response, oid);
    }
  );

  res.send(JSON.stringify("DOne"));
});

function setTransaction(init_oid) {
  console.log("Transaction setter");

  var query = "update userorders set tstatus = 1 where order_id=" + init_oid;

  db.serialize(() => {
    db.run(query, function(err) {
      if (err) {
        console.log("Error in tstatus set");
      } else {
        console.log("Tstatus success");
      }
    });
  });
}

function sendConfirmMails(request_response, init_oid) {
  console.log("In mail sender");
  setTransaction(init_oid);

  var elements = [];
  var total_p = 0;

  db.all(
    "SELECT * from order_items where order_id='" +
      init_oid +
      "' AND quantity > 0",
    (err, rows) => {
      console.log("Row ln: " + rows.length);
      if (rows.length > 0) {
        rows.forEach(row => {
          var price = row.price;
          var quantity = row.quantity;
          var t_price = price * quantity;

          row.t_price = t_price;

          total_p += t_price;
          row.price = formatNaira(price);
          elements.push(row);
        });
        total_p = formatNaira(total_p);
        // var dfee = formatNaira(districts[row.delivery_district]);

        const now = new Date();
        let cdate = date.format(
          date.addHours(now, 1),
          "ddd, MMM DD YYYY HH:mm:ss"
        );


        // district: row.delivery_district,
        // disc: row.discount,
        // itotal: row.itotal,
        // delivery: row.delivery,
        // tprice: row.total_price,

        var params = {
          subject: "Chopnownow Order Successful",
          template: "customer",
          items: elements,
          item_total: total_p,
          address: request_response.address,
          cname: request_response.cname,
          phone: request_response.phone,
          cmail: request_response.email,
          c_amt: request_response.c_amt,
          district: request_response.district,
          disc: request_response.disc,
          delivery: request_response.delivery,
          pchoice: request_response.pchoice,

          oid: init_oid,
          cdate: cdate,
          slot: request_response.slot
        };

        console.log("Mail Params: %j", params);

        mailer.send_mail(params, request_response.email);
        // mailer.send_mail(params, "orefash@gmail.com");

        params.template = "order";
        params.subject = "New Product Order - " + init_oid;
        // params.cmail = "kingfash5@gmail.com";
        // params.cmail = "chopnownoworders@gmail.com";

        mailer.send_mail(params, "kingfash5@gmail.com");

        // params.cmail = "chopnownoworders@gmail.com";
        // mailer.send_mail(params, "chopnownoworders@gmail.com");

        console.log("mails sent");
        
      } else {
      }
    }
  );
}

function loadTimeSlots(start, end) {
  var timeSlots = [];
  var time = start;
  do {
    var slot = "";
    var from = time.locale("en-CA").format("LT");
    var inc = moment(time).add(1, "H");
    var to = inc.locale("en-CA").format("LT");
    time = time.add(30, "m");
    slot = from + " - " + to;
    timeSlots.push(slot);
  } while (time.format("HH:mm") !== end.format("HH:mm"));

  return timeSlots;
}

function getTimeSlots() {
  var now = moment();
  var day = now.day();
  // console.log("Day: ",day);

  var startTime = moment("08:00", "HH:mm");
  var endTime = moment("20:30", "HH:mm");
  var nowTime = now;

  var timeSlots = [];

  // console.log(now.format("YYYY-MM-DD HH:mm:ss"));
  var status = "";
  nowTime.add(1, "H");
  if (!nowTime.isSameOrAfter(startTime)) {
    timeSlots = loadTimeSlots(startTime, endTime);
  } else if (
    nowTime.isSameOrAfter(startTime) &&
    !nowTime.isSameOrAfter(endTime)
  ) {
    // nowTime.add(1,'H');
    if (nowTime.minute() > 30) {
      nowTime.subtract(nowTime.minute() - 30, "m");
    } else if (nowTime.minute() < 30) {
      nowTime.subtract(nowTime.minute(), "m");
    }

    timeSlots = loadTimeSlots(nowTime, endTime);
  } else if (nowTime.isSameOrAfter(endTime)) {
    timeSlots = loadTimeSlots(startTime, endTime);
  }

  return timeSlots;
}

var districts = {
  "AWOLOWO ROAD IKOYI + N400": 400,
  "DOLPHINE ESTATE + N400": 400,
  "IKOYI + N400": 400,
  "LAGOS ISLAND + N500": 500,
  "LEKKI PHASE 1 + N500": 500,
  "MARINA + N700": 700,
  "OBALENDE + N450": 450,
  "ONIKAN + N400": 400,
  "ONIRU + N300": 300,
  "VICTORIA ISLAND": 0
};

app.post("/cc", (req, response) => {
  var coupon = req.body.coupon;
  var amount = req.body.amount;
  var oid = req.body.transaction_id;

  console.log("coupon: " + coupon + " amount: " + amount);


  var url_st = "https://chopxpress.com/sandbox/api/fb-bot/validate-coupon";

  
  request.post(url_st,
    {
      body:{
        coupon: coupon,
        transaction_id: oid,
        total_due: amount
      },
      json:true,
    }, function(err, res, body){
      if(err)
        response.json({error: err});
      else{
        console.log("in coupon fetch resp: ",body);


        let disc =  -1;
        if(body.code == '01'){
          console.log("Error resp");
        

        }else if(body.code == '00'){
          
          console.log("succ resp");

          disc = parseInt(amount) - parseInt(body.amount_due);
      
        }      
          
        let robj = { disc: disc};
          
        console.log("in coupon fetch: ",robj);

        
        response.json(robj);
      }

      
      
    }
  )




});

app.get("/cmm", (req, response) => {
  
  var url_st = "https://chopxpress.com/sandbox/api/fb-bot/validate-coupon";

  
  request.post(url_st,
    {
      body:{
        coupon: "CHOPRST",
        transaction_id: "huihi7",
        total_due: 4000
      },
      json:true,
    }, function(err, res, body){
      if(err)
        response.json({error: err});
      response.json({d:body});
    }
  )

});

app.get("/sf/:oid", (req, response) => {
  response.setHeader("Access-Control-Allow-Origin", "*");

  var oid = req.params.oid;

  let query = "SELECT * from userorders where order_id='" + oid + "'";
  let del = {};

  db.all(query, (err, rows) => {
    console.log("in redirect - -  row", rows);
    var row = rows[0];

    if (row.tstatus == 1) {
      let request_response = {
        address: row.address,
        cname: row.fname + " " + row.lname,
        phone: row.phone,
        email: row.email,
        uid: row.chat_id,
        slot: row.slot,
        amt: row.total_price,
        oid: oid
      };

      response.render("cpay.html", request_response);
    } else {
      var elements = [];
      var total_p = 0;

      db.all(
        "SELECT * from order_items where order_id='" +
          oid +
          "' AND quantity > 0",
        (err, rows) => {
          console.log("Row ln: " + rows.length);
          if (rows.length > 0) {
            rows.forEach(row => {
              var price = row.price;
              var quantity = row.quantity;
              var t_price = price * quantity;

              total_p += t_price;
              row.price = formatNaira(price);
              elements.push(row);
            });
            total_p = formatNaira(total_p);

            var timeslot = getTimeSlots();

            const options = {
              url:
                "https://chopxpress.com/sandbox/api/fb-bot/list-delivery-locations",
              method: "GET",
              headers: {
                Accept: "application/json",
                "Accept-Charset": "utf-8"
              }
            };

            request(options, (err, res, body) => {
              if (err) {
                del = districts;
              } else {
                var rp = JSON.parse(body).records;
                // console.log("District: ",rp);
                let ds = {};

                rp.forEach(function(value) {
                  ds[value.title] = value.charge;
                });

                del = ds;

                // console.log("dis del: ", del);

                for (var key in del) {
                  del[key] = key + ":" + del[key];
                }

                // console.log("describe del: ", del);

                response.render("of.html", {
                  items: elements,
                  total: total_p,
                  districts: del,
                  timeslots: timeslot,
                  orderid: oid
                });
              }
            });
          } else {
            response.json({
              messages: [
                {
                  text: "There are no items in your cart"
                }
              ],
              redirect_to_blocks: ["order-opt"]
            });
          }
        }
      );
    }
  });
});

app.post("/paym", (request, response) => {
  var oid = request.body.oid;
  // var oid = "20200118173554";

  console.log("From confirm: ", request.body);

  var slot = request.body.slot;
  var coupon = request.body.coupon;
  var district = request.body.district;
  var info = request.body.info;
  var payment = request.body.payment;
  var discount = request.body.discount;
  var itotal = request.body.itotal;

  console.log("District: "+ district);

  var dcharge = parseInt(district.split(":")[1]);
  district = district.split(":")[0];

  console.log(
    "District: " +
      district +
      " charge: " +
      dcharge +
      " discount: " +
      discount +
      " itotal: " +
      itotal
  );

  var address = "";
  var cname = "";
  var phone = "";
  var email = "";
  var pay_ref = "";
  var uid = "";

  var elements = [];
  var total_p = 0;

  db.serialize(() => {
    db.each(
      "SELECT * from userorders where order_id='" + oid + "'",
      (err, row) => {
        console.log("row", row);
        address = row.address;
        cname = row.fname + " " + row.lname;
        phone = row.phone;
        email = row.email;
        pay_ref = row.pay_ref;
        uid = row.chat_id;
      }
    );

    db.all(
      "SELECT * from order_items where order_id='" + oid + "' AND quantity > 0",
      (err, rows) => {
        console.log("Row ln: " + rows.length);
        if (rows.length > 0) {
          rows.forEach(row => {
            var price = row.price;
            var t_price = price * row.quantity;

            total_p += t_price;
            row.price = formatNaira(price);
            var item =
              formatNaira(price) +
              " * " +
              row.quantity +
              ": " +
              formatNaira(t_price);

            elements.push([row.title, item]);
          });
          // total_p+= districts[district];
          console.log("District: " + district);

          // var ctotal = total_p + districts[district];
          var ctotal =
            parseInt(itotal) + parseInt(dcharge) - parseInt(discount);
          
          console.log("paym CTotal: ",ctotal);

          var query =
            "update userorders set time_slot = '" +
            slot +
            "', itotal = " +
            itotal +
            ", discount = " +
            discount +
            ", delivery = " +
            dcharge +
            ", total_price = " +
            ctotal +
            ", delivery_district = '" +
            district +
            "', pay_choice = '" +
            payment +
            "', order_info = '" +
            info +
            "'  where order_id=" +
            oid;

          console.log("Udpdate query: ", query);

          // db.serialize(() => {
          db.run(query, function(err) {
            if (err) {
              console.log("Update userorder Error: ", err);
            }
          });

          var amtt = +(Math.round(ctotal + "e+2") + "e-2") * 100;

          console.log("AMTT: ", amtt);
          var amount = +(Math.round(amtt + "e+2") + "e-2");
          console.log("AMOUNT: ", amount);

          var site_redirect_url =
            "https://amaka-server.glitch.me/confirm?oid=" + oid;

          // hash value computation
          var hashv =
            pay_ref + prodid + "101" + amount + site_redirect_url + mac;
          var hash = sha512(hashv);

          ctotal = formatNaira(ctotal);
          total_p = formatNaira(total_p);

          var resp_data = {
            amt: amount,
            hash: hash,
            nm: cname,
            address: address,
            phone: phone,
            email: email,
            url: site_redirect_url,
            prodid: prodid,
            qurl: qurl,
            items: elements,
            total: itotal,
            district: district,
            delivery: formatNaira(dcharge),
            discount: discount,
            slot: slot,
            orderid: oid,
            ctotal: ctotal,
            pay_ref: pay_ref,
            ps_key: ps_key,
            ptype: payment,
            uid: uid
          };

          console.log("PAY DATA: ", resp_data);

          response.render("confirm.html", resp_data);
        }
      }
    );
  });

});

app.post("/broadcast-to-chatfuel/:uid", (request, response) => {
  var chat_bot_id = process.env.CB_ID;
  var chat_token = process.env.CB_TOKEN;
  var user_id = request.params.uid;

  var url_st =
    "https://api.chatfuel.com/bots/" +
    chat_bot_id +
    "/users/" +
    user_id +
    "/send?chatfuel_token=" +
    chat_token +
    "&chatfuel_block_name=order_confirm";

  const options = {
    uri: url_st,
    headers: {
      "Content-Type": "application/json"
    }
  };

  requestPromise.post(options).then(() => {
    response.json({});
  });
});

function checkTStatus(oid, res) {}

// app.get("/show-form/:oid", (request, response) => {
//   response.setHeader("Access-Control-Allow-Origin", "*");

//   var oid = request.params.oid;

//   let query = "SELECT * from userorders where order_id='" + oid + "'";

//   // console.log("Select q: ", query);

//   db.all(query, (err, rows) => {
//     console.log("in redirect - -  row", rows);
//     var row = rows[0];

//     if (row.tstatus == 1) {
//       let request_response = {
//         address: row.address,
//         cname: row.fname + " " + row.lname,
//         phone: row.phone,
//         email: row.email,
//         uid: row.chat_id,
//         slot: row.slot,
//         amt: row.total_price,
//         oid: oid
//       };

//       response.render("cpay.html", request_response);
//     } else {
//       var elements = [];
//       var total_p = 0;

//       db.all(
//         "SELECT * from order_items where order_id='" +
//           oid +
//           "' AND quantity > 0",
//         (err, rows) => {
//           console.log("Row ln: " + rows.length);
//           if (rows.length > 0) {
//             rows.forEach(row => {
//               var price = row.price;
//               var quantity = row.quantity;
//               var t_price = price * quantity;

//               total_p += t_price;
//               row.price = formatNaira(price);
//               elements.push(row);
//             });
//             total_p = formatNaira(total_p);

//             var timeslot = getTimeSlots();

//             response.render("order-form.html", {
//               items: elements,
//               total: total_p,
//               districts: districts,
//               timeslots: timeslot,
//               orderid: oid
//             });
//           } else {
//             response.json({
//               messages: [
//                 {
//                   text: "There are no items in your cart"
//                 }
//               ],
//               redirect_to_blocks: ["order-opt"]
//             });
//           }
//         }
//       );
//     }
//   });
// });

function formatNaira(num) {
  var p = num.toFixed(2).split(".");
  return (
    "N " +
    p[0]
      .split("")
      .reverse()
      .reduce(function(acc, num, i, orig) {
        return num == "-" ? acc : num + (i && !(i % 3) ? "," : "") + acc;
      }, "")
    // +
    // "." +
    // p[1]
  );
}

// app.post("/payment", (request, response) => {
//   var oid = request.body.oid;
//   // var oid = "20200118173554";

//   console.log("From confirm: ", request.body);

//   var slot = request.body.slot;
//   var coupon = request.body.coupon;
//   var district = request.body.district;
//   var info = request.body.info;
//   var payment = request.body.payment;

//   var address = "";
//   var cname = "";
//   var phone = "";
//   var email = "";
//   var pay_ref = "";
//   var uid = "";

//   var elements = [];
//   var total_p = 0;

//   db.serialize(() => {
//     db.each(
//       "SELECT * from userorders where order_id='" + oid + "'",
//       (err, row) => {
//         console.log("row", row);
//         address = row.address;
//         cname = row.fname + " " + row.lname;
//         phone = row.phone;
//         email = row.email;
//         pay_ref = row.pay_ref;
//         uid = row.chat_id;
//       }
//     );

//     db.all(
//       "SELECT * from order_items where order_id='" + oid + "' AND quantity > 0",
//       (err, rows) => {
//         console.log("Row ln: " + rows.length);
//         if (rows.length > 0) {
//           rows.forEach(row => {
//             var price = row.price;
//             var t_price = price * row.quantity;

//             total_p += t_price;
//             row.price = formatNaira(price);
//             var item =
//               formatNaira(price) +
//               " * " +
//               row.quantity +
//               ": " +
//               formatNaira(t_price);

//             elements.push([row.title, item]);
//           });
//           // total_p+= districts[district];
//           console.log("District: " + district);

//           var ctotal = total_p + districts[district];

//           var query =
//             "update userorders set time_slot = '" +
//             slot +
//             "', total_price = " +
//             ctotal +
//             ", delivery_district = '" +
//             district +
//             "', order_info = '" +
//             info +
//             "'  where order_id=" +
//             oid;

//           // db.serialize(() => {
//           db.run(query, function(err) {
//             if (err) {
//               console.log("Update userorder Error: ", err);
//             }
//           });

//           var amtt = +(Math.round(ctotal + "e+2") + "e-2") * 100;

//           console.log("AMTT: ", amtt);
//           var amount = +(Math.round(amtt + "e+2") + "e-2");
//           console.log("AMOUNT: ", amount);
//           // var user_nm = "User";
//           // var item_b = req.body.item;

//           // redirect url from webpay
//           var site_redirect_url =
//             "https://amaka-server.glitch.me/confirm?oid=" + oid;

//           // hash value computation
//           var hashv =
//             pay_ref + prodid + "101" + amount + site_redirect_url + mac;
//           var hash = sha512(hashv);

//           ctotal = formatNaira(ctotal);
//           total_p = formatNaira(total_p);

//           var resp_data = {
//             amt: amount,
//             hash: hash,
//             nm: cname,
//             address: address,
//             phone: phone,
//             email: email,
//             url: site_redirect_url,
//             prodid: prodid,
//             qurl: qurl,
//             items: elements,
//             total: total_p,
//             district: district.replace("+", ""),
//             slot: slot,
//             orderid: oid,
//             ctotal: ctotal,
//             pay_ref: pay_ref,
//             ps_key: ps_key,
//             ptype: payment,
//             uid: uid
//           };

//           // console.log("PAY DATA: ", resp_data);

//           response.render("confirm.html", resp_data);
//         }
//       }
//     );
//   });

//   // response.render("confirm.html");
// });

app.get("/get-order", (request, response) => {
  response.sendFile(__dirname + "/view/order-form.html");
});

app.get("/fetchl", (req, response) => {
  const options = {
    url: "https://chopxpress.com/sandbox/api/fb-bot/list-delivery-locations",
    method: "GET",
    headers: {
      Accept: "application/json",
      "Accept-Charset": "utf-8"
    }
  };

  request(options, (err, res, body) => {
    if (err) {
      return console.log(err);
    }

    var rp = JSON.parse(body).records;
    console.log(rp);
    var elements = {};

    rp.forEach(function(value) {
      elements[value.title] = value.charge;
    });

    response.json(elements);
  });
});

app.get("/menu_categories", (request, response) => {
  var oid = request.query.oid;

  const options = {
    uri: base_url + "list-menu-category",
    // uri: base_url + "&action=get_items&type=Product_Category&limit=80",
    headers: {
      "Content-Type": "application/json"
    }
  };

  requestPromise.post(options).then(function(data) {
    var parsedResponse = JSON.parse(data);
    console.log(parsedResponse);
    var elements = [];

    parsedResponse.forEach(function(value) {
      var title = value.title;
      var tid = value.itemid;

      var object = {
        title: title,
        subtitle: "Menu cateogry",
        buttons: [
          {
            type: "json_plugin_url",
            url:
              "https://amaka-server.glitch.me/getMenuItem?cat_id=" +
              tid +
              "&oid=" +
              oid,
            title: "Show"
          }
        ]
      };

      elements.push(object);
    });

    response.json({
      messages: [
        {
          attachment: {
            type: "template",
            payload: {
              template_type: "generic",
              elements: elements
            }
          }
        }
      ]
    });
  });
});

app.get("/menu_categorys", (request, response) => {
  var oid = request.query.oid;

  const options = {
    uri: "https://chopxpress.com/sandbox/api/fb-bot/list-menu-category",
    // uri: base_url + "&action=get_items&type=Product_Category&limit=80",
    headers: {
      // "Content-Type": "application/json"
    }
  };

  requestPromise.get(options).then(function(data) {
    console.log(data);

    var parsedResponse = JSON.parse(data).records;
    console.log(parsedResponse);
    var elements = [];
    var messages = [];

    var count = 1;

    parsedResponse.forEach(function(value) {
      var title = value.title;
      var tid = value.itemid;

      if (value.enable == "Yes") {
        var object = {
          title: title,
          subtitle: "Menu cateogry",
          buttons: [
            {
              type: "json_plugin_url",
              url:
                "https://amaka-server.glitch.me/getMenuItem?cat_id=" +
                tid +
                "&oid=" +
                oid,
              title: "Show"
            }
          ]
        };

        elements.push(object);

        if (count % 10 === 0) {
          console.log("counter: " + count);
          var message = {
            attachment: {
              type: "template",
              payload: {
                template_type: "generic",
                elements: elements
              }
            }
          };
          messages.push(message);
          elements = [];
        }
        if (count === parsedResponse.length) {
          if (count % 10 !== 0) {
            var message = {
              attachment: {
                type: "template",
                payload: {
                  template_type: "generic",
                  elements: elements
                }
              }
            };
            messages.push(message);
          }
        }
        console.log("Elements: " + elements);
        count++;
      }
    });

    response.json({
      messages: messages
    });
  });
});

// endpoint to get all the dreams in the database
app.get("/getMenuItem", (request, response) => {
  var category_id = request.query.cat_id;
  var order_id = request.query.oid;

  const options = {
    uri: "https://chopxpress.com/sandbox/api/fb-bot/list-menu-items",
    json: true,
    body: {
      branch: 1,
      limit: 30,
      category: parseInt(category_id)
    }
  };

  requestPromise.post(options).then(function(data) {
    // console.log(data);
    var parsedResponse = data.records;
    // var parsedResponse = JSON.parse(data);
    // console.log(parsedResponse);
    var elements = [];
    var messages = [];

    var count = 1;

    parsedResponse.forEach(function(value) {
      var title = value.title;
      var tid = value.itemid;
      var price = value.price;
      price = price.split("/")[0];
      var img_url = value.image_url;
      if (img_url.length == 0) {
        // console.log("No image: ",title);
        img_url =
          "https://cdn.glitch.com/11cdb0eb-be82-41ef-820d-46c73f500ac1%2Fthumbnails%2Flogo_fade.png?1587384063339";
      }
      var take = value.takeaway_charge;

      var url =
        "https://amaka-server.glitch.me/addItem?title=" +
        title +
        "&tid=" +
        tid +
        "&price=" +
        price +
        "&img_url=" +
        img_url +
        "&oid=" +
        order_id +
        "&take=" +
        take;
      url = encodeURI(url);

      var object = {
        title: title,
        subtitle: "N" + price,
        image_url: img_url,
        buttons: [
          {
            type: "json_plugin_url",
            url: url,
            title: "Add To Cart"
          }
        ]
      };

      elements.push(object);

      if (count % 10 === 0) {
        console.log("counter: " + count);
        var message = {
          attachment: {
            type: "template",
            payload: {
              template_type: "generic",
              elements: elements
            }
          }
        };
        messages.push(message);
        elements = [];
      }
      if (count === parsedResponse.length) {
        if (count % 10 !== 0) {
          var message = {
            attachment: {
              type: "template",
              payload: {
                template_type: "generic",
                elements: elements
              }
            }
          };
          messages.push(message);
        }
      }
      console.log("Elements: " + elements);
      count++;
    });

    response.json({
      messages: messages
    });
  });
});

function createOid() {
  var month,
    day,
    hr,
    min,
    sec,
    d = new Date();
  month = ("0" + (d.getUTCMonth() + 1)).slice(-2);
  day = ("0" + d.getUTCDate()).slice(-2);
  hr = ("0" + d.getUTCHours()).slice(-2);
  min = ("0" + d.getUTCMinutes()).slice(-2);
  sec = ("0" + d.getUTCSeconds()).slice(-2);
  var oid = d.getUTCFullYear() + month + day + hr + min + sec;
  return oid;
}

// endpoint to get all the dreams in the database
app.get("/setOrderId", (request, response) => {
  var fname = request.query.fname;
  var lname = request.query.lname;

  var email = request.query.email;

  var phone = request.query.phone;
  var user_id = request.query.uid;
  var address = request.query.address;

  var oid = createOid();

  var now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60 * 1000;
  const dateLocal = new Date(now.getTime() - offsetMs);
  var date = dateLocal
    .toISOString()
    .slice(0, 19)
    .replace(/-/g, "/")
    .replace("T", " ")
    .split(" ")[0];

  console.log(fname + " " + lname);
  var query_vals = `("${oid}", "${oid}", "${fname}", "${lname}", "${date}", "${email}", "${address}", "${phone}", "${user_id}")`;
  var query =
    "INSERT INTO userorders (order_id, pay_ref , fname, lname, date, email, address, phone, chat_id) VALUES " +
    query_vals;

  console.log("QUery: " + query);

  db.serialize(() => {
    db.run(query);
  });

  response.json({
    set_attributes: {
      order_id: oid
    },
    messages: [
      {
        text: ""
      }
    ]
  });

  // response.send(JSON.stringify("Order Id: "+oid+" Date: "+  date + "Name: "+fname+" "+lname));
});

// endpoint to get all the dreams in the database
app.get("/addItem", (request, response) => {
  var title = request.query.title;
  var tid = request.query.tid;
  var price = request.query.price;

  var img_url = request.query.img_url;
  var take = request.query.take;

  if (take == null || take == undefined || take.length == 0) {
    take = 0;
  }
  var oid = request.query.oid;

  var query_vals = `("${oid}", "${tid}", "${title}", ${price}, ${take}, "${img_url}", 0)`;
  var query =
    "INSERT INTO order_items (order_id, item_id, title, price, takeaway, img_url, quantity) VALUES " +
    query_vals;

  db.serialize(() => {
    db.run(query, function(err) {
      if (err) {
        response.json({
          messages: [
            {
              text: "The item could not be added, please try again"
            }
          ]
        });
      } else {
        // console.log("val  " + this.lastID);
        response.json({
          set_attributes: {
            selected_item: this.lastID
          },
          redirect_to_blocks: ["no_option"]
        });
      }
    });
  });
});

// endpoint to get all the dreams in the database
app.get("/setQuantity", (request, response) => {
  var quantity = request.query.quantity;
  var tid = request.query.tid;

  var query =
    "update order_items set quantity = " + quantity + " where oitem_id=" + tid;

  db.serialize(() => {
    db.run(query, function(err) {
      if (err) {
        response.json({
          messages: [
            {
              text: "The quantity couldn't be set, please try again"
            }
          ],
          redirect_to_blocks: ["no_option"]
        });
      } else {
        response.json({
          messages: [
            {
              text: "Item has been added to your cart"
            }
          ],
          redirect_to_blocks: ["order-opt"]
        });
      }
    });
  });
});

// endpoint to get all the dreams in the database
app.get("/clearOrder", (request, response) => {
  if (!process.env.DISALLOW_WRITE) {
    db.each(
      "SELECT * from order_items",
      (err, row) => {
        console.log("row", row);
        db.run(
          `DELETE FROM order_items WHERE oitem_id=?`,
          row.oitem_id,
          error => {
            if (row) {
              // // console.log(`deleted row ${row.id}`);
            }
          }
        );
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

// endpoint to get all the dreams in the database
app.get("/showCart", (request, response) => {
  // var oid = "0";
  var oid = request.query.oid;

  var elements = [];
  var messages = [];

  var count = 1;

  db.all(
    "SELECT * from order_items where order_id='" + oid + "' AND quantity > 0",
    (err, rows) => {
      // console.log("Row ln: " + rows.length);
      if (rows.length > 0) {
        var total_p = 0;

        rows.forEach(row => {
          // // // console.log("Row: " + row);
          var title = row.title;
          var tid = row.oitem_id;
          var price = row.price;
          var img_url = row.img_url;
          var quantity = row.quantity;
          var t_price = price * quantity;
          var subtitle = "N" + price + " x " + quantity + " = " + t_price;

          total_p += t_price;

          var object = {
            title: title,
            subtitle: subtitle,
            image_url: img_url,
            buttons: [
              {
                type: "json_plugin_url",
                url: "https://amaka-server.glitch.me/updateQuantity?tid=" + tid,
                title: "Update Quantity"
              },
              {
                type: "json_plugin_url",
                url: "https://amaka-server.glitch.me/deleteItem?tid=" + tid,
                title: "Remove"
              }
            ]
          };

          elements.push(object);

          if (count % 10 === 0) {
            console.log("counter: " + count);
            var message = {
              attachment: {
                type: "template",
                payload: {
                  template_type: "generic",
                  elements: elements
                }
              }
            };
            messages.push(message);
            elements = [];
          }
          if (count === rows.length) {
            // // console.log("At end: " + rows.length);
            if (count % 10 !== 0) {
              var message = {
                attachment: {
                  type: "template",
                  payload: {
                    template_type: "generic",
                    elements: elements
                  }
                }
              };
              messages.push(message);
            }
          }
          // console.log("Elements: " + elements);
          count++;
        });

        var action_obj = {
          attachment: {
            type: "template",
            payload: {
              template_type: "button",
              text: "Total Price: " + formatNaira(total_p),
              buttons: [
                {
                  type: "web_url",
                  url: "https://amaka-server.glitch.me/sf/" + oid,
                  title: "Checkout",
                  messenger_extensions: true,
                  webview_height_ratio: "tall"
                },
                {
                  type: "show_block",
                  block_names: ["menu"],
                  title: "Add Item"
                }
              ]
            }
          }
        };

        messages.push(action_obj);

        response.json({
          messages: messages
        });
      } else {
        response.json({
          messages: [
            {
              text: "No items in your cart"
            }
          ],
          redirect_to_blocks: ["order-opt"]
        });
      }
      // response.send(JSON.stringify(rows));
    }
  );
});

// endpoint to get all the dreams in the database
app.get("/deleteItem", (request, response) => {
  var item = request.query.tid;
  db.serialize(() => {
    db.run("Delete from order_items where oitem_id=" + item);
  });

  response.json({
    messages: [
      {
        text: "Item removed from cart"
      }
    ],
    redirect_to_blocks: ["cart"]
  });
});

// endpoint to get all the dreams in the database
app.get("/updateQuantity", (request, response) => {
  var item = request.query.tid;

  response.json({
    set_attributes: {
      selected_item: item
    },
    redirect_to_blocks: ["no_option"]
  });
});

app.get("/cgatey", function(req, res) {
  console.log("In test");

  const now = new Date();
  let cdate = date.format(date.addHours(now, 1), "ddd, MMM DD YYYY HH:mm:ss");
  console.log(cdate);

  //   db.all("SELECT * from userorders ", (err, rows) => {
  //     console.log("in test - -  row", rows);

  //     res.send(JSON.stringify(rows));
  //   });
});

// endpoint to get all the dreams in the database
app.get("/updateTable", (request, response) => {
  db.serialize(() => {
    // db.run("ALTER TABLE userorders ADD tstatus INTEGER");
    // db.run("ALTER TABLE userorders ADD itotal decimal(10,2)");
    // db.run("ALTER TABLE userorders ADD discount decimal(10,2)");
    // db.run("ALTER TABLE userorders ADD odetails text");
    // db.run("ALTER TABLE userorders ADD delivery decimal(10,2)");
    
    
    // db.run("ALTER TABLE userorders ADD pay_choice text");
    
  });

  response.send(JSON.stringify("DOne"));
});

app.get("/formatable", (request, response) => {
  db.serialize(() => {
    db.run("DELETE FROM  order_items");
    db.run("DELETE FROM  userorders");
  });

  response.send(JSON.stringify("DOne"));
});

// helper function that prevents html/css/script malice
const cleanseString = function(string) {
  return string.replace(/</g, "&lt;").replace(/>/g, "&gt;");
};


// listen for requests :)
var listener = app.listen(process.env.PORT, () => {
  console.log(`server listening on port ${listener.address().port}`);
});
