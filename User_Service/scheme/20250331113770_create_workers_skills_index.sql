-- +goose Up
-- +goose StatementBegin
-- +goose NO TRANSACTION

CREATE INDEX idx_worker_skills_worker_id ON workers_skills(worker_id);
CREATE INDEX idx_worker_skills_skill_id ON workers_skills(skill_id);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
-- +goose NO TRANSACTION

DROP INDEX idx_worker_skills_worker_id;
DROP INDEX idx_worker_skills_skill_id;
-- +goose StatementEnd
