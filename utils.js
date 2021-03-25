const dialogflow = require("@google-cloud/dialogflow");
const uuid = require("uuid");
const fetch = require("node-fetch");

const chop_url = "https://chopnownow.com/api/fb-bot/";

// projectId: ID of the GCP project where Dialogflow agent is deployed
const projectId = "restaurantdemo-xoty";
// sessionId: String representing a random number or hashed user identifier
// const sessionId = '123456';

async function getCategories(){
  
  var cats = [];
  
  var uri = chop_url+"list-menu-category";
  
  try{
    
    const response = await fetch(uri);
    const json = await response.json();
    
    if(json.code!=="00"){
      return null;
    }
    cats = json.records;
      // console.log("Cts: ", cats);
    
  }catch(err){
    console.log("Error: ", err);
    cats = null;
  }
  
  return cats;
  
}

async function searchCategory(category){
  
  let cat = null;  
  category = category.trim();
  var cats = await getCategories();
  
  if(cats!==null){
    
      let i=0;
      const clen = cats.length;
      
      for(; i < clen; i++) {
        
        var citem = cats[i].title.toLowerCase();
        if(category.toLowerCase() === citem.trim()){
          
          cat = cats[i];
          
          break;
        }
        
      }
    
  }
  return cat;
}


async function checkItem(item, tid){
  var fItem = null;
  
  try{
    
    var uri = `${chop_url}list-menu-items`;
    var body = {
      branch: 1,
      limit: 30,
      category: parseInt(tid)
    };
    
    var items = await fetch(uri, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' }
    });
    
    const json = await items.json();
    if(json.code!=="00"){
      return null;
    }
    
    // console.log("");
    // console.log("Items: ", json);
    
    let i=0;
    const clen = json.records.length;
    
    // console.log("item ln: ", clen);
    item = item.trim();
    for(; i < clen; i++) {
      var citem = json.records[i].title.toLowerCase();
      if(item.toLowerCase() === citem.trim()){        
        fItem = json.records[i];
        break;
      }  
    }
  } catch(err) {
    console.log("In check Item error: ", err);
  }
  return fItem;
}


async function checkItems(item, tid){
  var fItem = [];
  
  try{
    
    var uri = `${chop_url}list-menu-items`;
    var body = {
      branch: 1,
      limit: 30,
      category: parseInt(tid)
    };
    
    var items = await fetch(uri, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' }
    });
    
    const json = await items.json();
    if(json.code!=="00"){
      return null;
    }
    
    // console.log("");
    // console.log("Items: ", json);
    
    let i=0;
    const clen = json.records.length;
    
    // console.log("item ln: ", clen);
    item = item.trim();
    for(; i < clen; i++) {
      var citem = json.records[i].title.toLowerCase();
      if(citem.includes(item.toLowerCase())){
        
        fItem.push(json.records[i]);
        // break;
      }
      
    }
    
    
  } catch(err) {
    console.log("In check Item error: ", err);
  }
  return fItem;
}



async function searchItems(item){
  
  var fItem = [];
  
  var cats = await getCategories();
  if(cats!==null){
    
    try{
      
      let i=0;
      const clen = cats.length;
      
      for(; i < clen; i++) {
        // console.log("Category: ", cats[i].title);
        let check = await checkItems(item, cats[i].itemid);
        if(check!==null && check.length > 0){
          fItem.push(...check);
          // break;
        }
      }
      
    } catch(err) {
      console.log("Error in item search: ", err);      
    }
    
  }else{
    return null;
  }
  
  return fItem;
  
}

async function searchItem(item){
  
  var fItem = null;
  
  var cats = await getCategories();
  if(cats!==null){
    
    try{
      
      let i=0;
      const clen = cats.length;
      
      for(; i < clen; i++) {
        // console.log("Category: ", cats[i].title);
        let check = await checkItem(item, cats[i].itemid);
        if(check!==null){
          fItem = check;
          break;
        }
      }
      
    } catch(err) {
      
      console.log("Error: ", err);
      
      
    }
    
  }else{
    return null;
  }
  
  return fItem;
  
}

async function parseFoundItems(items, bu, oid){
    
    var elements = [];
    var messages = [];


    var count = 0;
    var en = 0;
  
    let i=1;
    const clen = items.length;
      
    for(; i <= clen; i++) {
      
      let value = items[i-1];
      
      var title = value.title;
      var tid = value.itemid;
      var price = value.price;
      price = price.split("/")[0];
      var img_url = value.image_url;
      if (img_url.length == 0) {        
        img_url = "https://cdn.glitch.com/11cdb0eb-be82-41ef-820d-46c73f500ac1%2Fthumbnails%2Flogo_fade.png?1587384063339";
      }
      var take = value.takeaway_charge;



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
        oid +
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
        
        if (i === clen) {
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
    
    return {
      messages: messages
    };
  
}

async function checkParam(param){
  console.log("In check: ", param);
  if(param.stringValue.length > 0){
    return param.stringValue;
  }else{
    return "";
  }
}

async function parseFulfillment(bu, result, cs, oid){
  
  var res = {};
  
  switch(cs){
      
    case "atc":
      
      var params = result.outputContexts[0].parameters.fields;
      
      var menu_items = params["menu-item"].listValue.values;
      
      var quantities = params["quantity"].listValue.values;
      
      // res.mitems = [];
      console.log("in processf ful");
      for (let i = 0; i < menu_items.length; i++) {
        let mit = menu_items[i].stringValue;
        var check = await searchItem(mit);
        if(check !== null){
           
          console.log("In CHeck for atc: ", check);
          if(check.enable==="Yes"){
            var title = check.title;
            var tid = check.id;
            var price = check.price;

            var img_url = check.image_url;
            var take = check.takeaway_charge;
            var quantity = 0;
            
            if(quantities.length > 0){
              quantity = quantities[i].numberValue;
            }
            
            let aparams = {
              title: title,
              tid: tid,
              price: price,
              img_url: img_url,
              take: take,
              quantity: quantity,
              oid: oid
            }
            
            var uri = bu+"/addNItem";
            

            var items = await fetch(uri, {
              method: 'POST',
              body: JSON.stringify(aparams),
              headers: { 'Content-Type': 'application/json' }
            });

            const json = await items.json();
            
            // console.log("Add item resp: ", json);
            
            res = json;
            
          }else{
            
            res.messages = [
                 {text: check.title+" is not available at this time. Type 'menu' to view other items"}
            ];
            
          }

          
        }else{
          console.log("Not OFund: ", mit);
          res.messages = [
              {text: "I didn't get that. Can you repeat?"}
            ];
        }
        // res.mitems.push();
      }
      
      
      console.log("Result: ", res);
      
      break;
      
    case "search":
      console.log("Res: ", result.parameters.fields);
      
      var category = await checkParam(result.parameters.fields["menu-category"]);
      var side = await checkParam(result.parameters.fields["side-options"]);
      var meal = await checkParam(result.parameters.fields["meal-options"]);
      var item = await checkParam(result.parameters.fields["menu-item"]);
      
      if(category.length > 0){
        
        var cat = await searchCategory(category);
        
        if(cat !== null){
          // console.log("Fet: ", cat);
          
          let uri = `${bu}/getMenuItem?cat_id=${cat.itemid}&oid=${oid}`;
          
          const response = await fetch(uri);
          
          const json = await response.json();
          
          // console.log("resp: ", json);
          
          res = json;
          
        }else{
          console.log("Cat not found");
        }
        
      }else if( side.length > 0){
        
        let fItems = await searchItems(side);
        // console.log("Found items: ", fItems);
        res = await parseFoundItems(fItems, bu, oid);
        
        // console.log("Response from sides: %j", res);
        
      }else if( meal.length > 0 ){
        
        let fItems = await searchItems(meal);
        // console.log("Found items: ", fItems);
        res = await parseFoundItems(fItems, bu, oid);
        
        // console.log("Response from meal: %j", res);
        
        
      }else if( item.length > 0 ){
        
        let fItems = await searchItems(item);
        // console.log("Found items: ", fItems);
        res = await parseFoundItems(fItems, bu, oid);
        
        // console.log("Response from item: %j", res);
        
        
        
      }
      else{
        console.log("Nothing in search");
      }
      
      // var check = await searchItem(mit);
      
      // return res;
      break;


          
    case "water":
        
        let fItems = await searchItems("water");
        // console.log("Found items: ", fItems);
        res = await parseFoundItems(fItems, bu, oid);
        
      break;
      
      
  }
  
  return res;
}

async function handleIntents(bu, result, oid) {
  var dintent = result.intent.displayName;
  var response = result.fulfillmentText;

  var parsedIntent = dintent.split("-")[0].trim();

  let resp = {};

  switch (parsedIntent) {
    case "0":
    case "1":
    case "3":
      resp = {
        redirect_to_blocks: ["show-menu"]
      };

      break;
    case "4":
      console.log("in add to cart");
      resp = await parseFulfillment(bu, result, "atc", oid);
      
      // await getCategories();
      break;
    case "2":
      console.log("in search");      
      resp = await parseFulfillment(bu, result, "search", oid);
      break;
    case "11":      
      console.log("in add water"); 
      resp = await parseFulfillment(bu, result, "water", oid);
      break;
    default:
      console.log("NO intent found")
  }

  return resp;
}

async function runSample(base_url, msg, sessionId) {
  // A unique identifier for the given session
  // const sessionId = uuid.v4();

  const projectId = "vaulted-bazaar-159614";
  // Create a new session
  const sessionClient = new dialogflow.SessionsClient({
    keyFilename: "keys/gkey.json"
  });
  const sessionPath = sessionClient.projectAgentSessionPath(
    projectId,
    sessionId
  );

  // The text query request.
  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        // The query to send to the dialogflow agent
        text: msg,
        // The language used by the client (en-US)
        languageCode: "en-US"
      }
    }
  };

  // Send request and log result
  const responses = await sessionClient.detectIntent(request);
  // console.log("Detected intent: ", responses);
  const result = responses[0].queryResult;

  
  // console.log("\n\nDetected intent: ", result);

  console.log("Rsult: %j", result.parameters);
  console.log("");
  console.log(`  Query: ${result.queryText}`);
  console.log(`  Response: ${result.fulfillmentText}`);
  
  var retResponse = {
    messages: [
      {
        text: "Sorry, could you say that again?"
      }
    ]
  };

  if (result.intent) {
    
    console.log(` resulting  Intent: ${result.intent.displayName}`); 
    retResponse = await handleIntents(base_url, result, sessionId);
  } else {
    console.log(`  No intent matched.`);
    
  }
  return retResponse;
  // return result.fulfillmentText;
}

module.exports = {
  handleMsg: runSample
};
