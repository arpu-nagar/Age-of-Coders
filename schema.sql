DROP TABLE IF EXISTS Teams;
create table Teams (
	tid INT(5) PRIMARY KEY NOT NULL AUTO_INCREMENT,
	name varchar(255),
	email varchar(255),
	username VARCHAR(20) NOT NULL UNIQUE,
	password VARCHAR(255),
	access INT(5),
	sess VARCHAR(255),
	score INT(20),
	email varchar(255)
);

DROP TABLE IF EXISTS Regions;
create table Regions (
	rid INT(10) PRIMARY KEY NOT NULL AUTO_INCREMENT,
	rname VARCHAR(255) NOT NULL ,
	rdesc VARCHAR(255)
);

DROP TABLE IF EXISTS Questions;
create table Questions (
	qid INT(5) primary key,
	rid INT(5) NOT NULL,
	title VARCHAR(50) NOT NULL,
	body TEXT NOT NULL,
	testcase1 TEXT NOT NULL,
	testcase2 TEXT NOT NULL,
	testcase3 TEXT NOT NULL,
	answer1 TEXT NOT NULL,
	answer2 TEXT NOT NULL,
	answer3 TEXT NOT NULL,
	points INT(11) NOT NULL,
	constraints TEXT NOT NULL,
	input_format TEXT NOT NULL,
	output_format TEXT NOT NULL,
	sample_input TEXT NOT NULL,
	sample_output TEXT NOT NULL,
	foreign key(rid) references Regions(rid)
);

DROP TABLE IF EXISTS Qlogs;
create table Qlogs (
	tid INT(5) NOT NULL,
	qid INT(5) NOT NULL,
	solved BOOLEAN NOT NULL,
	attempt_no INT(11) DEFAULT 0,
	answer VARCHAR(255),
	primary key(tid, qid, attempt_no),
	foreign key(tid) references Teams(tid),
	foreign key(qid) references Questions(qid)
);


DELIMITER $$

CREATE PROCEDURE test()
BEGIN

DECLARE regionLen INT;
DECLARE teamswscoreLen INT;

DECLARE regions
CURSOR FOR
	SELECT rid 
	FROM 'Regions';

DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

OPEN regions
regions_loop: LOOP

	DECLARE rid;
	FETCH NEXT FROM regions into rid;

	IF done THEN 
		LEAVE regions;
	ELSE
		show message 'hi';
	END IF;
END LOOP;
CLOSE regions;

END $$
DELIMITER ;

ALTER TABLE Teams MODIFY password VARCHAR(255);
ALTER TABLE Teams ADD email VARCHAR(255);
ALTER TABLE Teams ADD name VARCHAR(255);

select qid,title,testcase1,testcase2,testcase3,answer1,answer2,answer3 from Questions where rid = 5;