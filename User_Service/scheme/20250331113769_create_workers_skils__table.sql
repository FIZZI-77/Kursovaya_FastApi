-- +goose Up
-- +goose StatementBegin


CREATE TABLE workers_skills (
    worker_id UUID NOT NULL ,
    skill_id INTEGER NOT NULL,
    PRIMARY KEY (worker_id, skill_id)

);



-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

DROP TABLE workers_skills CASCADE;
-- +goose StatementEnd
