-- +goose Up
-- +goose StatementBegin
-- +goose NO TRANSACTION
CREATE INDEX idx_users_role ON user_profile(role);
CREATE INDEX idx_users_email ON user_profile(email);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
-- +goose NO TRANSACTION
DROP INDEX idx_users_role;
DROP INDEX idx_users_email;
-- +goose StatementEnd
