import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
})

// Request interceptor
api.interceptors.request.use(
    (config) => {
        // Add any auth tokens here if needed
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// Response interceptor
api.interceptors.response.use(
    (response) => {
        return response
    },
    (error) => {
        if (error.response?.status === 429) {
            throw new Error('Too many requests. Please slow down.')
        }

        if (error.response?.status >= 500) {
            throw new Error('Server error. Please try again later.')
        }

        if (error.code === 'ECONNABORTED') {
            throw new Error('Request timeout. Please try again.')
        }

        throw error
    }
)

export const chatAPI = {
    // Send a chat message
    sendMessage: async (message, sessionId) => {
        const response = await api.post('/chat/message', {
            message,
            sessionId,
        })
        return response.data
    },

    // Send a streaming chat message
    sendStreamingMessage: async (message, sessionId, onChunk) => {
        const response = await fetch(`${API_BASE_URL}/chat/stream`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message, sessionId }),
        })

        if (!response.ok) {
            throw new Error('Failed to send message')
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()

        try {
            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                const chunk = decoder.decode(value)
                const lines = chunk.split('\n')

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6))
                            if (data.type === 'chunk' && onChunk) {
                                onChunk(data.chunk)
                            } else if (data.type === 'complete') {
                                return {
                                    success: true,
                                    data: {
                                        sessionId,
                                        response: '', // Will be built from chunks
                                        metadata: data.metadata,
                                        context: data.context,
                                    },
                                }
                            } else if (data.type === 'error') {
                                throw new Error(data.error)
                            }
                        } catch (parseError) {
                            console.warn('Failed to parse SSE data:', parseError)
                        }
                    }
                }
            }
        } finally {
            reader.releaseLock()
        }
    },

    // Get chat history
    getHistory: async (sessionId, limit = 50) => {
        const response = await api.get(`/chat/session/${sessionId}/history`, {
            params: { limit },
        })
        return response.data
    },

    // Clear session
    clearSession: async (sessionId) => {
        const response = await api.delete(`/chat/session/${sessionId}`)
        return response.data
    },

    // Get all sessions
    getSessions: async () => {
        const response = await api.get('/chat/sessions')
        return response.data
    },
}

export const healthAPI = {
    // Health check
    check: async () => {
        const response = await api.get('/health')
        return response.data
    },

    // Readiness check
    ready: async () => {
        const response = await api.get('/health/ready')
        return response.data
    },

    // Liveness check
    live: async () => {
        const response = await api.get('/health/live')
        return response.data
    },
}

export default api
