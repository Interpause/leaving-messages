/// <reference types="vite/client" />

import { Options } from 'valtio'
declare module 'valtio' {
  function useSnapshot<T extends object>(p: T): T
  function useSnapshot<T extends object>(p: T, o: Options): T
}
