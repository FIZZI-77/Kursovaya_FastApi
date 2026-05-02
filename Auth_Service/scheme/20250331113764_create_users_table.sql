-- +goose Up
-- +goose StatementBegin

CREATE TABLE users(
    user_ID UUID PRIMARY KEY,
    name VARCHAR(250) NOT NULL ,
    email VARCHAR(250) NOT NULL,
    password VARCHAR(250),
    role varchar(250),
    emailVerified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT now(),
    update_at TIMESTAMP DEFAULT now()
)

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

DROP TABLE users CASCADE;
-- +goose StatementEnd


