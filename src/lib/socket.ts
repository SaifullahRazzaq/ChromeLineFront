import { io, type Socket } from 'socket.io-client'
import { tokenStore } from './api'

let socket: Socket | null = null

export function connectSocket() {
  const token = tokenStore.get()
  if (!token) return null
  socket?.disconnect()
  socket = io(import.meta.env.VITE_API_URL || undefined, { auth: { token }, transports: ['websocket', 'polling'], reconnectionAttempts: 3 })
  return socket
}

export const getSocket = () => socket
export function disconnectSocket() {
  socket?.disconnect()
  socket = null
}
