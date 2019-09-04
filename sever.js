const express = require('express');
const bodyParser = require('body-parser');
const fetch = require("node-fetch");
const hanaClient = require("@sap/hana-client");
const connection = hanaClient.createConnection();
const request = require("request");

const connectionParams = {
    host : "/* hostname*/",
    port : "/* portNumber*/",
    uid  : "/* userId*/",
    pwd  : "/* password*/",
    databaseName : "/* databasename*/",
}

// create express app
const app = express();
// console.log(app);

app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*'); // * => allow all origins
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,OPTIONS,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, X-Auth-Token, Accept'); // add remove headers according to your needs
  next()
});

// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }))

// parse requests of content-type - application/json
app.use(bodyParser.json())


// Configuring the database
// const dbConfig = require('./config/database.config.js');
// const mongoose = require('mongoose');

// mongoose.Promise = global.Promise;

// // Connecting to the database
// mongoose.connect(dbConfig.url, {
//     useNewUrlParser: true
// }).then(() => {
//     // "Successfully connected to the database"
// }).catch(err => {
//     console.log(err);
//     // 'Could not connect to the database. Exiting now...', err
//     process.exit();
// });  req.body.data.roomId

app.get('/', (req, res) => {
  res.json({"message": "Application Base Route"});
});

// define a simple route which will be used to create a webhook in developer.webex.com
app.post('/webex', (req, res) => {
    res.json({"message": "webhook end point to be put in while registering a webhook @creating a webhook in developer.webex.com"});
    console.log(req.body);
    postingMessageToBot(req.body.data.id,req.body.data.roomId);
});


const postingMessageToBot = (id, roomId) => {
  console.log(roomId);
  getMessageText(id).then((response) => {
    console.log(response);
    getHanaApiData(roomId, response);
  });
}

const getMessageText =  async (id) => {
  const url = 'https://api.ciscospark.com/v1/messages/' + id;
  console.log(url);
  try {
    await fetch(url, {
        method: 'get',
        headers: { 'Content-Type': 'application/json',
      "Authorization" : "Bearer ACCESS_TOKEN_FOR_BOT" },
    })
    .then(res => res.json())
    .then(json => console.log(json))
    } catch (error) {
      console.log(error);
    }
}

const postWebexData = async (url, requestBody) => {
    try {
    await fetch(url, {
        method: 'post',
        body:    JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json',
      "Authorization" : "Bearer ACCESS_TOKEN_FOR_BOT" },
    })
    .then(res => res.json())
    .then(json => console.log(json.id))
    } catch (error) {
      console.log(error);
    }
}

const getHanaApiData = async (roomId, messageText) => {
    // console.log(messageText);
    try {
     await  connection.connect(connectionParams, (err) => {
        if (err) {
            return console.error("Connection error", err);
        }
       console.log("connected to HANA");
       const sql = `HANA QUERY`;

    
        connection.exec(sql, (err, rows) => {
            connection.disconnect();
            if (err) {
                return console.error('SQL execute error:', err);
            }
            console.log("Results:", rows);
            console.log(`returned ${rows.length} items`);
            const requestBody = {
              "roomId": roomId,
              "markdown": "",
             "attachments": [
                  {
                  "contentType": "application/vnd.microsoft.card.adaptive",
                  "content": {
                  "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
                  "type": "AdaptiveCard",
                  "version": "1.0",
                  "body": [
                    {
                      "type": "TextBlock",
                      "text": "Top 5 Customers for US Commercials are shown below",
                      "color": "good",
                      "wrap": true,
                      "size": "extralarge"
                    },
                    {
                      "type": "TextBlock",
                      "text": rows[0].ACCOUNT_NAME + " : " + rows[0].AMOUNT,
                      "color": "default"
                    },
                    {
                      "type": "TextBlock",
                      "text": rows[1].ACCOUNT_NAME + " : " + rows[1].AMOUNT,
                      "color": "default"
                    },
                    {
                      "type": "TextBlock",
                      "text": rows[2].ACCOUNT_NAME + " : " + rows[2].AMOUNT,
                      "color": "default"
                    },
                    {
                      "type": "TextBlock",
                      "text": rows[3].ACCOUNT_NAME + " : " + rows[3].AMOUNT,
                      "color": "default"
                    },
                    {
                      "type": "TextBlock",
                      "text": rows[4].ACCOUNT_NAME + " : " + rows[4].AMOUNT,
                      "color": "default"
                    }
                    
                  ]
                }
              }
              ]
            
            }
            postWebexData('https://api.ciscospark.com/v1/messages' , requestBody).then((response)=>{
              console.log(response);
                   process.exit();
            });
        });
    });
    } catch (error) {
      
    }
}

// listen for requests
app.listen(5000, () => {
    console.log("------------------SERVER STARTED---------------------at port 5000");
});
