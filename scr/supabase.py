在 Supabase 中，通过 SQL 查询查看和修改用户数据（特别是 auth.users 表中的 raw_user_meta_data）是一种直接且灵活的方式。以下是详细步骤，专注于如何查看并修改 raw_user_meta_data：

---

前提条件
- 访问权限：需要使用 service_role 或超级用户权限，因为 auth.users 表默认受 Row Level Security (RLS) 保护，普通用户无法直接访问。
- 工具：可以通过 Supabase Dashboard 的 SQL 编辑器、CLI 的 psql，或任何支持 PostgreSQL 的客户端执行 SQL。
- 字段说明：raw_user_meta_data 是一个 jsonb 类型的列，用于存储用户自定义元数据（如 {"first_name": "John", "expiry_date": "2025-12-31"}）。

---

1. 查看 raw_user_meta_data
查询所有用户的元数据
```sql
SELECT id, email, raw_user_meta_data
FROM auth.users;
```
- 输出示例：
  ```
  id: "123e4567-e89b-12d3-a456-426614174000"
  email: "user@example.com"
  raw_user_meta_data: {"first_name": "John", "expiry_date": "2025-12-31"}
  ```

查询特定用户的元数据
```sql
SELECT raw_user_meta_data
FROM auth.users
WHERE email = 'user@example.com';
```

提取特定键值
使用 ->> 操作符提取 raw_user_meta_data 中的某个字段：
```sql
SELECT raw_user_meta_data->>'first_name' AS first_name,
       raw_user_meta_data->>'expiry_date' AS expiry_date
FROM auth.users
WHERE email = 'user@example.com';
```
- 输出示例：
  ```
  first_name: "John"
  expiry_date: "2025-12-31"
  ```

---

2. 修改 raw_user_meta_data
在 PostgreSQL 中，修改 jsonb 类型的数据可以使用 jsonb_build_object、jsonb_set 或直接替换整个 JSON 对象。以下是几种方法：

方法 1：更新单个字段
使用 jsonb_set 修改 raw_user_meta_data 中的某个键值，例如将 expiry_date 改为 "2026-12-31"：

```sql
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  raw_user_meta_data,
  '{expiry_date}',           -- 要修改的键
  '"2026-12-31"'::jsonb     -- 新值（注意字符串需加引号）
)
WHERE email = 'user@example.com';
```

- 验证：
  ```sql
  SELECT raw_user_meta_data
  FROM auth.users
  WHERE email = 'user@example.com';
  ```
  - 输出：{"first_name": "John", "expiry_date": "2026-12-31"}

方法 2：添加新字段
如果 raw_user_meta_data 中没有某个键，可以用 || 操作符添加新字段：

```sql
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"new_field": "value"}'::jsonb
WHERE email = 'user@example.com';
```

- 结果：如果原来是 {"first_name": "John"}，更新后变为 {"first_name": "John", "new_field": "value"}。

方法 3：替换整个 raw_user_meta_data
直接设置新的 JSON 对象：

```sql
UPDATE auth.users
SET raw_user_meta_data = '{"first_name": "John", "expiry_date": "2026-12-31", "role": "admin"}'::jsonb
WHERE email = 'user@example.com';
```

- 注意：这会覆盖原有的 raw_user_meta_data，确保包含所有需要的字段。

方法 4：批量修改
修改所有用户的某个字段，例如延长所有用户的有效期：

```sql
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  raw_user_meta_data,
  '{expiry_date}',
  '"2026-12-31"'::jsonb
);
```

---

3. 结合条件修改
根据现有值修改
例如，将 expiry_date 小于当前日期的用户更新为新日期：

```sql
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  raw_user_meta_data,
  '{expiry_date}',
  '"2026-12-31"'::jsonb
)
WHERE (raw_user_meta_data->>'expiry_date')::date < CURRENT_DATE;
```

检查并更新
如果某个键不存在，则添加：
```sql
UPDATE auth.users
SET raw_user_meta_data = 
  CASE 
    WHEN raw_user_meta_data ? 'expiry_date' THEN 
      jsonb_set(raw_user_meta_data, '{expiry_date}', '"2026-12-31"'::jsonb)
    ELSE 
      raw_user_meta_data || '{"expiry_date": "2026-12-31"}'::jsonb
  END
WHERE email = 'user@example.com';
```
- ? 操作符检查键是否存在。

---

4. 执行环境
在 Supabase Dashboard
1. 打开 Dashboard，进入 SQL Editor。
2. 输入上述 SQL 命令，点击 Run。
3. 检查结果。

通过 CLI
1. 连接本地数据库：
   ```bash
   supabase start
   psql postgresql://postgres:postgres@localhost:54322/postgres
   ```
2. 或连接远程数据库：
   - 获取连接字符串（Dashboard > Settings > Database）。
   - 示例：
     ```bash
     psql "postgresql://[user]:[password]@[host]:[port]/postgres"
     ```
3. 执行 SQL：
   ```sql
   UPDATE auth.users
   SET raw_user_meta_data = jsonb_set(raw_user_meta_data, '{expiry_date}', '"2026-12-31"'::jsonb)
   WHERE email = 'user@example.com';
   ```

---

5. 注意事项
- RLS 限制：
  - 默认情况下，auth.users 表只能由 service_role 或超级用户修改。如果在客户端运行 SQL，需使用 service_role 密钥：
    ```javascript
    const supabase = createClient('https://your-project.supabase.co', 'your-service-role-key');
    await supabase.rpc('execute_sql', { query: 'UPDATE auth.users SET raw_user_meta_data = ...' });
    ```
  - 或临时禁用 RLS（仅限开发环境）：
    ```sql
    ALTER TABLE auth.users DISABLE ROW LEVEL SECURITY;
    ```

- 数据类型：
  - jsonb_set 的值需为 JSON 格式：
    - 字符串：'"value"'::jsonb。
    - 数字：'123'::jsonb。
    - 布尔值：'true'::jsonb。

- 安全性：
  - 避免在客户端直接暴露 service_role 密钥，建议通过后端服务执行修改。

- 验证：
  - 修改后运行查询确认：
    ```sql
    SELECT raw_user_meta_data FROM auth.users WHERE email = 'user@example.com';
    ```

---

示例：完整修改流程
1. 查看用户数据：
   ```sql
   SELECT id, email, raw_user_meta_data FROM auth.users WHERE email = 'user@example.com';
   ```
   - 输出：{"first_name": "John", "expiry_date": "2025-12-31"}

2. 修改 expiry_date：
   ```sql
   UPDATE auth.users
   SET raw_user_meta_data = jsonb_set(raw_user_meta_data, '{expiry_date}', '"2026-12-31"'::jsonb)
   WHERE email = 'user@example.com';
   ```

3. 验证结果：
   ```sql
   SELECT raw_user_meta_data FROM auth.users WHERE email = 'user@example.com';
   ```
   - 输出：{"first_name": "John", "expiry_date": "2026-12-31"}

---

SQL Editor {
    SELECT * FROM auth.users;
    SELECT * FROM auth.users WHERE email = 'user@example.com';
    SELECT raw_user_meta_data FROM auth.users WHERE email = '';
}

CREATE POLICY "Allow anon read" ON storage.objects
FOR SELECT
TO anon
USING (bucket_id = 'config-bucket');
