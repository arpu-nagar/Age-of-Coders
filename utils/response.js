module.exports = (req, res, next) => {
    res.sendError = (err, msg = 'Internal server error') => {
      err && console.log('[ERROR] ', err);
      res.send({ success: false, msg });
    };
    res.sendSuccess = (data, msg) => {
      let user = req.user;
      if(user) {
        user.password = undefined;
        delete user.password;
      }
      res.send({ success: true, msg, ...(data && { data }) });
    };
    next();
};