import Database from 'better-sqlite3';
const db = new Database('C:/Users/user/Desktop/files (8)/api/prisma/sqlite.db', { readonly: true });
const rows = db.prepare("SELECT 'Restaurant' as tableName, count(*) as count FROM Restaurant UNION ALL SELECT 'Category', count(*) FROM Category UNION ALL SELECT 'Product', count(*) FROM Product").all();
console.log(JSON.stringify(rows));
db.close();
