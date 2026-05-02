-- +goose Up
-- +goose StatementBegin


CREATE TABLE user_profile(
    id UUID PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'contractor', 'admin', 'superadmin')),
    is_banned BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);



-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

DROP TABLE user_profile CASCADE;
-- +goose StatementEnd
