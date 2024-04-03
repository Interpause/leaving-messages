import Fuse from 'fuse.js'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Editor } from 'tldraw'
import 'tldraw/tldraw.css'
import { CustomEditor } from '../parts/Editor'
import { TlDisplay } from '../parts/Tlremote'
import { GlobalStateProvider, useGlobalState } from '../state'

interface EditProps {
  editHook: [boolean, (value: boolean) => void]
}

function TableHead() {
  return (
    <thead>
      <tr>
        <th>Edit</th>
        <th>Delete</th>
        <th>Id</th>
        <th>Preview</th>
      </tr>
    </thead>
  )
}

interface TableRowProps {
  docId: string
  deleteDoc: (docId: string) => void
  editDoc: (docId: string) => void
}

function TableRow({ docId, deleteDoc, editDoc }: TableRowProps) {
  const [display, setDisplay] = useState(false)
  return (
    <tr className='h-20'>
      <td>
        <button className='btn btn-ghost btn-lg' onClick={() => editDoc(docId)}>
          ✏️
        </button>
      </td>
      <td>
        <button
          className='btn btn-ghost btn-lg'
          onClick={() => deleteDoc(docId)}
        >
          🗑
        </button>
      </td>
      <td>{docId}</td>
      <td className='flex flex-row items-end justify-end'>
        {display ? (
          <TlDisplay
            className='h-96 cursor-pointer'
            docId={docId}
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
    </tr>
  )
}

interface TableProps extends EditProps {
  ids: string[]
  refresh: () => void
}

function Table({ ids, refresh, editHook }: TableProps) {
  const [, setEditing] = editHook
  const [snap, state] = useGlobalState()
  const [fuse, setFuse] = useState<Fuse<string>>()

  const deleteDoc = useCallback(
    (docId: string) => {
      fetch(`/api/v1/delete_doc?doc=${docId}`).then(() => {
        toast.success(`Deleted document: ${docId}`)
        refresh()
      })
    },
    [refresh],
  )

  const editDoc = useCallback(
    (docId: string) => {
      state.docId = docId
      snap.func.connect()
      // NOTE: We don't use then() here to ensure they can't spam the button.
      setEditing(true)
    },
    [setEditing, snap, state],
  )

  useEffect(() => setFuse(new Fuse(ids)), [ids])

  const found =
    (snap.docId ? fuse?.search(snap.docId).map(({ item }) => item) : ids) ?? ids

  return (
    <div className='overflow-auto mx-auto min-w-96'>
      <table className='table table-pin-rows'>
        <TableHead />
        <tbody>
          {found.map((id) => (
            <TableRow
              key={id}
              docId={id}
              deleteDoc={deleteDoc}
              editDoc={editDoc}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CtrlBar({ editHook }: EditProps) {
  const [editing, setEditing] = editHook
  const [ids, setIds] = useState<string[]>([])
  const [snap, state] = useGlobalState()

  const fetchIds = useCallback(() => {
    const promise = (async () => {
      const res = await fetch('/api/v1/list_doc')
      const { docs } = await res.json()
      setIds(docs)
    })()
    toast.promise(promise, {
      loading: 'Fetching document list...',
      success: 'Fetched document list!',
      error: (err) => `Failed to fetch: ${err.toString()}`,
    })
  }, [])

  useEffect(() => {
    !editing && fetchIds()
  }, [fetchIds, editing])

  const goEditMode = useCallback(() => {
    snap.func.connect()
    setEditing(true)
  }, [setEditing, snap.func])

  return (
    <div className='absolute inset-0 flex flex-col p-8'>
      <h3 className='text-2xl inset-x-0 mx-auto'>Control Panel</h3>
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
        <button onClick={goEditMode}>➕</button>
        <button onClick={fetchIds}>♻️</button>
      </div>
      <Table ids={ids} refresh={fetchIds} editHook={editHook} />
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
