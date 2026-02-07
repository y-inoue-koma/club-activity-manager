CREATE TABLE `absences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`memberId` int NOT NULL,
	`scheduleId` int,
	`absenceDate` date NOT NULL,
	`reason` text,
	`status` enum('pending','approved','noted') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `absences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`name` varchar(100) NOT NULL,
	`grade` enum('1','2','3') NOT NULL,
	`position` varchar(50),
	`uniformNumber` int,
	`memberRole` enum('player','manager','coach') NOT NULL DEFAULT 'player',
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `playerRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`memberId` int NOT NULL,
	`recordDate` date NOT NULL,
	`atBats` int DEFAULT 0,
	`hits` int DEFAULT 0,
	`doubles` int DEFAULT 0,
	`triples` int DEFAULT 0,
	`homeRuns` int DEFAULT 0,
	`rbis` int DEFAULT 0,
	`runs` int DEFAULT 0,
	`strikeouts` int DEFAULT 0,
	`walks` int DEFAULT 0,
	`stolenBases` int DEFAULT 0,
	`inningsPitched` decimal(5,1) DEFAULT '0',
	`earnedRuns` int DEFAULT 0,
	`pitchStrikeouts` int DEFAULT 0,
	`pitchWalks` int DEFAULT 0,
	`hitsAllowed` int DEFAULT 0,
	`wins` int DEFAULT 0,
	`losses` int DEFAULT 0,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `playerRecords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `practiceMenus` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scheduleId` int,
	`category` enum('batting','fielding','pitching','running','conditioning','other') NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text,
	`duration` int,
	`targetGroup` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `practiceMenus_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `schedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text,
	`eventType` enum('practice','game','meeting','other') NOT NULL DEFAULT 'practice',
	`eventDate` date NOT NULL,
	`startTime` varchar(5) NOT NULL,
	`endTime` varchar(5),
	`location` varchar(200),
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `schedules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `absences` ADD CONSTRAINT `absences_memberId_members_id_fk` FOREIGN KEY (`memberId`) REFERENCES `members`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `absences` ADD CONSTRAINT `absences_scheduleId_schedules_id_fk` FOREIGN KEY (`scheduleId`) REFERENCES `schedules`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `members` ADD CONSTRAINT `members_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `playerRecords` ADD CONSTRAINT `playerRecords_memberId_members_id_fk` FOREIGN KEY (`memberId`) REFERENCES `members`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `practiceMenus` ADD CONSTRAINT `practiceMenus_scheduleId_schedules_id_fk` FOREIGN KEY (`scheduleId`) REFERENCES `schedules`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `schedules` ADD CONSTRAINT `schedules_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;