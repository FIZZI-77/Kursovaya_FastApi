-- +goose Up
-- +goose StatementBegin

-- Создаём функцию триггера
CREATE OR REPLACE FUNCTION sync_role_to_users()
    RETURNS TRIGGER AS $$
BEGIN
    -- Обновляем роль в user_profile при изменении или вставке в users
    IF NEW.role IS DISTINCT FROM OLD.role THEN
        UPDATE users
        SET role = NEW.role
        WHERE user_ID = NEW.id;  -- Синхронизация по UUID
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Создаём триггер на таблицу users
CREATE TRIGGER trg_sync_role_profile
    AFTER INSERT OR UPDATE ON user_profile
    FOR EACH ROW
EXECUTE FUNCTION sync_role_to_users();

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

-- Удаляем триггер и функцию
DROP TRIGGER IF EXISTS trg_sync_role_profile ON user_profile;
DROP FUNCTION IF EXISTS sync_role_to_users();

-- +goose StatementEnd
