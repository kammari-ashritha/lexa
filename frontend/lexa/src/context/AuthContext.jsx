import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null)
  const [token, setToken]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedToken = localStorage.getItem('lexa_token')
    const savedUser  = localStorage.getItem('lexa_user')
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const login = (newToken, newUser) => {
    setToken(newToken)
    setUser(newUser)
    localStorage.setItem('lexa_token', newToken)
    localStorage.setItem('lexa_user', JSON.stringify(newUser))
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('lexa_token')
    localStorage.removeItem('lexa_user')
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)