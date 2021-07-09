const db = require('./conn');
const to = require('../utils/to');
const bcrypt=require('bcrypt');
const Strategy = require('passport-local').Strategy;
const dateTime = require("node-datetime");
module.exports = (passport) => {
  
  passport.serializeUser((User,done) => {
    return done(null,User.tid);
  });
  
  passport.deserializeUser( async(tid,done) => {
    let err,result;
    [err,result] = await to(db.query('select * from Teams  where tid = ?',[tid]));
    if (err) console.log(err);
    return done(null,result[0]);
  });
  //Local Strategy
  passport.use('local',new Strategy({
    usernameField: 'username',
    passwordField: 'pass',
    passReqToCallback: true
    },
    async (req, username, password, done) =>{
      let err,result;
      [err,result] = await to(db.query('select * from Teams where username = ?', [username]));
      if(err){
        return done(err);
      }
      if(result.length==0){
        return done('Invalid user credentials.', false);
      }
      let currTime = dateTime.create();
      currTime = currTime.format('Y-m-d H:M:S');
      // comment this out before actual contest
      // if(currTime<startTime){
      //   if(result[0].access === 1) {
      //     return done(`The app will only be accessible once the contest starts. If you haven't registered yet, please go to the registration page and do so. Thanks!`,false);
      //   }
      // }

      bcrypt.compare(password, result[0].password, async function(err, isMatch) {
        if (err) {
          throw err;
        } else if (!isMatch) {
          return done('Invalid user credentials.', false);
        } else {
          if(req.sessionID!==result[0].sess){
            [err, updatesess]=await to(db.query('update Teams set sess=? where tid=?',[req.sessionID,result[0].tid]))
          }
          return done(null,result[0]);
        }
      })
    }
  ));
}