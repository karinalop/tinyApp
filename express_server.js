var express = require("express");
var app = express();
var PORT = 8080; // default port 8080

const bcrypt = require('bcrypt');

// set the view engine to ejs
app.set("view engine", "ejs");

//set the body handler
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

//set the cookie handler
var cookieSession = require('cookie-session');
app.use(cookieSession({
  name: 'session',
  keys: ["some-long-secret"],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))

const urlDatabase = {
  "b2xVn2": {longURL: "http://www.lighthouselabs.ca", userID:"userRandomID"},
  "9sm5xK": {longURL: "http://www.google.com", userID:"user2RandomID"},
  "b6UTxQ": { longURL: "https://www.tsn.ca", userID: "karina" },
  "i3BoGr": { longURL: "https://www.google.ca", userID: "karina" }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  },

  "karina": {
    id: "karina",
    email: "karina@gmail.com",
    password: '$2b$10$JkCPZyVqH/hpQcHTu7vRIOzfm5ru4cQbbpSv3kTzx4jLmTecDZvIy'
  }

}

//------------------------------------------
function generateRandomString() {
  var text = "";
  var possible = "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (var i = 0; i < 6; i++) {
  text += possible.charAt(Math.floor(Math.random() * 7));
  }
  return text;
}

//-------------------------------
var emailExist = function (email){
  for (let key in users){
    if (users[key].email === email)
      return users[key].id;
  }
  return false
}
//-------------Returns an object with urls created by an user-----------------------------------------
var urlsForUser = function (userID) {
  if(!userID){
   return false;
  }
  const urlsForUser = {};
  for (let key in urlDatabase){
    if (urlDatabase[key].userID === userID){
      urlsForUser[key] = urlDatabase[key];
    }
  }
  return urlsForUser;
}
//---------------------------------------------------------

app.get("/", (req, res) => {
  res.send("Hello!");
});

//----------------------------------------------------

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
//---------------------------------------------------

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//-----------------------------------------------

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

//----------------- ---------------------

app.get("/urls", (req, res) => {
  if(!req.session.user_id){
    res.send("<html><body>You are not logged in <a href='/login'>Login</a> </body></html>\n");
    return;
  }
  const urlsUser = urlsForUser(req.session.user_id);
  if(!urlsUser){
    //user hasnt create any url yet
    res.send("<html><body><a href='/urls_new'>Create a new short URL</a> </body></html>\n");
    return;
  }
  let templateVars = { urls: urlsUser, user: users[req.session.user_id] };
  res.render("urls_index", templateVars);
});

//-------------Display page to create a new URL--------
app.get("/urls/new", (req, res) => {
  if(!req.session.user_id){
    res.redirect("/login");
    return;
  }
  let templateVars = { user: users[req.session.user_id] };
  res.render("urls_new", templateVars);
});

//------------------- Shows the url short an long and th option of updating------------------------------

app.get("/urls/:shortURL", (req, res) => {
  if(!req.session.user_id){
    res.send("<html><body>You are not logged in <a href='/login'>Login</a> </body></html>\n");
    return;
  }
  const short = req.params.shortURL;
  if(!urlDatabase[short] ){
    res.status(400).send("this shortURL does not exist");
    return;
  }

  if(urlDatabase[short].userID === req.session.user_id){
    let templateVars = {shortURL: short,
                        longURL: urlDatabase[short].longURL,
                        user: users[req.session.user_id]};
    res.render("urls_show", templateVars);
  }
  else
    res.status(403).send("you have no access to modify this url");
});


// ----------Adds a new url objec to database given the user and longURL---------
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = {"longURL": longURL, "userID": req.session.user_id };
  res.redirect(`/urls/${shortURL}`);
});

//-------------------Redirects to longURL given a ShortURL-------
app.get("/u/:shortURL", (req, res) => {

  short = req.params.shortURL;
  if(!urlDatabase[short] ){
    res.status(400).send("this shortURL does not exist");
    return;
  }
  const longURL = urlDatabase[short].longURL;
  if(longURL){
    res.redirect(longURL);
  }
  else{
   res.status(400).send("the url doesnt exist");
  }

});

//------------------ Delete one url from urlDatabase given the shortURL

app.post("/urls/:shortURL/delete", (req, res) =>{

  const short = req.params.shortURL;
  if(req.session.user_id === urlDatabase[short].userID){
    delete urlDatabase[short];
    res.redirect("/urls");
  }else{
    res.status(403).send("You have no access to delete this url");
  }

});

// -----------Update the longURL in the urlDatabase given the shortURL and the new longURL
app.post("/urls/:shortURL", (req,res) => {

  const short = req.params.shortURL;

  if(req.session.user_id === urlDatabase[short].userID){
    urlDatabase[short].longURL = req.body.longURL;
    res.redirect(`/urls/`);
    return
    }else{
      res.status(403).send("You have no access to delete this url");
      }
});

//--------------------------------------------------

app.get("/login", (req, res) =>{
  let templateVars = { user: users[req.session.user_id] };
  res.render("login",templateVars);
});

//--------------------------------------------------

app.post("/login", (req, res) =>{
  const userId = emailExist(req.body.email);
  if(userId){
    if (userId === req.session.user_id){
      res.send("You are already loged in");
      return;
    }

    if(bcrypt.compareSync(req.body.password, users[userId].password)){
      req.session.user_id = userId;
      res.redirect("/urls");
    }else {
      res.status(403).send("Incorrect Password");
    }
  }else {
    res.status(403).send("User not registered");
  }
});

//------------------------------------------------------

app.post("/logout",  (req, res) =>{
  req.session = null;
  res.redirect("/urls");
});


app.get("/register", (req, res) =>{
  let templateVars = { user: users[req.session.user_id] };
  res.render("register",templateVars);
});

// -----------------To register a new user--------------------
app.post("/register", (req, res) =>{

  if(!req.body.email || !req.body.password){
    res.status(400).send("Invalid email or password");
    return;
  }
  if(emailExist(req.body.email)){
    res.status(400).send("Email already registered");
    return;
  }

  const newId = generateRandomString();
  const password = req.body.password; // found in the req.params object
  const hashedPassword = bcrypt.hashSync(password, 10);
  const newUser = {'id': newId,
                  'email': req.body.email,
                  'password': hashedPassword };
  users[newId] = newUser;
  req.session.user_id = newId;
  res.redirect("/urls");

});





