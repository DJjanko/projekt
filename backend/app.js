var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

// vključimo mongoose in ga povežemo z MongoDB
var mongoose = require('mongoose');
var mongoDB = "mongodb://127.0.0.1/vaja6";
mongoose.connect(mongoDB);
mongoose.Promise = global.Promise;
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// vključimo routerje
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/userRoutes');
var photosRouter = require('./routes/photoRoutes');
var speedRouter = require('./routes/speedLimitRoutes');

var app = express();

function getLocalIP() {
    const os = require('os');
    const interfaces = os.networkInterfaces();

    const blacklist = ['VMware', 'VirtualBox', 'vEthernet', 'Docker', 'Hyper-V', 'nat', 'br-', 'wsl'];

    for (const name in interfaces) {
        if (blacklist.some(v => name.toLowerCase().includes(v.toLowerCase()))) {
            continue;
        }

        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1';
}

const LOCAL_IP = getLocalIP();
console.log("Running with IP:", LOCAL_IP);


var cors = require('cors');
var allowedOrigins = ['http://localhost:3000', 'http://localhost:3001','http://localhost:8081', `http://${LOCAL_IP}:8081`, `exp://${LOCAL_IP}:8081`];
app.use(cors({
    credentials: true,
    origin: function(origin, callback){
        // Allow requests with no origin (mobile apps, curl)
        if(!origin) return callback(null, true);
        if(allowedOrigins.indexOf(origin)===-1){
            var msg = "The CORS policy does not allow access from the specified Origin.";
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    }
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Vključimo session in connect-mongo.
 * Connect-mongo skrbi, da se session hrani v bazi.
 * Posledično ostanemo prijavljeni, tudi ko spremenimo kodo (restartamo strežnik)
 */
var session = require('express-session');
var MongoStore = require('connect-mongo');
app.use(session({
    secret: 'work hard',
    resave: false,                  // better for performance
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: mongoDB,ttl: 60 * 60,autoRemove: 'native' }),
    cookie: {
        maxAge: 1000 * 60 * 60,
        sameSite: 'lax',              // needed so cookies are allowed on navigation
        secure: false                 // only use true if on HTTPS
    }
}));

//Shranimo sejne spremenljivke v locals
//Tako lahko do njih dostopamo v vseh view-ih (glej layout.hbs)
app.use(function (req, res, next) {
    res.locals.session = req.session;
    next();
});

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/photos', photosRouter);
app.use('/speed', speedRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    //res.render('error');
    res.json(err);
});

module.exports = app;
