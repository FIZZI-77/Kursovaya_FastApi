-- +goose Up
-- +goose StatementBegin


CREATE TABLE skills (
    id SERIAL PRIMARY KEY ,
    name TEXT NOT NULL UNIQUE
);



-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

DROP TABLE skills CASCADE;
-- +goose StatementEnd
