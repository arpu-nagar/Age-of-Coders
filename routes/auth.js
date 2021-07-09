const passport = require("passport");
var dateTime = require("node-datetime");
const fetch = require('node-fetch');
const { body, validationResult } = require("express-validator");
const to = require("../utils/to");
const db = require("../config/conn");
const bcrypt = require("bcrypt");
const request = require('request');
const secretKey='6LeEJfEUAAAAAB1FEdjHUPOJqW9FynMbskBcRfEr';
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const nodemailer = require("nodemailer");
const jwt = require("jwt-simple");

let exp = {};

exp.renderForgotPassword = (req, res) => {
  res.render("forgot-pass");
};

exp.sendMail = async (req, res) => {
  if (req.body.email === undefined) {
    return res.send(`E-mail id not found!`);
  } else {
    let emailid = req.body.email;
    [err, team] = await to(db.query(`SELECT * FROM Teams WHERE email = ?`, [emailid]));

    if (err) {
      console.log(err);
    } else if (team.length === 0) {
      return res.send(`Email id not found`);
    } else {
      var payload = {
        tid: team[0].tid,
        email: emailid
      };

      var secret = team[0].password; // using curr pass hash as secret so token is unique and one time use only
      var token = jwt.encode(payload, secret); // contains encoded info for authentication at reset-pass page

      let link = "https://aoc.iecsemanipal.com/resetpassword/" + payload.tid + "/" + token;

      const data = {
        'toEmail' : emailid,
        'name' : team[0].username,
        'link' : link
      }

      fetch(`https://mail.iecsemanipal.com/aoc/forgotpassword`, {
        method : 'POST',
        headers : {'Content-Type' : 'application/json', 'Authorization' : process.env.authKey},
        body : JSON.stringify(data)
      }).then(res => res.json()
      ).then(res => console.log(res)
      ).catch(err => console.log(err));

      return res.redirect("/login");
    }
  }
};

exp.renderResetPassword = async (req, res) => {
  let tid = req.params.tid;
  [err, result] = await to(
    db.query(`SELECT * FROM Teams WHERE tid = ?`, [tid])
  );

  // console.log(req.body);

  if (err || result.length === 0) {
    console.log("reset password page not rendering");
  } else {
    var secret = result[0].password;
    var payload = jwt.decode(req.params.token, secret); // if user is correct then secret is same and we get the same payload
    tid = payload.tid;
    res.render("reset-pass", {
      tid,
      token: req.params.token
    });
  }
};

exp.resetPassword = async (req, res) => {
  let tid = req.body.tid;
  [err, result] = await to(db.query(`SELECT * FROM Teams WHERE tid = ?`, [tid]));

  if (err) {
    console.log(err);
    return res.send(`Password couldn't be updated`);
  } else {
    
    let secret = result[0].password;
    let payload = jwt.decode(req.body.token, secret);

    let pass = req.body.pass;

    bcrypt.hash(pass, 10, async (err, hash) => {
      if (err) {
        return res.send("Error occured");
      }

      [err, result] = await to(
        db.query(`UPDATE Teams SET password = ? WHERE tid = ?`, [
          hash,
          payload.tid
        ])
      );
      if (err) {
        return res.sendError(err);
      } else {
        return res.send("Password changed successfully");
      }
    });
  }
};

exp.captchaVerify = async(req,res,next) => {
  if(!req.body.captcha){
    return res.send({msg:'Please click on captcha'});
  }
  const verifyUrl=`https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${req.body.captcha}&remoteip=${req.connection.remoteAddress}`;
  const body = await fetch(verifyUrl).then(res => res.json()).catch(err=>console.log(err));
  // If not successful
  if (body.success !== undefined && !body.success)
    return res.json({ success: false, msg: 'Failed captcha verification' });
  return next();
}

exp.login = async(req, res, next) => {
  passport.authenticate('local', function(err, user, info) {
    if (err) { return res.send({msg:err}) }
    if (!user) { return res.send({msg:err}); }
    req.logIn(user, function(err) {
      if (err) { return next(err); }
      return res.send({msg:"successful login"});
    });
  })(req, res, next);
};

exp.isLoggedIn = async (req, res, next) => {
  let dt = dateTime.create();
  let formatted = dt.format("Y-m-d H:M:S");
  // console.log(endTime);
  // if (formatted >= endTime) {
  //   return res.redirect("/leaderboard");
  // }
  // if (req.user) {
  //   [err, checksess] = await to(
  //     db.query("select sess from Teams where tid=?", [req.user.tid])
  //   );
  //   if (req.sessionID !== checksess[0].sess) {
  //     return res.redirect("/logout");
  //   }
  // }
  if (req.isAuthenticated()) return next();
  else return res.redirect("/login");
};

exp.notLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) return next();
  else return res.redirect("/regions");
};

exp.isOver

exp.register = async (req, res) => {
  // console.log(req.body);
  const { name, username, pass, email, phno, regno } = req.body;
  [error, result] = await to(
    db.query(`SELECT * FROM Teams WHERE username = ?`, [username])
  );
  if (result.length > 0) {
    return res.send({
      msg:"This username is already taken! Please try a different username.",
      success:false
    });
  }

  [error, result] = await to(
    db.query(`SELECT * FROM Teams WHERE email = ?`, [email])
  );
  if (result.length > 0) {
    return res.send({msg:"This email is already registered",success:false});
  }
  var tim = dateTime.create();
  currTime = tim.format('Y-m-d H:M:S');
  if(currTime>startTime){
    return res.send({
      msg:"Can't register since the contest has started",
      success:false
    })
  }

  bcrypt.hash(pass, 10, async (err, hash) => {
    if (err) {
      return res.send("Error occured :(");
    }

    [err, result] = await to(
      db.query(
        `INSERT INTO Teams(name, username, password, access, score,email, number, regno) VALUES(?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, username, hash, 1, 0, email, phno, regno]
      )
    );
    if (err || error) {
      return res.send({msg:err});
    } else {
      // res.send("Registered successfully");
      return res.send({msg:"Registered",success:true});
    }
  });
};

exp.renderLogin = (req, res, next) => {
  return res.render("login");
};

exp.renderRegiser = (req, res, next) => {
  return res.render("register");
};

exp.adminLoggedin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.access == 0) return next();
  else return res.redirect("/");
};

exp.logout = (req, res, next) => {
  req.logout();
  return res.redirect("/login");
};

module.exports = exp;
