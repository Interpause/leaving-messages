/// <reference types="vite/client" />

import {} from 'valtio'
declare module 'valtio' {
  function useSnapshot<T extends object>(p: T): T
}
