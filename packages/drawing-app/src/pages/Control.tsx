import Fuse from 'fuse.js'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Editor } from 'tldraw'
import 'tldraw/tldraw.css'
import api, { Doc } from '../api'
import { CustomEditor } from '../parts/Editor'
import { TlDisplay } from '../parts/Tlremote'
import { GlobalStateProvider, useGlobalState } from '../state'

import 'sortable-tablesort/sortable-base.min.css'
import 'sortable-tablesort/sortable.min.js'

interface EditProps {
  editHook: [boolean, (value: boolean) => void]
}

function TableHead() {
  return (
    <thead>
      <tr>
        <th>Id</th>
        <th className='no-sort'>Preview</th>
        <th className='no-sort'>Edit</th>
        <th className='no-sort'>Hide</th>
        <th className='no-sort'>Delete</th>
        <th>Created</th>
        <th>Modified</th>
        <th>Deleted</th>
      </tr>
    </thead>
  )
}

interface TableRowProps {
  doc: Doc
  deleteDoc: (doc: Doc) => void
  editDoc: (doc: Doc) => void
  hideDoc: (doc: Doc) => void
}

function TableRow({ doc, deleteDoc, editDoc, hideDoc }: TableRowProps) {
  const [display, setDisplay] = useState(false)
  return (
    <tr className='h-20'>
      <td>{doc.id}</td>
      <td className='flex flex-row items-end justify-end'>
        {display ? (
          <TlDisplay
            className='h-96 cursor-pointer'
            docId={doc.id}
            onClick={() => setDisplay(false)}
          />
        ) : (
          <button
            className='btn btn-ghost btn-lg'
            onClick={() => setDisplay(true)}
          >
            🖼️
          </button>
        )}
      </td>
      <td>
        <button className='btn btn-ghost btn-lg' onClick={() => editDoc(doc)}>
          ✏️
        </button>
      </td>
      <td>
        <input
          type='checkbox'
          onChange={() => hideDoc(doc)}
          checked={doc.hidden}
        />
      </td>
      <td>
        <button className='btn btn-ghost btn-lg' onClick={() => deleteDoc(doc)}>
          🗑
        </button>
      </td>
      <td>{doc.ctime}</td>
      <td>{doc.mtime}</td>
      <td>{doc.dtime}</td>
    </tr>
  )
}

interface TableProps extends EditProps {
  docs: Doc[]
  refresh: () => void
}

function Table({ docs, refresh, editHook }: TableProps) {
  const [, setEditing] = editHook
  const [snap, state] = useGlobalState()
  const [fuse, setFuse] = useState<Fuse<Doc>>()

  const deleteDoc = useCallback(
    (doc: Doc) => {
      api
        .deleteDoc(doc.id)
        .then(refresh)
        .then(() => {
          toast.dismiss()
          toast.success(`Deleted document: ${doc}`)
        })
        .catch((err) =>
          toast.error(`Failed to delete document: ${err.toString()}`),
        )
    },
    [refresh],
  )

  const editDoc = useCallback(
    (doc: Doc) => {
      state.docId = doc.id
      snap.func.connect()
      // NOTE: We don't use then() here to ensure they can't spam the button.
      setEditing(true)
    },
    [setEditing, snap, state],
  )

  const hideDoc = useCallback(
    (doc: Doc) => {
      api
        .setDocHidden(doc.id, !doc.hidden)
        .then(refresh)
        .then(() => {
          toast.dismiss()
          toast.success(`${doc.hidden ? 'Unhid' : 'Hid'} document: ${doc.id}`)
        })
        .catch((err) =>
          toast.error(`Failed to hide document: ${err.toString()}`),
        )
    },
    [refresh],
  )

  useEffect(() => setFuse(new Fuse(docs, { keys: ['id', 'mtime'] })), [docs])

  const found =
    (snap.docId ? fuse?.search(snap.docId).map(({ item }) => item) : docs) ??
    docs

  return (
    <div className='overflow-auto mx-auto w-full md:max-w-prose'>
      <table className='table table-pin-rows text-center sortable'>
        <TableHead />
        <tbody>
          {found.map((doc) => (
            <TableRow
              key={doc.id}
              doc={doc}
              deleteDoc={deleteDoc}
              editDoc={editDoc}
              hideDoc={hideDoc}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CtrlBar({ editHook }: EditProps) {
  const [editing, setEditing] = editHook
  const [docs, setDocs] = useState<Doc[]>([])
  const [snap, state] = useGlobalState()

  const fetchDocs = useCallback(() => {
    const promise = (async () => {
      const { docs } = await api.listDocs({ filterHidden: false })
      setDocs(docs)
    })()
    return toast.promise(promise, {
      loading: 'Fetching document list...',
      success: 'Fetched document list!',
      error: (err) => `Failed to fetch: ${err.toString()}`,
    })
  }, [])

  useEffect(() => {
    !editing && fetchDocs()
  }, [fetchDocs, editing])

  const goEditMode = useCallback(() => {
    snap.func.connect()
    setEditing(true)
  }, [setEditing, snap.func])

  return (
    <div className='absolute inset-0 flex flex-col'>
      <h3 className='text-2xl inset-x-0 pt-8 mx-auto'>Control Panel</h3>
      <div className='text-center'>
        <input
          type='text'
          className='mr-2'
          value={snap.docId ?? ''}
          placeholder={snap.active.docId ?? 'Enter docId...'}
          onChange={(e) => (state.docId = e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && goEditMode()}
          onFocus={() => (state.docId = '')}
        />
        <button className='btn btn-ghost btn-lg p-0' onClick={goEditMode}>
          +
        </button>
        <br />
        <button onClick={fetchDocs}>♻️</button>
      </div>
      <Table docs={docs} refresh={fetchDocs} editHook={editHook} />
    </div>
  )
}

function ControlPageInternal() {
  const [editor, setEditor] = useState<Editor>()
  const [editing, setEditing] = useState(false)

  return (
    <div className='fixed inset-0 overflow-hidden flex flex-col'>
      <div className={editing ? 'hidden' : ''}>
        <CtrlBar editHook={[editing, setEditing]} />
      </div>
      <div className={editing ? '' : 'hidden'}>
        <CustomEditor
          editorHook={[editor, setEditor]}
          editHook={[editing, setEditing]}
          fullMode
        />
      </div>
    </div>
  )
}

export default function ControlPage() {
  return (
    <GlobalStateProvider isMain>
      <ControlPageInternal />
    </GlobalStateProvider>
  )
}
