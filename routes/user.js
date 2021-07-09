const db = require('../config/conn');
const to = require('../utils/to');
const dateTime = require("node-datetime");
const passport = require("passport");
let exp = {};

//code for api routing
exp.sendData = async(req, res) => {
    let rid = req.params.rid;
    let tid = req.user.tid;
    let err, error, region, qids;

    [err, qids] = await to(db.query(`SELECT * FROM Questions WHERE rid = ?`, [rid]));
    [error, region] = await to(db.query(`SELECT * FROM Regions WHERE rid = ?`, [rid]));

    if (err || error) {
        res.sendError(null, `Couldn't load questions for this region`);
    } else {

        let questions = [];
        for (i = 0; i < qids.length; i++) {
            let qid = qids[i].qid;
            [err, info] = await to(db.query(` select COALESCE(max(attempt_no), 0) AS attempts, COALESCE( max(solved), 0) as solved from Qlogs where qid = ? and tid = ?`, [qid, tid]));
            if (err) {
                res.sendError(null, `Error in loading question info`);
            } else {
                questions.push({
                    qid,
                    title: qids[i].title,
                    body: qids[i].body,
                    constraints: qids[i].constraints,
                    input_format: qids[i].input_format,
                    output_format: qids[i].output_format,
                    sample_input: qids[i].sample_input,
                    sample_output: qids[i].sample_output,
                    points: qids[i].points,
                    tc1: qids[i].testcase1,
                    tc2: qids[i].testcase2,
                    tc3: qids[i].testcase3,
                    attempts: info[0].attempts,
                    testcase1: qids[i].testcase1,
                    testcase2: qids[i].testcase2,
                    testcase3: qids[i].testcase3,
                    solved: info[0].solved
                })
            }
        }
        [err, holdersinfo] = await to(db.query(`select T1.tid, T1.username, T1.tot_pt from teamscores as T1 where T1.rid = ? and T1.tot_pt >= all(select tot_pt from teamscores where rid = ?)`, [rid, rid]));
        let holderspts;
        if(holdersinfo.length===0){
            holderspts=0;
        }
        else{
            holderspts=holdersinfo[0].tot_pt;
        }
        [err, userpt]=await to(db.query('select tot_pt from teamscores where rid=? and tid=?',[rid,tid]));
        let userpoints;
        if(userpt.length===0){
            userpoints=0;
        }
        else{
            userpoints=userpt[0].tot_pt;
        }
        res.send({
            user: req.user,
            questions: questions,
            region: region[0],
            holders:holdersinfo,
            holderspts: holderspts,
            userpt:userpoints
        })
    }
}


exp.showRegions = async(req, res) => {
    let err1, regions;
    [err1, regions] = await to(db.query(`SELECT * FROM Regions`));
    // [err2, teams] = await to(db.query(`SELECT * FROM Teams`));

    let holders = []
        //[err, result]= await to(db.query(`create view teamscores as select username, tid, sum(points) as tot_pt, rid from (select qid, tid, username from Qlogs natural join Teams where solved=1) as Q natural join (select qid, rid, points from Questions) as P group by tid, rid;`));
    for (i = 0; i < regions.length; i++) {

        let rid = regions[i].rid;
        [err, teamswscore] = await to(db.query(`select T1.tid, T1.username, T1.tot_pt from teamscores as T1 where T1.rid = ? and T1.tot_pt >= all(select tot_pt from teamscores where rid = ?)`, [rid, rid]));
        // console.log(teamswscore)
        if (teamswscore["tot_pt"] != 0 && teamswscore != null) {
            holders.push({
                rid: rid,
                holdersArray: teamswscore
            });
        }
    }
    //console.log(req.user)
    // console.log(holders)
    let sent= req.user;
    return res.render('landing-final',{
        user: sent,
        regions: regions,
        holders
    })

}

exp.showRules = async(req, res) => {
    if(req.isAuthenticated())
    res.render('rules',{showcontinue:true});
    else
    res.render('rules',{showcontinue:false});
}

exp.showLeaderboard = async(req, res) => {
    [err, result] = await to(db.query(`SELECT username, score FROM Teams where access = 1 ORDER BY score desc`));
    if (err) {
        return res.sendError(err);
    } else {
        let r = 1;
        result[0].rank = 1;
        for (let i = 1; i < result.length; i++) {
            if (result[i].score != result[i - 1].score)
                r++;

            result[i].rank = r;
        }
        // console.log(result);
    }

    res.render('leaderboard',{result});
}
exp.ContestEnd = async(req,res) => {
    let curr = dateTime.create();
    let currTime = curr.format('Y-m-d H:M:S');
    let contestend;
    if(currTime>=endTime){
        contestend=true;
    }
    else{
        contestend=false;
    }
    res.send({contestend});
}
exp.showRegionByID = async(req, res) => {
    let rid = req.params.rid;
    let tid = req.user.tid;
    let err, error, region, qids;

    [err, qids] = await to(db.query(`SELECT qid, title, body, points, constraints, input_format, output_format, sample_input, sample_output FROM Questions WHERE rid = ?`, [rid]));
    [error, region] = await to(db.query(`SELECT * FROM Regions WHERE rid = ?`, [rid]));

    if (err || error) {
        res.sendError(null, `Couldn't load questions for this region`);
    } else {

        let questions = [];
        for (i = 0; i < qids.length; i++) {
            let qid = qids[i].qid;
            [err, info] = await to(db.query(` select COALESCE(max(attempt_no), 0) AS attempts, COALESCE( max(solved), 0) as solved from Qlogs where qid = ? and tid = ?`, [qid, tid]));
            if (err) {
                res.sendError(null, `Error in loading question`);
            } else {
                questions.push({
                    qid,
                    title: qids[i].title,
                    body: qids[i].body,
                    constraints: qids[i].constraints,
                    input_format: qids[i].input_format,
                    output_format: qids[i].output_format,
                    sample_input: qids[i].sample_input,
                    sample_output: qids[i].sample_output,
                    points: qids[i].points,
                    attempts: info[0].attempts,
                    solved: info[0].solved
                })
            }
        }
        [err, holdersinfo] = await to(db.query(`select T1.tid, T1.username, T1.tot_pt from teamscores as T1 where T1.rid = ? and T1.tot_pt >= all(select tot_pt from teamscores where rid = ?)`, [rid, rid]));
        let holderspts;
        if(holdersinfo.length===0){
            holderspts=0;
        }
        else{
            holderspts=holdersinfo[0].tot_pt;
        }
        [err, userpt]=await to(db.query('select tot_pt from teamscores where rid=? and tid=?',[rid,tid]));
        let userpoints;
        if(userpt.length===0){
            userpoints=0;
        }
        else{
            userpoints=userpt[0].tot_pt;
        }
        res.render('dashboard',{
            user: req.user,
            questions: questions,
            region: region[0],
            holders:holdersinfo,
            holderspts: holderspts,
            userpt:userpoints
        })
    }

}

function remove_linebreaks(str) {
    return str.replace(/\r\n|\n|\r/gm, '\n');
}

exp.submit = async(req, res) => {

    let ans = req.body.ans.trim();
    ans = remove_linebreaks(ans);
    // console.log(ans)
    let qid = req.params.qid;
    // console.log('QID: ',qid);    params undefine kyu aa raha hai
    // console.log('REQ: ',req.params);
    let solved = 0;
    let tid = req.user.tid;
    // console.log(qid);
    [err, result] = await to(db.query(`SELECT max(attempt_no) as attempts, max(solved) as solved from Qlogs where qid = ? and tid = ?`, [qid, tid]));
    [error, question] = await to(db.query(`SELECT * from Questions where qid = ?`, [qid]));
    // console.log('qid:',qid);
    if(result[0].attempts===3||result[0].solved===1){
        return res.send('Already solved/all attempts exhausted');
    }
    if (err || error) {
        res.sendError(null, 'Some error occured')
    } else {

        let data = result[0];
        let reqdAns;

        if (data.attempts == null) {
            reqdAns = question[0].answer1;
        } else if (data.attempts == 1) {
            reqdAns = question[0].answer2;
        } else if (data.attempts == 2) {
            reqdAns = question[0].answer3;
        }

        reqdAns = remove_linebreaks(reqdAns);

        if (ans === reqdAns) {
            // display correct message
            solved = 1;
            //[err, result1] = await to(db.query(`UPDATE Teams set score = score + ? where tid= ?`, [question[0].points, tid]));
            // if (err) {
            //     res.sendError(null, `Updation didn't happen`);
            // }

        }

        //[err, result2] = await to(db.query(`INSERT INTO Qlogs values(?,?,?,?,?)`, [tid, qid, solved, data.attempts + 1,ans]));
        // if (err) {
        //     res.sendError(null, 'Error in recording response')
        // }
        if(solved==1)
        res.send({
            msg: "Question success"
        })
        else
        res.send({
            msg: "Wrong submission"
        })
    }

}


module.exports = exp;