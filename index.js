const express = require('express');
const path = require('path');
const hbs = require('hbs');
const translate = require('@vitalets/google-translate-api');
const ISO6391 = require('iso-639-1');
const redis = require('redis');

// Setting up Redis and Express port
const REDIS_PORT = process.env.PORT||6379;
const PORT = process.env.PORT||3000;

var client = redis.createClient(REDIS_PORT);
var app = express();

app.use(express.static(path.join(__dirname, "public")));
app.set('view engine', 'hbs');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Home will be rendered with this...
app.get('/',(req,res)=>{
    res.render("home");
});

//Divided languages into categories such that if a user want a text in Hindi  
//we will provide user the text in hindi but with the help of storeCache function
//we will store the resultant text of differnt languages that belongs to Indian category
// with the help of Redis so next time if the user asks to convert same text in Tamil or Telugu
// instead of calling api again we can directly give him The desired text using cache middleware as 
// we have already stored the result on previous call.
var categories=[
    //Indian category
    ["ta","te","ml","pa","gu","hi","bn","en"],
    //European category
    ["da","cs","bg","hu","ru","es","fr","vi"]
    //Similarly we can have various categories....
];

// If a user wants Text in Bengali.This function converts and stores Text 
//in all the languages that belong to the same category
// as bengali.
function storeCache(userText,languageCode){

    for(let i=0;i<categories.length;i++)
    {
        let present = categories[i].indexOf(languageCode);
        if(present!=-1)
        {
            for(let j=0;j<categories[i].length;j++)
            {
                if(j==present){
                    continue;
                }
                else
                {   
                    translate(userText, {to:categories[i][j]}).then((response) =>{
                        const convertedText =  response.text;
                        let KEY = userText + "*in*" + categories[i][j];
                        client.setex(KEY, 1000, response.text);
                    }).catch(err => {
                        console.error(err);
                    });
                }
            }
        }
    }
}

//checks wheter a given Text in desired Language already exists or not...
function cache(req,res,next){
    let languageCode= ISO6391.getCode(req.body.language);
    let KEY = req.body.userText + "*in*" + languageCode;
    client.get(KEY, (err, data) => {
        if (err) 
            throw err;
    
        if (data !== null) {
            console.log("middleware used");
            return res.render("interpret",{
                heading:`The text is successfully converted using the Cache`,
                convertedtext:data,
                usertext:req.body.userText
            });
        } 
        else {
  
          next();
        }
    });
}

app.post('/interpret',cache,(req, res)=>{
     
    var userText = req.body.userText;
    var language = req.body.language;
    const languageCode= ISO6391.getCode(language);
    
    storeCache(userText,languageCode);

    translate(userText, {to:`${languageCode}`}).then((response) =>{
        const convertedText =  response.text;
        res.render("interpret",{
            heading:`The text is successfully converted using the API`,
            convertedtext:convertedText,
            usertext:userText
        });
    }).catch(err => {
        console.error(err);
        res.status(500).json({
            message:`Internal server error!`
        });
    });
    
});

app.listen(PORT,()=>{
    console.log(`Successfully started on PORT : ${PORT}`);
})