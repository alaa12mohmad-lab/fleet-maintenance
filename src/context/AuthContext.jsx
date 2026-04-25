// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase/config'
import { getUserProfile } from '../firebase/firestore'
import { ADMIN_EMAIL, getAdminPermissions } from '../firebase/auth'

const AuthContext = createContext(null)

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user)
      if (user) {
        try {
          if (user.email === ADMIN_EMAIL) {
            setUserProfile({
              uid: user.uid,
              email: user.email,
              displayName: 'علاء - المدير',
              role: 'admin',
              isActive: true,
              permissions: getAdminPermissions(),
            })
          } else {
            const profile = await getUserProfile(user.uid)
            if (profile && profile.isActive) {
              setUserProfile(profile)
            } else {
              setUserProfile(null)
            }
          }
        } catch (err) {
          console.error('Error fetching user profile:', err)
          setUserProfile(null)
        }
      } else {
        setUserProfile(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  const isAdmin = userProfile?.role === 'admin' || currentUser?.email === ADMIN_EMAIL
  const hasPermission = (perm) => isAdmin || userProfile?.permissions?.[perm] === true

  const value = {
    currentUser,
    userProfile,
    loading,
    isAdmin,
    hasPermission,
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
