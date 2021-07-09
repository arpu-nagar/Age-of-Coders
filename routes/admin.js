const db = require('../config/conn');
const to = require('../utils/to');
var dateTime = require('node-datetime');

let exp = {};

exp.addQ = (req, res, next) => {
    return res.render('addQ');
}

exp.updateQ = (req, res, next) => {
    return res.render(`updateQ`);
} 

exp.addQuestion = async (req, res) => {
    let err, result;
    let arr = {};
    arr["qid"] = req.body.qid;
    arr["rid"] = req.body.rid;
    arr["title"] = req.body.title.trim();
    arr["body"] = req.body.body.trim();
    arr["testcase1"] = req.body.testcase1.trim();
    arr["testcase2"] = req.body.testcase2.trim();
    arr["testcase3"] = req.body.testcase3.trim();
    arr["answer1"] = req.body.answer1.trim();
    arr["answer2"] = req.body.answer2.trim();
    arr["answer3"] = req.body.answer3.trim();
    arr["points"] = req.body.points;
    arr["constraints"] = req.body.constraints.trim();
    arr["input_format"] = req.body.input_format.trim();
    arr["output_format"] = req.body.output_format.trim();
    arr["sample_input"] = req.body.sample_input.trim();
    arr["sample_output"] = req.body.sample_output.trim();

    [err, result] = await to(db.query(`INSERT INTO Questions SET ?`, [arr]));
    if (err) return res.sendError(err);
    return res.sendSuccess("Question inserted");
};

exp.updateQuestion = async (req, res) => {
    const {field, data, qid} = req.body;
    // console.log(req.body);
    [err, result] = await to(db.query(`update Questions set \`?\` =  ?  where qid = ?`, [field, data, qid]));
    if(err) {
        return res.sendError(err);
    } else {
        return res.sendSuccess("Question updated");
    }
}

// async function increment() {
//     [err, result] = await to(db.query(`UPDATE Teams SET score = score + 10 where tid = 11`));
// }

let count = 1;
exp.startTimer = (req, res) => {

    var interval = 10000;  // CHANGE AFTER TETSING

    var start = dateTime.create();
    startTime = start.format('Y-m-d H:M:S');
    start.offsetInHours(3);
    endTime=start.format('Y-m-d H:M:S');
    console.log("start time: ",startTime);
    // var hours = parseInt(startTime.substr(11, 2), 10); // gets hours of start time
    // // // legit -- adds two hours to startTime   YYYY-MM-DD HH:MM:SS
    // var str = ((hours + 2)%24).toString();
    // if(str.length === 1)
    //     str = '0' + str;
    // var endTime = startTime.substr(0, 11) + (hours + 2).toString() + startTime.substr(13, 6)


    // testing --adds 5 mins to startTime
    // var mins = parseInt(startTime.substr(14, 2), 10); // gets mins of start time
    // var str = (mins + 0).toString(); // OVERFLOW SHOULD BE CHECKED
    // if(str.length === 1)
    //     str = '0' + str;

    // if(flag === 0) {
    //     flag = 1;
    //     endTime = endTime.substr(0, 14) + str + endTime.substr(16, 3)
    // }


    console.log('End time:',endTime);
    if(startTime<=endTime){
    var refreshIntervalId = setInterval(async function increment() {
        var dt = dateTime.create();
        var formatted = dt.format('Y-m-d H:M:S');

        let err, regions;
        [err, regions] = await to(db.query(`SELECT * FROM Regions`));
        let holders = []
        //[err, result]= await to(db.query(`create view teamscores as select username, tid, sum(points) as tot_pt, rid from (select qid, tid, username from Qlogs natural join Teams where solved=1) as Q natural join (select qid, rid, points from Questions) as P group by tid, rid;`));
        for (i = 0; i < regions.length; i++) {

            let rid = regions[i].rid;
            [err, teamswscore] = await to(db.query(`select T1.tid, T1.username, T1.tot_pt from teamscores as T1 where T1.rid = ? and T1.tot_pt >= all(select tot_pt from teamscores where rid = ?)`, [rid, rid]));
            // console.log(teamswscore.length);
            if (teamswscore["tot_pt"] != 0 && teamswscore != null) {

                const points_per_interval = 1;
                let denom = teamswscore.length;
                if (denom > 0) {
                    let points_per_team = points_per_interval / denom;
                    // console.log(points_per_team);
                    for (j = 0; j < denom; j++) {
                        let tid = teamswscore[j].tid;
                        [err, result] = await to(db.query(`UPDATE Teams SET score = score + ? WHERE tid = ?`, [points_per_team, tid]));
                    }
                }
            }
        }

        console.log(count++, formatted);
        if (formatted >= endTime) {
            clearInterval(refreshIntervalId);
        }
    }, interval);
    }
    res.sendSuccess('Started timer');
}
exp.endTimer = (req,res) => {
    var past = '2015-01-01 00:00:00';
    var endT=dateTime.create(past);
    global.endTime = endT.format('Y-m-d H:M:S');
    res.sendSuccess('Contest ended')
}



module.exports = exp;