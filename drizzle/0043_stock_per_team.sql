-- Estoque da Copa por time: cada item e cada pedido da Copa pertence a um time.
ALTER TABLE `items` ADD `team_id` integer REFERENCES teams(id) ON DELETE set null;--> statement-breakpoint
ALTER TABLE `copa_requests` ADD `team_id` integer REFERENCES teams(id) ON DELETE set null;--> statement-breakpoint
-- O estoque que já existia é do Suporte.
UPDATE `items` SET `team_id` = (SELECT `id` FROM `teams` WHERE lower(`name`) LIKE 'suporte%' ORDER BY `id` LIMIT 1);--> statement-breakpoint
UPDATE `copa_requests` SET `team_id` = (SELECT `id` FROM `teams` WHERE lower(`name`) LIKE 'suporte%' ORDER BY `id` LIMIT 1);--> statement-breakpoint
-- O mesmo código de barras pode existir no estoque de cada time.
DROP INDEX IF EXISTS `items_scan_code_unique`;--> statement-breakpoint
CREATE UNIQUE INDEX `items_team_scan_code_unique` ON `items` (`team_id`,`scan_code`);--> statement-breakpoint
CREATE INDEX `items_team_idx` ON `items` (`team_id`);
