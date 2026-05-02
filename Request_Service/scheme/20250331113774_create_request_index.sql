
-- +goose Up
-- +goose StatementBegin

CREATE INDEX idx_requests_user_id ON requests(user_id);
CREATE INDEX idx_requests_worker_id ON requests(worker_id);
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_requests_priority ON requests(priority);
CREATE INDEX idx_requests_created_at ON requests(created_at);


-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

DROP INDEX idx_requests_user_id;
DROP INDEX idx_requests_worker_id;
DROP INDEX idx_requests_status;
DROP INDEX idx_requests_priority;
DROP INDEX idx_requests_created_at;

-- +goose StatementEnd