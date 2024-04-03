import { Database, SQLQueryBindings } from 'bun:sqlite'

const db = new Database('db/mydb.sqlite', { create: true })
db.run('PRAGMA journal_mode = WAL;')
db.run(`CREATE TABLE IF NOT EXISTS docs (
  id STRING PRIMARY KEY
);`)
export { db }

interface Doc {
  id: string
}

const insertDocQuery = db.query('INSERT OR IGNORE INTO docs (id) VALUES (?);')

export function insertDoc(docId: string) {
  insertDocQuery.run(docId)
}

const listAllDocsQuery = db.query<Doc, SQLQueryBindings[]>(
  'SELECT * FROM docs;',
)

export function listAllDocs() {
  return listAllDocsQuery.all().map((row) => row.id)
}

const delDocQuery = db.query('DELETE FROM docs WHERE id = ?;')

export function delDoc(docId: string) {
  delDocQuery.run(docId)
}
