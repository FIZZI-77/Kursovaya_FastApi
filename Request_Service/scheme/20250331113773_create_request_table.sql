
-- +goose Up
-- +goose StatementBegin

CREATE TABLE requests (
                          id UUID PRIMARY KEY,
                          user_id UUID NOT NULL,
                          worker_id UUID DEFAULT NULL,
                          category VARCHAR(100) NOT NULL,
                          description TEXT NOT NULL,
                          address TEXT NOT NULL,
                          priority VARCHAR(50) NOT NULL,
                          status VARCHAR(50) NOT NULL,
                          photos TEXT[],
                          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);


-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

DROP TABLE requests CASCADE;

-- +goose StatementEnd