import { useState, useEffect, useCallback, useRef } from 'react'
import { chatAPI } from '../services/api'
import socketService from '../services/socket'
import toast from 'react-hot-toast'

export const useChat = () => {
    const [messages, setMessages] = useState([])
    const [sessionId, setSessionId] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isStreaming, setIsStreaming] = useState(false)
    const [streamingMessage, setStreamingMessage] = useState('')
    const [connectionStatus, setConnectionStatus] = useState('disconnected')

    const streamingRef = useRef(null)

    // Initialize socket connection
    useEffect(() => {
        const socket = socketService.connect()

        socket.on('connect', () => {
            setConnectionStatus('connected')
        })

        socket.on('disconnect', () => {
            setConnectionStatus('disconnected')
        })

        return () => {
            socketService.disconnect()
        }
    }, [])

    // Create new session
    const createSession = useCallback(async () => {
        try {
            const response = await chatAPI.sendMessage('Hello', null)
            setSessionId(response.data.sessionId)
            setMessages([{
                id: Date.now(),
                role: 'assistant',
                content: response.data.response,
                timestamp: new Date(),
                metadata: response.data.metadata,
            }])
            return response.data.sessionId
        } catch (error) {
            toast.error('Failed to create session')
            throw error
        }
    }, [])

    // Send message with regular API
    const sendMessage = useCallback(async (content) => {
        if (!content.trim()) return

        const userMessage = {
            id: Date.now(),
            role: 'user',
            content: content.trim(),
            timestamp: new Date(),
        }

        setMessages(prev => [...prev, userMessage])
        setIsLoading(true)

        try {
            const currentSessionId = sessionId || await createSession()

            const response = await chatAPI.sendMessage(content, currentSessionId)

            const assistantMessage = {
                id: Date.now() + 1,
                role: 'assistant',
                content: response.data.response,
                timestamp: new Date(),
                metadata: response.data.metadata,
            }

            setMessages(prev => [...prev, assistantMessage])

            if (!sessionId) {
                setSessionId(currentSessionId)
            }
        } catch (error) {
            toast.error(error.message || 'Failed to send message')
        } finally {
            setIsLoading(false)
        }
    }, [sessionId, createSession])

    // Send message with streaming
    const sendStreamingMessage = useCallback(async (content) => {
        if (!content.trim()) return

        const userMessage = {
            id: Date.now(),
            role: 'user',
            content: content.trim(),
            timestamp: new Date(),
        }

        setMessages(prev => [...prev, userMessage])
        setIsStreaming(true)
        setStreamingMessage('')

        try {
            const currentSessionId = sessionId || await createSession()

            // Create placeholder for streaming message
            const streamingMessageId = Date.now() + 1
            const streamingMessageObj = {
                id: streamingMessageId,
                role: 'assistant',
                content: '',
                timestamp: new Date(),
                isStreaming: true,
            }

            setMessages(prev => [...prev, streamingMessageObj])
            streamingRef.current = streamingMessageId

            await chatAPI.sendStreamingMessage(
                content,
                currentSessionId,
                (chunk) => {
                    setStreamingMessage(prev => prev + chunk)
                    setMessages(prev =>
                        prev.map(msg =>
                            msg.id === streamingMessageId
                                ? { ...msg, content: prev + chunk }
                                : msg
                        )
                    )
                }
            )

            // Finalize the message
            setMessages(prev =>
                prev.map(msg =>
                    msg.id === streamingMessageId
                        ? { ...msg, isStreaming: false }
                        : msg
                )
            )

            if (!sessionId) {
                setSessionId(currentSessionId)
            }
        } catch (error) {
            toast.error(error.message || 'Failed to send message')
            // Remove the streaming message on error
            setMessages(prev => prev.filter(msg => msg.id !== streamingRef.current))
        } finally {
            setIsStreaming(false)
            setStreamingMessage('')
            streamingRef.current = null
        }
    }, [sessionId, createSession])

    // Send message with socket
    const sendSocketMessage = useCallback(async (content) => {
        if (!content.trim()) return

        const userMessage = {
            id: Date.now(),
            role: 'user',
            content: content.trim(),
            timestamp: new Date(),
        }

        setMessages(prev => [...prev, userMessage])
        setIsStreaming(true)
        setStreamingMessage('')

        try {
            const currentSessionId = sessionId || await createSession()

            // Join session if using socket
            socketService.joinSession(currentSessionId)

            // Create placeholder for streaming message
            const streamingMessageId = Date.now() + 1
            const streamingMessageObj = {
                id: streamingMessageId,
                role: 'assistant',
                content: '',
                timestamp: new Date(),
                isStreaming: true,
            }

            setMessages(prev => [...prev, streamingMessageObj])
            streamingRef.current = streamingMessageId

            socketService.sendMessage(
                content,
                currentSessionId,
                (chunk) => {
                    setStreamingMessage(prev => prev + chunk)
                    setMessages(prev =>
                        prev.map(msg =>
                            msg.id === streamingMessageId
                                ? { ...msg, content: prev + chunk }
                                : msg
                        )
                    )
                },
                () => {
                    // Message complete
                    setMessages(prev =>
                        prev.map(msg =>
                            msg.id === streamingMessageId
                                ? { ...msg, isStreaming: false }
                                : msg
                        )
                    )
                    setIsStreaming(false)
                    setStreamingMessage('')
                    streamingRef.current = null
                },
                (error) => {
                    toast.error(error)
                    setMessages(prev => prev.filter(msg => msg.id !== streamingMessageId))
                    setIsStreaming(false)
                    setStreamingMessage('')
                    streamingRef.current = null
                }
            )

            if (!sessionId) {
                setSessionId(currentSessionId)
            }
        } catch (error) {
            toast.error(error.message || 'Failed to send message')
            setMessages(prev => prev.filter(msg => msg.id !== streamingRef.current))
            setIsStreaming(false)
            setStreamingMessage('')
            streamingRef.current = null
        }
    }, [sessionId, createSession])

    // Load chat history
    const loadHistory = useCallback(async (sessionIdToLoad) => {
        try {
            const response = await chatAPI.getHistory(sessionIdToLoad)
            setMessages(response.data.messages.map(msg => ({
                ...msg,
                timestamp: new Date(msg.timestamp),
            })))
            setSessionId(sessionIdToLoad)
        } catch (error) {
            toast.error('Failed to load chat history')
        }
    }, [])

    // Clear session
    const clearSession = useCallback(async () => {
        if (sessionId) {
            try {
                await chatAPI.clearSession(sessionId)
            } catch (error) {
                console.warn('Failed to clear session on server:', error)
            }
        }

        setMessages([])
        setSessionId(null)
        setIsLoading(false)
        setIsStreaming(false)
        setStreamingMessage('')
    }, [sessionId])

    // Get connection status
    const getConnectionStatus = useCallback(() => {
        return {
            status: connectionStatus,
            isConnected: connectionStatus === 'connected',
            isStreaming,
            isLoading,
        }
    }, [connectionStatus, isStreaming, isLoading])

    return {
        messages,
        sessionId,
        isLoading,
        isStreaming,
        streamingMessage,
        connectionStatus,
        sendMessage,
        sendStreamingMessage,
        sendSocketMessage,
        loadHistory,
        clearSession,
        createSession,
        getConnectionStatus,
    }
}
