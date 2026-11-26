-- Demanda pausada não tem prazo: limpa o prazo das que já estão pausadas.
UPDATE `tasks` SET `due_date` = NULL, `due_period` = NULL WHERE `status` = 'paused' AND `due_date` IS NOT NULL;
