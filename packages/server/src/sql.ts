import { Database, SQLQueryBindings } from 'bun:sqlite'

const db = new Database('db/mydb.sqlite', { create: true })
db.run('PRAGMA journal_mode = WAL;')
db.run(`CREATE TABLE IF NOT EXISTS docs (
  id STRING PRIMARY KEY,
  hidden BOOLEAN DEFAULT FALSE,
  ctime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  mtime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  dtime TIMESTAMP DEFAULT NULL
);`)
export { db }

interface Doc {
  id: string
  hidden: boolean
  ctime: string
  mtime: string
  dtime: string | null
}

const insertDocQuery = db.query('INSERT OR IGNORE INTO docs (id) VALUES (?);')

export function insertDoc(docId: string) {
  insertDocQuery.run(docId)
}

const setDocHiddenQuery = db.query('UPDATE docs SET hidden = ? WHERE id = ?;')

export function setDocHidden(docId: string, hidden: boolean) {
  setDocHiddenQuery.run(hidden, docId)
}

const updateEditTimeQuery = db.query(
  'UPDATE docs SET mtime = CURRENT_TIMESTAMP WHERE id = ?;',
)

export function updateEditTime(docId: string) {
  updateEditTimeQuery.run(docId)
}

const listAllDocsQuery = db.query<Doc, SQLQueryBindings[]>(
  'SELECT * FROM docs;',
)

interface ListAllDocsOpts {
  filterHidden?: boolean
  filterShown?: boolean
  filterDeleted?: boolean
}

export function listAllDocs(opts: ListAllDocsOpts = {}) {
  const filterHidden = opts.filterHidden ?? true
  const filterShown = opts.filterShown ?? false
  const filterDeleted = opts.filterDeleted ?? true
  return listAllDocsQuery
    .all()
    .filter((row) => (filterHidden ? !row.hidden : true))
    .filter((row) => (filterShown ? row.hidden : true))
    .filter((row) => (filterDeleted ? !row.dtime : true))
}

const delDocQuery = db.query(
  'UPDATE docs SET dtime = CURRENT_TIMESTAMP WHERE id = ?;',
)

export function delDoc(docId: string) {
  delDocQuery.run(docId)
}
