CREATE TABLE `battingStats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`memberId` int NOT NULL,
	`period` varchar(100),
	`games` int DEFAULT 0,
	`plateAppearances` int DEFAULT 0,
	`atBats` int DEFAULT 0,
	`runs` int DEFAULT 0,
	`hits` int DEFAULT 0,
	`singles` int DEFAULT 0,
	`doubles` int DEFAULT 0,
	`triples` int DEFAULT 0,
	`homeRuns` int DEFAULT 0,
	`totalBases` int DEFAULT 0,
	`rbis` int DEFAULT 0,
	`stolenBasesTotal` int DEFAULT 0,
	`stolenBases` int DEFAULT 0,
	`sacrificeBunts` int DEFAULT 0,
	`sacrificeFlies` int DEFAULT 0,
	`walks` int DEFAULT 0,
	`strikeouts` int DEFAULT 0,
	`errors` int DEFAULT 0,
	`battingAvg` decimal(4,3),
	`onBasePercentage` decimal(4,3),
	`sluggingPercentage` decimal(4,3),
	`ops` decimal(5,3),
	`vsLeftAtBats` int DEFAULT 0,
	`vsLeftHits` int DEFAULT 0,
	`vsLeftAvg` decimal(4,3),
	`vsRightAtBats` int DEFAULT 0,
	`vsRightHits` int DEFAULT 0,
	`vsRightAvg` decimal(4,3),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `battingStats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exitVelocity` (
	`id` int AUTO_INCREMENT NOT NULL,
	`memberId` int NOT NULL,
	`measureDate` date,
	`avgSpeed` decimal(5,1),
	`maxSpeed` decimal(5,1),
	`avgRank` int,
	`maxRank` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `exitVelocity_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gameResults` (
	`id` int AUTO_INCREMENT NOT NULL,
	`gameNumber` int,
	`gameDate` date NOT NULL,
	`opponent` varchar(200) NOT NULL,
	`result` enum('win','loss','draw','cancelled') NOT NULL,
	`homeAway` varchar(10),
	`teamScore` int,
	`opponentScore` int,
	`innings` varchar(20),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `gameResults_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `physicalMeasurements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`memberId` int NOT NULL,
	`measureDate` date NOT NULL,
	`category` enum('sprint_27m','bench_press','clean','deadlift') NOT NULL,
	`value` decimal(8,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `physicalMeasurements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pitchVelocity` (
	`id` int AUTO_INCREMENT NOT NULL,
	`memberId` int NOT NULL,
	`avgFastball` decimal(5,1),
	`avgBreaking` decimal(5,1),
	`maxFastball` decimal(5,1),
	`maxBreaking` decimal(5,1),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pitchVelocity_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pitchingStats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`memberId` int NOT NULL,
	`period` varchar(100),
	`games` int DEFAULT 0,
	`inningsPitched` varchar(20),
	`battersFaced` int DEFAULT 0,
	`hitsAllowed` int DEFAULT 0,
	`homeRunsAllowed` int DEFAULT 0,
	`walks` int DEFAULT 0,
	`strikeouts` int DEFAULT 0,
	`earnedRuns` int DEFAULT 0,
	`runsAllowed` int DEFAULT 0,
	`strikeoutRate` decimal(5,3),
	`era` decimal(5,2),
	`whip` decimal(5,3),
	`kPercentage` decimal(5,1),
	`bbPercentage` decimal(5,1),
	`firstStrikePercentage` decimal(5,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pitchingStats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pulldownVelocity` (
	`id` int AUTO_INCREMENT NOT NULL,
	`memberId` int NOT NULL,
	`measureDate` date,
	`avgSpeed` decimal(5,1),
	`maxSpeed` decimal(5,1),
	`avgRank` int,
	`maxRank` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pulldownVelocity_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teamStats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`period` varchar(100),
	`totalGames` int DEFAULT 0,
	`wins` int DEFAULT 0,
	`losses` int DEFAULT 0,
	`draws` int DEFAULT 0,
	`winRate` decimal(4,2),
	`teamBattingAvg` decimal(4,3),
	`teamSlugging` decimal(4,3),
	`teamOps` decimal(5,3),
	`teamEra` decimal(5,2),
	`teamWhip` decimal(5,3),
	`avgRunsScored` decimal(4,1),
	`avgRunsAllowed` decimal(4,1),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `teamStats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `schedules` MODIFY COLUMN `startTime` varchar(20);--> statement-breakpoint
ALTER TABLE `schedules` MODIFY COLUMN `endTime` varchar(20);--> statement-breakpoint
ALTER TABLE `members` ADD `classNumber` varchar(10);--> statement-breakpoint
ALTER TABLE `members` ADD `studentNumber` int;--> statement-breakpoint
ALTER TABLE `members` ADD `kana` varchar(100);--> statement-breakpoint
ALTER TABLE `schedules` ADD `uniform` varchar(50);--> statement-breakpoint
ALTER TABLE `battingStats` ADD CONSTRAINT `battingStats_memberId_members_id_fk` FOREIGN KEY (`memberId`) REFERENCES `members`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `exitVelocity` ADD CONSTRAINT `exitVelocity_memberId_members_id_fk` FOREIGN KEY (`memberId`) REFERENCES `members`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `physicalMeasurements` ADD CONSTRAINT `physicalMeasurements_memberId_members_id_fk` FOREIGN KEY (`memberId`) REFERENCES `members`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pitchVelocity` ADD CONSTRAINT `pitchVelocity_memberId_members_id_fk` FOREIGN KEY (`memberId`) REFERENCES `members`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pitchingStats` ADD CONSTRAINT `pitchingStats_memberId_members_id_fk` FOREIGN KEY (`memberId`) REFERENCES `members`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pulldownVelocity` ADD CONSTRAINT `pulldownVelocity_memberId_members_id_fk` FOREIGN KEY (`memberId`) REFERENCES `members`(`id`) ON DELETE no action ON UPDATE no action;