// where your node app starts

// init project
const fs = require("fs");
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

const dotenv = require('dotenv');
dotenv.config();

var compression = require("compression");
var helmet = require("helmet");

const date = require("date-and-time");

const url = require("url");
const requestPromise = require("request-promise");
const chatfuelBroadcast = require("chatfuel-broadcast").default;

var mailer = require("./my-mailer.js");
var m_security = require("./security.js");

// const { fetch_loc } = require("./fetch.js");
const { db } = require("./dbhelper.js");
const { handleMsg } = require("./utils.js");

//Interswitch params

const mac = process.env.INTERSWITCH_KEY;

const prodid = process.env.PRODID;

const qurl = process.env.QURL;


// const mac = process.env.INTERSWITCH_KEY_DEMO;

// const prodid = process.env.PRODID_DEMO;

// const qurl = process.env.QURL_DEMO;

// const ps_key = process.env.PAYSTACK_KEY;
const ps_key = process.env.CHOP_PAYSTACK_KEY;

//Pay params end


app.use(compression()); //Compress all routes
app.use(helmet());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.static("public"));

app.engine("html", require("ejs").renderFile);

const base_url = process.env.BASE_URLX;

const chop_url = "https://chopnownow.com/api/fb-bot/";

const chat_bot_id = process.env.PCB_ID;
const chat_token = process.env.PCB_TOKEN;


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
app.get("/", (req, response) => {


  let bu = req.protocol+"://"+req.headers.host;


  response.json("request: "+bu+" chop: "+base_url);
});

app.get("/push-notifications", (request, response) => {
  response.sendFile(__dirname + "/views/push.html");
});

function send_msgs(cid) {
  // var chat_bot_id = process.env.PCB_ID;
  // var chat_token = process.env.PCB_TOKEN;
  var user_id = cid;
  
  
  // console.log("In sendmsg: ",cid);

  var url_st =
    "https://api.chatfuel.com/bots/" +
    chat_bot_id +
    "/users/" +
    user_id +
    "/send?chatfuel_token=" +
    chat_token +
    "&chatfuel_block_name=notify";

  const options = {
    uri: url_st,
    headers: {
      "Content-Type": "application/json"
    }
  };

  requestPromise.post(options).then((parsedBody) => {
    // console.log(parsedBody);
    
  })
    .catch(function (err) {
                // console.log("Post error: ",err);
            });
}

function get_uid() {
  // var chat_bot_id = process.env.CB_ID;
  // var chat_token = process.env.CB_TOKEN;

  db.all(
    "SELECT DISTINCT chat_id FROM userorders where chat_id != 'undefined' ",
    (err, rows) => {
      // console.log("in test cid - -  row");

      if (rows.length > 0) {
        const delay = amount => {
          return new Promise(resolve => {
            setTimeout(resolve, amount);
          });
        };

        let ln = rows.length;

        async function loop() {
          // console.log("In loop");
          for (let i = 0; i < ln; i++) {
            let row = rows[i];
            // console.log("In loop test");
             let cid = row.chat_id;
          // console.log(cid);
          send_msgs(cid);
            await delay(10000);
          }
        }

        loop();

        // rows.forEach(row => {
        //   let cid = row.chat_id;
        //   console.log(cid);
        //   send_msgs(cid);
        // });
      }
    }
  );
}

// endpoint to get all the dreams in the database
app.get("/fetch-customers", (req, response) => {
  // get_uid();

  db.all(
    "SELECT DISTINCT fname, lname, email, phone FROM userorders ",
    (err, rows) => {
      // console.log("in test fetch customers - -  row");

      response.send(JSON.stringify(rows));
    }
  );
});

// endpoint to get all the dreams in the database
app.get("/fetch-notification", (request, response) => {
  // get_uid();

  db.all(
    "SELECT msg FROM push_notifications ORDER BY nid DESC limit 1",
    (err, rows) => {
      // console.log("in test fetch notifications - -  row");

      if (rows.length > 0) {
        // let msg = rows[0].msg;
        // console.log(msg);

        response.json({
          messages: [
            {
              text: rows[0].msg
            }
          ]
        });
      } else {
        response.send(JSON.stringify("DOne"));
      }
    }
  );
});

// endpoint to get all the dreams in the database
app.get("/testingr", (request, response) => {
  // get_uid();

  var cid = "2780023685390008";
  send_msgs(cid);

  response.send(JSON.stringify("DOne"));
});

app.post("/push-msg", (request, response) => {
  var msg = request.body.message;
  // console.log("messgae: ", msg);

  const now = new Date();
  let cdate = date.format(date.addHours(now, 1), "ddd, MMM DD YYYY HH:mm:ss");

  var query_vals = `("${msg}", "${cdate}")`;
  var query = "INSERT INTO push_notifications (msg, date) VALUES " + query_vals;

  db.serialize(() => {
    db.run(query, function(err) {
      if (err) {
        console.log(err);
        response.json({
          messages: "fail"
        });
      } else {
        // var cid = "2780023685390008";
        // send_msgs(cid);

        get_uid();

        response.json({
          messages: "success"
        });
      }
    });
  });
});


app.get("/receipt", (request, response) => {
  var oid = request.query.oid;
  // var oid = "20200118173554";

  console.log("Item receipt");

  var district = "";

  var address = "";
  var cname = "";
  var phone = "";
  var email = "";
  var total = "";
  var pchoice = "";

  var elements = [];

  db.serialize(() => {
    db.each(
      "SELECT * from userorders where order_id='" + oid + "'",
      (err, row) => {
        // console.log("row", row);
        address = row.address;
        cname = row.fname + " " + row.lname;
        phone = row.phone;
        email = row.email;
        total = row.total_price;
        district = row.delivery_district;
        pchoice = row.pay_choice;
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
                    payment_method: pchoice,
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
  // console.log(req.body); // req data
  var xtxn = req.body.txnref; // txnref posted from webpay redirect
  var amount = req.body.amount; // amount posted from webpay redirect
  var parameters = {
    productid: prodid,
    transactionreference: xtxn,
    amount: amount
  };

  // console.log("PARAMS: ", parameters);

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
      // console.log("unsuccessful");
      var new_oid = createOid();

      var query =
        "update userorders set pay_ref = " +
        new_oid +
        " where order_id=" +
        init_oid;

      db.serialize(() => {
        db.run(query, function(err) {
          if (err) {
            // console.log("Update oid error: ", err);
          } else {

            let bu = req.protocol+"://"+req.headers.host;


            var site_redirect_url =
              bu+"/confirm?oid=" + init_oid;

            // hash value computation
            var hashv =
              new_oid + prodid + "101" + amount + site_redirect_url + mac;
            var hash = sha512(hashv);

            db.all(
              "SELECT * from userorders where order_id='" + init_oid + "'",
              (err, rows) => {
                var row = rows[0];

                // console.log("in redirect - -  row", row);

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
                // console.log("R_RESP: %j", request_response);

                // return payment status page; webpay status return before confrimation leg and return after confirmation leg
                res.render("redirect.html", request_response);
              }
            );
          }
        });
      });
    } else {
      // console.log("successful");

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
            info: row.order_info,
            takeaway: row.takeaway,

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
  // console.log("In cgate callback");
  // console.log("query ", req.query);

  const rcode = req.query.ResponseCode;

  db.all(
    "SELECT * from ctokens where ctokens.cid='" + req.query.TransactionID + "'",
    (err, rows) => {
      // console.log("in cgate redirect - -  row", rows);
      var row = rows[0];

      const oid = row.order_id;
      const amt = row.amount;

      if (rcode === "00") {
        let query = "SELECT * from userorders where order_id='" + oid + "'";

        // console.log("Select q: ", query);

        db.all(query, (err, rows) => {
          // console.log("in redirect - -  row", rows);
          var row = rows[0];

          let request_response = {
            address: row.address,
            cname: row.fname + " " + row.lname,
            phone: row.phone,
            email: row.email,
            uid: row.chat_id,
            slot: row.slot,
            pchoice: row.pay_choice,
            info: row.order_info,
            takeaway: row.takeaway,
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

function testFn(req, res, amt, oid) {
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

  let bu = req.protocol+"://"+req.headers.host;


  let rtUrl = bu+"/cgate-callback";
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

  // console.log(pObj);
  const options = {
    uri: uri,
    json: true,
    body: pObj
  };

  requestPromise.post(options).then(function(data) {
    // console.log(data);
    var parsedResponse = data;

    // console.log(parsedResponse);

    let status = data.Header.ResponseMessage;

    if (status === "Success") {
      var query_vals = `("${oid}", "${data.TransactionId}", "${amt}")`;
      var query =
        "INSERT INTO ctokens (order_id, cid , amount) VALUES " + query_vals;

      // console.log("QUery: " + query);

      // db.serialize(() => {
      db.run(query, (err, res) => {
        if (err) {
          // console.log("Token error: " + err);
        } else {
          // console.log("Token result: " + res);
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

  testFn(req, res, amount, oid);
});

app.post("/ps-mail", function(req, res) {
  // console.log("In send paystack mail");

  var oid = req.body.oid;
  var amount = req.body.amount;

  var request_response = {};

  db.all(
    "SELECT * from userorders where order_id='" + oid + "'",
    (err, rows) => {
      // console.log("in psmail - -  row", row);
      var row = rows[0];

      request_response = {
        address: row.address,
        cname: row.fname + " " + row.lname,
        phone: row.phone,
        email: row.email,
        uid: row.chat_id,
        slot: row.time_slot,
        info: row.order_info,
        takeaway: row.takeaway,
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
  // console.log("Transaction setter");

  var query = "update userorders set tstatus = 1 where order_id=" + init_oid;

  db.serialize(() => {
    db.run(query, function(err) {
      if (err) {
        // console.log("Error in tstatus set");
      } else {
        // console.log("Tstatus success");
      }
    });
  });
}

function sendConfirmMails(request_response, init_oid) {
  // console.log("In mail sender");
  setTransaction(init_oid);

  var elements = [];
  var total_p = 0;

  db.all(
    "SELECT * from order_items where order_id='" +
      init_oid +
      "' AND quantity > 0",
    (err, rows) => {
      // console.log("Row ln: " + rows.length);
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

        const now = new Date();
        let cdate = date.format(
          date.addHours(now, 1),
          "ddd, MMM DD YYYY HH:mm:ss"
        );
        
        // console.log("Response: %j", request_response);


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
          slot: request_response.slot,
          delivery: request_response.delivery,
          pchoice: request_response.pchoice,
          info: request_response.info,
          takeaway: request_response.takeaway,

          oid: init_oid,
          cdate: cdate
        };

        // console.log("Mail Params: %j", params);

        params.template = "order";
        params.subject = "New Product Order - " + init_oid;        
        
        
        const mustache   = require('mustache');
        var cus_content = fs.readFileSync("views/mails/customer.html","utf-8").toString();
        
        var ord_content = fs.readFileSync("views/mails/order.html","utf-8").toString();


        var cus_output = mustache.render(cus_content, params);        
        
        var ord_output = mustache.render(ord_content, params);
        
        
        var url_st = `${chop_url}send-mail`;

        request.post(
          url_st,
          {
            body: {
              email_address: request_response.email,
              subject: "Chopnownow Order Successful",
              message: cus_output
            },
            json: true
          },
          function(err, res, body) {
            if (err) console.log({ error: "cus: ",err });
            console.log({ d: "cus: %j",body });
            // response.send(JSON.stringify("Successfull"));
          }
        );

        request.post(
          url_st,
          {
            body: {
              
              email_address: "chopnownoworders@gmail.com",
              // email_address: "orefash@gmail.com",
              subject: "New Product Order - " + init_oid,
              message: ord_output
            },
            json: true
          },
          function(err, res, body) {
            if (err) console.log({ error: "cus: ",err });
            // console.log({ d: "cus: %j",body });
            // response.send(JSON.stringify("Successfull"));
          }
        );

        // console.log("mails sent");
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


  // var coupon = "CHOPWXYZ";
  // var amount = 2000;
  // var oid = "req.body.transaction_id";

  // console.log("coupon: " + coupon + " amount: " + amount);

  var url_st = "https://chopnownow.com/api/fb-bot/validate-coupon";

  request.post(
    url_st,
    {
      body: {
        coupon: coupon,
        transaction_id: oid,
        total_due: amount
      },
      json: true
    },
    function(err, res, body) {
      if (err) response.json({ error: err });
      else {
        // console.log("in coupon fetch resp: ", body);

        let disc = -1;
        if (body.code == "01") {
          // console.log("Error resp");
        } else if (body.code == "00") {
          // console.log("succ resp");

          disc = parseInt(amount) - parseInt(body.amount_due);
        }

        let robj = { disc: disc };

        // console.log("in coupon fetch: ", robj);

        response.json(robj);
      }
    }
  );
});


// endpoint to get all the dreams in the database
app.get("/mailing", (req, response) => {
  var params = {
    subject: "ChopNowNow Order Successful",
    cname: "Ore Faseru",
    cmail: "orefash@gmail.com",
    template: "customer"
  };
  
  const mustache   = require('mustache');
  // const fs = require('fs'); //Filesystem    
  //...
  var content = fs.readFileSync("views/mails/customer.html","utf-8").toString();
  
  // console.log("COntent: ", content);
  
  var view = { name:"01/01/1990"};
  var output = mustache.render(content, view);
  
  // console.log("Output:  ", output);
  
  var url_st = `${chop_url}send-mail`;

  request.post(
    url_st,
    {
      body: {
        email_address: "orefash@gmail.com",
        subject: "Chopnownow",
        message: output
      },
      json: true
    },
    function(err, res, body) {
      if (err) response.send({ error: err });
      // console.log({ d: body });
      response.send(JSON.stringify("Successfull"));
    }
  );

  
});

app.get("/cmm", (req, response) => {
  var url_st = chop_url+"send-mail";
  
  var rOPt = {
        email_address: "orefash@gmail.com",
        subject: "Test Mail",
        message: "Test content"
      };
  
  var reqOpt = {
    uri: url_st,
    method: 'POST',
    body: rOPt
  };

  
  requestPromise(reqOpt)
    .then(function(body) {
        response.json({ d: body });
    })
    .catch(function(err) {
        response.json({ error: err });
        // console.log(console.dir);
    });
  
  
});


app.get("/check-time", (req, response) => {
  let current = moment.tz('Africa/Lagos'); // Now in two hours
  
  let startOfDay = moment().format('YYYY-MM-DD 07:30:01'); // set this date to 12:00am today

  let closing = moment().format('YYYY-MM-DD 20:00:00'); // set this date to 12:00am today

  let opening = moment.tz(startOfDay, 'Africa/Lagos');

  let closingT = moment.tz(closing, 'Africa/Lagos');


  // console.log("Current: ", current);

  // console.log("Start: ", startOfDay);

  // console.log("oppening: ", opening);
  // console.log("closing: ", closing);
  // console.log("closing: ", closingT);

  let a = moment(opening).isBefore(current);
  // console.log("status : ", a);

  
  let msg = "";
  let red = "";

  if (moment(current).isAfter(opening) && moment(current).isBefore(closingT)){
    red = "show-menu";
  }else{
    red = "Default Redirect";
    msg = "Sorry we are currently closed at the moment, our opening hours are 7:30am to 8pm (Mondays to Fridays) and 9am to 8pm (Saturdays & Sundays). Thank you."
  }

  let resp = {
    messages: [
      {
        text: msg
      }
    ],
    redirect_to_blocks: [red]
  };
  
  
  response.json(resp);           
});


app.post("/hook", async (req, res) => {
  var reqBody = req.body;
  
  // console.log("Body: ", reqBody);
  var msg = reqBody.umsg;
  var mid = reqBody.mid;
  var oid = reqBody.oid;
  
  if (oid=="none"){
    console.log("in hook No oid");
    var oid = createOid();
    
    res.json({
      set_attributes: {
        order_id: oid
      },
      messages: [
        {
          text: "not it"
        }
      ]
    });
    
  }else{
    // console.log("in oid");
    let bu = req.protocol+"://"+req.headers.host;

    
    console.log("in hook: ", bu);
    
    let result = await handleMsg(bu, msg, oid);
    
    
    res.json(result);
   
  }  
  
});

app.get("/sf/:oid", (req, response) => {
  response.setHeader("Access-Control-Allow-Origin", "*");

  var oid = req.params.oid;

  let query = "SELECT * from userorders where order_id='" + oid + "'";
  let del = {};

  db.all(query, (err, rows) => {
    // console.log("in redirect - -  row", rows);
    var row = rows[0];

    let my_resp = {};

    my_resp = {
      address: row.address,
      cname: row.fname + " " + row.lname,
      fname: row.fname ,
      lname: row.lname,
      phone: row.phone,
      email: row.email,
      uid: row.chat_id,
      slot: row.slot,
      amt: row.total_price,
      oid: oid
    };

    if (row.tstatus == 1) {
     

      response.render("cpay.html", my_resp);
    } else {
      var elements = [];
      var total_p = 0;
      var ototal = 0;
      var takeaway_charge = 0;
      var total_value = 0;

      db.all(
        "SELECT * from order_items where order_id='" +
          oid +
          "' AND quantity > 0",
        (err, rows) => {
          // console.log("Row ln: " + rows.length);
          if (rows.length > 0) {
            rows.forEach(row => {
              var price = row.price;
              var quantity = row.quantity;
              var t_price = price * quantity;

              total_p += t_price;
              row.price = formatNaira(price);

              var take = row.takeaway * row.quantity;
              takeaway_charge += take;


              elements.push(row);
            });

            ototal = total_p;

            if (ototal < 1000){

             
              response.render("below.html", my_resp);

            }else{


              total_value = ototal + takeaway_charge;


            total_p = formatNaira(total_p);

            var timeslot = getTimeSlots();

            const options = {
              url:
                chop_url+"list-delivery-locations",
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

                let yet =  {
                  items: elements,
                  total: total_p,
                  districts: del,
                  timeslots: timeslot,
                  orderid: oid,
                  tv: total_value,
                  fname: my_resp.fname,
                  lname: my_resp.lname,
                  phone: my_resp.phone,
                  email: my_resp.email,
                  address: my_resp.address
                }; 
                // console.log("describe return: ", yet);

                response.render("of.html", yet);
              }
            });

            }

            
          } else {
            response.render("below.html", my_resp);
            // response.json({
            //   messages: [
            //     {
            //       text: "There are no items in your cart"
            //     }
            //   ],
            //   redirect_to_blocks: ["order-opt"]
            // });
          }
        }
      );
    }
  });
});

app.post("/paym", (request, response) => {
  var oid = request.body.oid;

  // console.log("From confirm: ", request.body);

  var slot = request.body.slot;
  var coupon = request.body.coupon;
  var district = request.body.district;
  var info = request.body.info;
  var payment = request.body.payment;
  var discount = request.body.discount;
  var itotal = request.body.itotal;
  var fname = request.body.fname;
  var lname = request.body.lname;
  var email = request.body.email;
  var phone = request.body.phone;
  var address = request.body.address;

  // console.log("District: " + district);

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

  // var address = "";
  var cname = fname + " " + lname;
  // var phone = "";
  // var email = "";
  var pay_ref = "";
  var uid = "";
  var takeaway_charge = 0;

  var elements = [];
  var total_p = 0;

  db.serialize(() => {
    db.each(
      "SELECT * from userorders where order_id='" + oid + "'",
      (err, row) => {
        // console.log("row", row);
        // address = row.address;
        // cname = row.fname + " " + row.lname;
        // phone = row.phone;
        // email = row.email;
        pay_ref = row.pay_ref;
        uid = row.chat_id;
      }
    );

    db.all(
      "SELECT * from order_items where order_id='" + oid + "' AND quantity > 0",
      (err, rows) => {
        // console.log("Row ln: " + rows.length);
        if (rows.length > 0) {
          rows.forEach(row => {

            // console.log("order Item: ", row);
            // console.log("");

            var take = row.takeaway * row.quantity;
            takeaway_charge += take;

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
          // console.log("District: " + district);

          // var ctotal = total_p + districts[district];
          var ctotal =
            parseInt(itotal) + parseInt(dcharge) - parseInt(discount) + parseInt(takeaway_charge);

          // console.log("paym CTotal: ", ctotal);

          // console.log("takeaway total: ",takeaway_charge);

          var query =
            "update userorders set time_slot = '" +
            slot +
            "', itotal = " +
            itotal +
            ", discount = " +
            discount +
            ", takeaway = " +
            takeaway_charge +
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
            "', fname = '" +
            fname +
            "', lname = '" +
            lname +
            "', email = '" +
            email +
            "', address = '" +
            address +
            "', phone = '" +
            phone +
            "'  where order_id=" +
            oid;

          // console.log("Udpdate query: ", query);

          // db.serialize(() => {
          db.run(query, function(err) {
            if (err) {
              // console.log("Update userorder Error: ", err);
            }
          });

          var amtt = +(Math.round(ctotal + "e+2") + "e-2") * 100;

          // console.log("AMTT: ", amtt);
          var amount = +(Math.round(amtt + "e+2") + "e-2");
          // console.log("AMOUNT: ", amount);

          let bu = request.protocol+"://"+request.headers.host;


          var site_redirect_url =
            bu+"/confirm?oid=" + oid;

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
            takeaway: formatNaira(takeaway_charge),
            pay_ref: pay_ref,
            ps_key: ps_key,
            ptype: payment,
            uid: uid
          };

          // console.log("PAY DATA: ", resp_data);

          if(payment=="pay on delivery"){
            response.render("cfh.html", resp_data);
          } else {
            response.render("confirm.html", resp_data);
          }

          
        }
      }
    );
  });
});

app.post("/broadcast-to-chatfuel/:uid", (request, response) => {
  // var chat_bot_id = process.env.CB_ID;
  // var chat_token = process.env.CB_TOKEN;
  var user_id = request.params.uid;

  var url_st =
    "https://api.chatfuel.com/bots/" +
    chat_bot_id +
    "/users/" +
    user_id +
    "/send?chatfuel_token=" +
    chat_token +
    "&chatfuel_block_name=order_confirm";
  
  console.log("User Id in broadcast: ",user_id);

  const options = {
    uri: url_st,
    headers: {
      "Content-Type": "application/json"
    }
  };

  requestPromise.post(options)
    .then(() => {
    response.json({});
  }).catch(function (err) {
      console.log("broadcast: ",err); // line 8
    
    response.json({error: err});
    });
});



app.post("/return-to-chatfuel/:uid", (request, response) => {
  // var chat_bot_id = process.env.CB_ID;
  // var chat_token = process.env.CB_TOKEN;
  console.log("In return to chatfuel")
  var user_id = request.params.uid;

  var url_st =
    "https://api.chatfuel.com/bots/" +
    chat_bot_id +
    "/users/" +
    user_id +
    "/send?chatfuel_token=" +
    chat_token +
    "&chatfuel_block_name=menu";
  
  console.log("User Id: ",user_id);
  console.log("bot Id: ",chat_bot_id);
  console.log("token Id: ",chat_token);

  const options = {
    uri: url_st,
    headers: {
      "Content-Type": "application/json"
    }
  };

  requestPromise.post(options)
    .then(() => {
    response.json({});
  }).catch(function (err) {
      // console.log("broadcast: ",err); // line 8
    
    response.json({error: err});
    });
});



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

app.get("/get-order", (request, response) => {
  response.sendFile(__dirname + "/view/order-form.html");
});

app.get("/fetchl", (req, response) => {
  const options = {
    url: chop_url+"list-delivery-locations",
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
    // console.log(rp);
    var elements = {};

    rp.forEach(function(value) {
      elements[value.title] = value.charge;
    });

    response.json(elements);
  });
});



app.get("/menu_categorys", (request, response) => {
  var oid = request.query.oid;

  const options = {
    uri: chop_url+"list-menu-category",
    headers: {
      // "Content-Type": "application/json"
    }
  };
  
  try{
    
    
  

  requestPromise.get(options).then(function(data) {

    var parsedResponse = JSON.parse(data).records;
    // console.log("Category Length: "+parsedResponse.length);
    
    
    // console.log("Category data: ",parsedResponse);
    var elements = [];
    var messages = [];

    var count = 0;
    var en = 0;
    let i =0;

    for ( i =1; i<=parsedResponse.length; i++){

      let value = parsedResponse[i-1];
      // console.log("Val: 'index'"+ i +" ",value);
      console.log("Val: 'index' ", i);

      var title = value.title;
      var tid = value.itemid;

      if (value.enable == "Yes") {
        en++;
        let bu = request.protocol+"://"+request.headers.host;

        var object = {
          title: title,
          subtitle: "Menu category",
          buttons: [
            {
              type: "json_plugin_url",
              url:
                `${bu}/getMenuItem?cat_id=${tid}&oid=${oid}`,
              title: "Show"
            }
          ]
        };

        elements.push(object);
        count++;
          console.log("At counter: " + count);

        if (count % 10 === 0) {
          console.log("At 10 counter: " + count);
          // console.log("At 10 counter elem: " + elements.length);
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
        }else if (i === parsedResponse.length -1) {
          // console.log("At end: "+count);
          // console.log("At end: elem: "+elements.length);
          if (count % 10 !== 0) {
            // console.log("After end: "+count);
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
        
        console.log("At index: elem: "+i);
        
          console.log("At length: elem: "+parsedResponse.length);
        
        
        // console.log("Elements: " + elements);
        // count++;
      }

    }
    
    console.log("Enabled: "+en);
    console.log("COunted: "+count);
    console.log("index: "+i);
    // console.log("Msgs: "+messages);

    response.json({
      messages: messages
    });
    
  }).catch(error => {
    console.log("Error in menu: ", error)
    response.json({
          messages: [
            {
              text: "It's not available at this time. Please enter 'menu' to view other meal options"
            }
          ]
        });
  });
    
    
  } catch (Ex){
    console.log("Error in menu: ", Ex)
    response.json({
          messages: [
            {
              text: "It's not available at this time. Please enter 'menu' to view other meal options"
            }
          ]
        });
    
  }
    
  
});


// endpoint to get all the dreams in the database
app.get("/getMenuItem", (request, response) => {
  var category_id = request.query.cat_id;
  var order_id = request.query.oid;

  const options = {
    uri: `${chop_url}list-menu-items`,
    json: true,
    body: {
      branch: 1,
      limit: 30,
      category: parseInt(category_id)
    }
  };
  
  try{

  requestPromise.post(options).then(function(data) {
    
    var parsedResponse = data.records;
    
    var elements = [];
    var messages = [];


    var count = 0;
    var en = 0;

    for (let i =1; i<=parsedResponse.length; i++){

      let value = parsedResponse[i-1];
      
      var title = value.title;
      var tid = value.itemid;
      var price = value.price;
      price = price.split("/")[0];
      var img_url = value.image_url;
      if (img_url.length == 0) {        
        img_url = "https://cdn.glitch.com/11cdb0eb-be82-41ef-820d-46c73f500ac1%2Fthumbnails%2Flogo_fade.png?1587384063339";
      }
      var take = value.takeaway_charge;

      let bu = request.protocol+"://"+request.headers.host;


      var url =
        bu+"/addItem?title=" +
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



      if (value.enable == "Yes") {
        en++;

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
        count++;

        if (count % 10 === 0) {
          // console.log("At 10 counter: " + count);
          // console.log("At 10 counter elem: " + elements.length);
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
        
        if (i === parsedResponse.length) {
          // console.log("At end: "+count);
          // console.log("At end: elem: "+elements.length);
          if (count % 10 !== 0) {
            // console.log("After end: "+count);
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
        // count++;
      }

    }
    
    // console.log("Enabled: "+en);
    // console.log("COunted: "+count);
    // console.log("Msgs: "+messages.length);

    response.json({
      messages: messages
    });
  }).catch(error => {
    console.log("Error in menu: ", error)
    response.json({
          messages: [
            {
              text: "It's not available at this time. Please enter 'menu' to view other meal options"
            }
          ]
        });
  });
  
  }catch(Ex){
    console.log("Error in menu: ", Ex)
    response.json({
          messages: [
            {
              text: "It's not available at this time. Please enter 'menu' to view other meal options"
            }
          ]
        });
  }
  
  
  
  
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

  // console.log(fname + " " + lname);
  var query_vals = `("${oid}", "${oid}", "${fname}", "${lname}", "${date}", "${email}", "${address}", "${phone}", "${user_id}")`;
  var query =
    "INSERT INTO userorders (order_id, pay_ref , fname, lname, date, email, address, phone, chat_id) VALUES " +
    query_vals;

  // console.log("QUery: " + query);

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
  
    // console.log("Insert query: ", query);

  db.serialize(() => {
    db.run(query, function(err) {
      if (err) {
        response.json({
          messages: [
            {
              text: "I've added "+title+" to your cart. Please enter 'cart' to view cart"
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



app.post("/addNItem", (request, response) => {
  var title = request.body.title;
  var tid = request.body.tid;
  var price = request.body.price;

  var img_url = request.body.img_url;
  var take = request.body.take;
  var quantity = request.body.quantity;

  if (take == null || take == undefined || take.length == 0) {
    take = 0;
  }
  var oid = request.body.oid;

  var query_vals = `("${oid}", "${tid}", "${title}", ${price}, ${take}, "${img_url}", ${quantity})`;
  var query =
    "INSERT INTO order_items (order_id, item_id, title, price, takeaway, img_url, quantity) VALUES " +
    query_vals;
  
    // console.log("Insert query: ", query);

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
        
        if(quantity === 0 || quantity === "0"){
          response.json({
            set_attributes: {
              selected_item: this.lastID
            },
            redirect_to_blocks: ["no_option"]
          });
        }else{
          response.json({
            messages: [
             {text: title+" added to cart. Please enter 'cart' to view cart"}
           ]
          })
        }
        
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
        // console.log("row", row);
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
      // console.log("in show cart - Row ln: " + rows.length);
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

          let bu = request.protocol+"://"+request.headers.host;


          var object = {
            title: title,
            subtitle: subtitle,
            image_url: img_url,
            buttons: [
              {
                type: "json_plugin_url",
                url: bu+"/updateQuantity?tid=" + tid,
                title: "Update Quantity"
              },
              {
                type: "json_plugin_url",
                url: bu+"/deleteItem?tid=" + tid,
                title: "Remove"
              }
            ]
          };

          elements.push(object);

          if (count % 10 === 0) {
            // console.log("counter: " + count);
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

        let bu = request.protocol+"://"+request.headers.host;

        var action_obj = {
          attachment: {
            type: "template",
            payload: {
              template_type: "button",
              text: "Total Price: " + formatNaira(total_p),
              buttons: [
                {
                  type: "web_url",
                  url: `${bu}/sf/${oid}`,
                  title: "Proceed to Payment",
                  messenger_extensions: true,
                  webview_height_ratio: "compact"
                },
                {
                  type: "show_block",
                  block_names: ["menu"],
                  title: "Add Item to Cart"
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

  //   const now = new Date();
  //   let cdate = date.format(date.addHours(now, 1), "ddd, MMM DD YYYY HH:mm:ss");
  //   console.log(cdate);

  db.all("SELECT * from userorders ", (err, rows) => {
    console.log("in test - -  row", rows);

    res.send(JSON.stringify(rows));
  });
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
var listener = app.listen(process.env.PORT||8500, () => {
  console.log(`server listening on port ${listener.address().port}`);
});