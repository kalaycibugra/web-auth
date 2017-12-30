#!/usr/bin/env node

const assert = require('assert');
const mongo = require('mongodb').MongoClient;
const process = require('process');
var express = require("express");
var cookieParser = require('cookie-parser');
var session = require('express-session');
var path = require("path");
var bodyParser = require('body-parser');
var axios = require('axios');
//const https = require('https');
var httpsAgent = require('https-agent');
var expressValidator = require('express-validator');
const option = require('./options');
var fs = require('fs');
var http = require('http');
var https = require('https');

'***********************-option.js options******************************'
const options = option.options;
console.log(options);
const PORT=options.port;
const ssl=options.sslDir;
const authTime=options.authTimeout;
const urls=options.ur;
'***************************-creating https***************************'
var app = express();    
var privateKey  = fs.readFileSync(`${options.sslDir}/key.pem`, 'utf8');
var certificate = fs.readFileSync(`${options.sslDir}/cert.pem`, 'utf8');

var credentials = {key: privateKey, cert: certificate};
//var httpServer = http.createServer(app);
var httpsServer = https.createServer(credentials, app);



'*****************************************************'

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "./views"));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false
}));
app.use(expressValidator());
'*****************************************************'
app.get("/login", function(req, res) {    
    
        res.render("login");
        
});
'*****************************************************'
app.get("/index", function(req, res) {    
    
        res.render("index");
        
});
'*****************************************************'
app.post("/login", function(req, res) {
console.log(urls)
axios({
            method: 'PUT',
            url: urls  +""+ req.body.mail + '/auth',
            httpsAgent: new https.Agent({  
            rejectUnauthorized: false
            }),
            data: {
                pw: req.body.password
            }
        }).then(function(response) {
            const result = response.data;
            
            if (result.status != "OK") {
                req.session.error = result.info;
                res.redirect('/login');
            
            } else {
                
                req.session.mail = req.body.mail;
                req.session.authToken = result.authToken;
                res.redirect('/profile');
            
            }
        }).catch(error => {
            
            if (error.response) {
            
                req.session.error = error.response.data.info;
            }
            
            res.redirect('/login');
        });
});
'*****************************************************'
app.get("/register", function(req, res) {
    
        res.render("register");
});
'*****************************************************'
app.get("/profile", function(req, res) {
   console.log(req.session.mail);
axios({
            method: 'GET',
            url: urls  +""+ req.session.mail,
            httpsAgent: new https.Agent({  
            rejectUnauthorized: false
            }),
            headers: {  
                 'Authorization': 'Bearer '+req.session.authToken
            }
        }).then(function(response) {
            console.log(response.data);
            console.log(response.data.firstname);
            console.log(response.status);
            if (response.status != 200) {
                req.session.error = result.info;
                console.log(req.session.error);
                res.redirect('/login');
                
            } else {

                res.render("profile", {
                    firstname: response.data.firstname,
                    lastname: response.data.lastname,
                    mail: response.data.mail
                });

       
            }
        }).catch(error => {
            console.log(error);
            if (error.response) {
           
                req.session.error = error.response.data.info;
            }
            res.redirect('/login');
        });
   
    
        });
'*****************************************************'
app.post("/register",function(req,res){
    regexMail=/\S+@\S+|\{(?:\w+,*)+\w+\}@[\w.-]+/;
    regexPassword=/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/
    var regres1=(regexMail).test(req.body.mail);
    var regres2=(regexPassword).test(req.body.password);
    var regres3=(req.body.password==req.body.rePassword);

    if(!regres3||!regres2||!regres1)
        {
                res.redirect('/register');}
    else{     
   axios({
            method: 'PUT',
            url: urls  +""+ req.body.mail+"?pw="+req.body.password,
            httpsAgent: new https.Agent({  
            rejectUnauthorized: false
            }),
            data: {
                firstname: req.body.firstName,
                lastname: req.body.lastName,
                mail: req.body.mail
            }
        }).then(function(response) {
            const result = response.data;
            console.log(result.status);
            if (result.status != "CREATED") {
                req.session.error = result.info;
                res.redirect('/login');
            } else {
                req.session.mail = req.body.mail;
                req.session.authToken = result.authToken;
                res.redirect('/profile');
            }
        }).catch(error => {
            
            if (error.response) {
                req.session.error = error.response.data.info;
            }
            res.redirect('/login');
        });}
}); 
'*****************************************************'
app.get('/logout', function(req, res){
    req.session.destroy(function(){
        console.log("user logged out")
    });
    res.redirect('/login');
});
'*****************************************************'
app.listen(PORT, function(error) {
    if(error){
        console.error(error);
    }
    else{
        console.info("Listening on port %s.", PORT);
    }
});
