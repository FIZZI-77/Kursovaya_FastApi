-- +goose Up
-- +goose StatementBegin


CREATE TABLE workers (
    user_profile_id UUID PRIMARY KEY ,
    specialty VARCHAR(250) NOT NULL 
);



-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

DROP TABLE workers CASCADE;
-- +goose StatementEnd
