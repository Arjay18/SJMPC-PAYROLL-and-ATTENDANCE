import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import api, { setAuthToken } from './api.js'


const AuthContext = createContext(null)

export function useAuth(){
  return useContext(AuthContext)
}

export function AuthProvider({ children }){
  const [user, setUser] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if(token){
      setAuthToken(token)
      api.get('/auth/me').then(res => setUser(res.data)).catch(() => {
        localStorage.removeItem('token')
        setUser(null)
      })
    }
  }, [])

  const value = useMemo(() => ({
    user,
    login: async (email, password) => {
      const res = await api.post('/auth/login', { email, password })
      const token = res.data.token
      localStorage.setItem('token', token)
      setAuthToken(token)
      setUser(res.data.user)
      return res.data
    },
    logout: () => {
      localStorage.removeItem('token')
      setAuthToken(null)
      setUser(null)
    }
  }), [user])

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  )
}

