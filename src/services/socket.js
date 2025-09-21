import { io } from 'socket.io-client'

class SocketService {
    constructor() {
        this.socket = null
        this.isConnected = false
        this.reconnectAttempts = 0
        this.maxReconnectAttempts = 5
        this.reconnectDelay = 1000
    }

    connect() {
        if (this.socket?.connected) {
            return this.socket
        }

        const serverUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001'

        this.socket = io(serverUrl, {
            transports: ['websocket', 'polling'],
            timeout: 20000,
            forceNew: true,
        })

        this.socket.on('connect', () => {
            console.log('Socket connected:', this.socket.id)
            this.isConnected = true
            this.reconnectAttempts = 0
        })

        this.socket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason)
            this.isConnected = false
        })

        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error)
            this.isConnected = false
            this.handleReconnect()
        })

        this.socket.on('reconnect', (attemptNumber) => {
            console.log('Socket reconnected after', attemptNumber, 'attempts')
            this.isConnected = true
            this.reconnectAttempts = 0
        })

        this.socket.on('reconnect_error', (error) => {
            console.error('Socket reconnection error:', error)
            this.handleReconnect()
        })

        this.socket.on('reconnect_failed', () => {
            console.error('Socket reconnection failed')
            this.isConnected = false
        })

        return this.socket
    }

    handleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)

            console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`)

            setTimeout(() => {
                if (!this.isConnected) {
                    this.socket?.connect()
                }
            }, delay)
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect()
            this.socket = null
            this.isConnected = false
        }
    }

    joinSession(sessionId) {
        if (this.socket?.connected) {
            this.socket.emit('join-session', sessionId)
        }
    }

    sendMessage(message, sessionId, onChunk, onComplete, onError) {
        if (!this.socket?.connected) {
            onError?.('Not connected to server')
            return
        }

        // Set up event listeners
        this.socket.on('chunk', (data) => {
            if (data.sessionId === sessionId) {
                onChunk?.(data.chunk)
            }
        })

        this.socket.on('response-complete', (data) => {
            if (data.sessionId === sessionId) {
                onComplete?.()
            }
        })

        this.socket.on('error', (data) => {
            onError?.(data.message)
        })

        // Send the message
        this.socket.emit('chat-message', { message, sessionId })
    }

    on(event, callback) {
        this.socket?.on(event, callback)
    }

    off(event, callback) {
        this.socket?.off(event, callback)
    }

    emit(event, data) {
        this.socket?.emit(event, data)
    }
}

export default new SocketService()
