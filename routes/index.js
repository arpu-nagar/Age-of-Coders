const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const to = require('../utils/to');
const db = require('../config/conn');
const auth = require('./auth');
const user = require('./user');
const admin = require('./admin');

router.get('/', async(req, res) => {
        res.render("splash-screen");
    })
    //login routes
router.get('/login',  (req, res) => {
    if(req.isAuthenticated())
    res.redirect('/regions');
    else
    res.render('login');
});


router.get('/register',auth.notLoggedIn, auth.renderRegiser)
router.get('/logout', auth.logout);

// auth

router.post('/register', auth.captchaVerify,auth.notLoggedIn, auth.register)
router.post('/login', auth.notLoggedIn, auth.login);

// general routes
router.get('/regions', auth.isLoggedIn, user.showRegions);
router.get('/regions/:rid', auth.isLoggedIn, user.showRegionByID);


//route for api
router.get('/regions/:rid/api', auth.isLoggedIn, user.sendData);
router.get('/leaderboard', user.showLeaderboard);
router.get('/leaderboard/message',user.ContestEnd);
router.get('/rules', user.showRules);
router.post('/submit/:qid', auth.isLoggedIn, user.submit);

//admin routes
router.get('/admin/addQ', auth.adminLoggedin, admin.addQ);
router.post('/admin/addQuestion', auth.adminLoggedin, admin.addQuestion);
//router.get(`/admin/start`, auth.adminLoggedin, admin.startTimer);
router.get(`/admin/end`, auth.adminLoggedin, admin.endTimer);
router.get('/admin/updateQ', auth.adminLoggedin, admin.updateQ);
router.post('/admin/updateQuestion', auth.adminLoggedin, admin.updateQuestion);

// password reset
router.get(`/forgotpassword`, auth.notLoggedIn, auth.renderForgotPassword);
router.post(`/forgotpassword`, auth.notLoggedIn, auth.sendMail);
router.get('/resetpassword/:tid/:token', auth.notLoggedIn, auth.renderResetPassword);
router.post(`/resetpassword`, auth.notLoggedIn, auth.resetPassword);

router.get('*', (req,res) => {
    res.render(`error404.ejs`);
})

module.exports = router;