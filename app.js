const path = require('path');
const express = require('express');
const session = require('express-session');
const redis = require("redis");
const redisStore = require('connect-redis')(session);
const bodyParser = require('body-parser');
const passport=require('passport')
const morgan = require('morgan');
const pass_config=require('./config/passport')(passport);
const routes = require('./routes');
const response = require('./utils/response');
const app = express();

global.flag = 0;
let dateTime = require('node-datetime');
var future = '2021-04-16 23:49:00';
var endT=dateTime.create(future);
global.endTime = endT.format('Y-m-d H:M:S');
global.startTime= endT.format('Y-m-d H:M:S');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

app.use(morgan("dev"));

app.set('view engine','ejs');
app.set("views", path.join(__dirname, "views"));
app.use(
    session({
      resave: false,
      saveUninitialized: false,
      secret: "secret",
      store: new redisStore({ host: 'localhost', port: 6379, client: redis.createClient() }),
      cookie: { maxAge: 604800000 }
    })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(response);
app.use('/',routes);


const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`))