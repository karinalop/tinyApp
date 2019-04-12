var express = require("express");
var app = express();
var PORT = 8080; // default port 8080



// set the view engine to ejs
app.set("view engine", "ejs");

//set the body handler
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

//set the cookie handler
var cookieParser = require('cookie-parser');
app.use(cookieParser());


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
    password: "lopez"
  }

}

//------------------------------------------
function generateRandomString() {
var ramdom = 6; //length of the string
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

//--------------------------------------

app.get("/urls", (req, res) => {
  if(!req.cookies.user_id){
    res.send("<html><body>You are not logged in <a href='/login'>Login</a> </body></html>\n");
    return;
  }
  const urlsUser = urlsForUser(req.cookies.user_id);
  if(!urlsUser){
    //user hasnt create any url yet
    res.send("<html><body><a href='/urls_new'>Create a new short URL</a> </body></html>\n");
    return;
  }
  let templateVars = { urls: urlsUser, user: users[req.cookies.user_id] };
  res.render("urls_index", templateVars);
});

//-------------Display page to create a new URL--------
app.get("/urls/new", (req, res) => {
  if(!req.cookies.user_id){
    res.redirect("/login");
    return;
  }
  let templateVars = { user: users[req.cookies.user_id] };
  res.render("urls_new", templateVars);
});

//------------------- Shows the url short an long and th option of updating------------------------------

app.get("/urls/:shortURL", (req, res) => {
  if(!req.cookies.user_id){
    res.send("<html><body>You are not logged in <a href='/login'>Login</a> </body></html>\n");
    return;
  }

  const short = req.params.shortURL;
  //console.log(req.params.shortURL);
  //console.log(urlDatabase[short].userID);
  if(urlDatabase[short].userID === req.cookies.user_id){
    let templateVars = {shortURL: short,
                        longURL: urlDatabase[short].longURL,
                        user: users[req.cookies.user_id]};
    res.render("urls_show", templateVars);
  }
  else
    res.status(403).send("you have no access to modify this url");
});


// ----------Adds a new url objec to database given the user and longURL
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = {"longURL": longURL, "userID": req.cookies.user_id };
  //console.log(urlDatabase);
  res.redirect("/u/" + shortURL);
});

//-------------------Redirects to longURL given a ShortURL-------
app.get("/u/:shortURL", (req, res) => {
 // console.log("hasta aqui funciona");
  //console.log(req.params.shortURL);

  short = req.params.shortURL;
  //console.log(shortURL);

  const longURL = urlDatabase[short].longURL;
  if(longURL){
    res.redirect(longURL);
  }
  else{
   res.status(400).send("the url doesnt exist");
  }

});

// deletes an url from urlDatabase given the shortURL

app.post("/urls/:shortURL/delete", (req, res) =>{
  //console.log("got into delete route");
  //console.log(req.params.shortURL);
  const short = req.params.shortURL;
  if(req.cookies.user_id === urlDatabase[short].userID){
    delete urlDatabase[short];
    res.redirect("/urls");
  }
  else{
    res.status(403).send("You have no access to delete this url");
  }

});

// -----------Update the longURL in the urlDatabase given the shortURL and the new longURL
app.post("/urls/:shortURL", (req,res) => {

  const short = req.params.shortURL;
  //console.log(req.params.shortURL);
  //console.log(urlDatabase[short].userID);
  //console.log(req.cookies.user_id);

  if(req.cookies.user_id === urlDatabase[short].userID){
    urlDatabase[short].longURL = req.body.longURL;
    //console.log("fdjkfkjfkjf"+urlDatabase);
    res.redirect(`/urls/${req.params.shortURL}`);
    return
    }

  else{
      res.status(403).send("You have no access to delete this url");
      }


});

//--------------------------------------------------

app.get("/login", (req, res) =>{
  let templateVars = { user: users[req.cookies.user_id] };
  res.render("login",templateVars);
});

//--------------------------------------------------

app.post("/login", (req, res) =>{
  //console.log(req.body.email);
  const userId = emailExist(req.body.email);
  //console.log(userId);
  if(userId){
    if (userId === req.cookies.user_id){
      res.send("You are already loged in");
      return;
    }

    if(users[userId].password === req.body.password){
      res.cookie("user_id",userId);
      res.redirect("/urls");
    }
    else {
      // the password is not correct
      res.status(403).send("Incorrect Password");
    }
  }
  else {
    res.status(403).send("User not registered");
  }
});

//------------------------------------------------------

app.post("/logout",  (req, res) =>{
  res.clearCookie("user_id"); //fix here
  res.redirect("/urls");
});


app.get("/register", (req, res) =>{
  let templateVars = { user: users[req.cookies.user_id] };
  res.render("register",templateVars);
});

// To register a new user
app.post("/register", (req, res) =>{

  if(!req.body.email || !req.body.password){
    res.status(400).send("Invalid email or password");
    return;
  }
  if(emailExist(req.body.email)){
    res.status(400).send("Email already registered");
    return;
  }
  //console.log(req.body.email);
  //console.log(req.body.password);
  const newId = generateRandomString();
  const newUser = {'id': newId,
                  'email': req.body.email,
                  'password': req.body.password };
  users[newId] = newUser;
  res.cookie("user_id",newId);
  res.redirect("/urls");

});

//To log in





