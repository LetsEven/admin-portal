'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useAdminPortalApi, type Restaurant, type UserWithRestaurant } from '../services/adminPortalApi'

// Updated Restaurant type to match backend
interface RestaurantWithUser extends Restaurant {
  // Additional properties can be added here if needed
}

interface RestaurantContextType {
  restaurant: Restaurant | null
  loading: boolean
  error: string | null
  refreshRestaurant: () => Promise<void>
  updateRestaurant: (data: Partial<Restaurant>) => Promise<void>
  createRestaurant: (data: { name: string; description?: string }) => Promise<void>
  syncUser: () => Promise<void>
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined)

export function useRestaurant() {
  const context = useContext(RestaurantContext)
  if (context === undefined) {
    throw new Error('useRestaurant must be used within a RestaurantProvider')
  }
  return context
}

interface RestaurantProviderProps {
  children: React.ReactNode
}

export function RestaurantProvider({ children }: RestaurantProviderProps) {
  const { user, isLoaded } = useUser()
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const adminPortalApi = useAdminPortalApi()

  const syncUser = async () => {
    if (!user) return

    try {
      console.log('🔍 Syncing user with backend:', user.id)

      const clerkUserData = {
        id: user.id,
        email_addresses: user.emailAddresses,
        first_name: user.firstName,
        last_name: user.lastName,
        phone_numbers: user.phoneNumbers
      }

      const userWithRestaurant = await adminPortalApi.syncUserFromClerk(clerkUserData)
      console.log('✅ User synced successfully:', userWithRestaurant)

      if (userWithRestaurant.restaurant) {
        setRestaurant(userWithRestaurant.restaurant)
      }
    } catch (err) {
      console.error('❌ Error syncing user:', err)
      // Don't set error for sync issues, continue with manual loading
    }
  }

  const refreshRestaurant = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      console.log('🔍 Loading restaurant for user:', user.id)

      try {
        // Try to get current user with restaurant from backend
        const userWithRestaurant = await adminPortalApi.getCurrentUser()

        if (userWithRestaurant) {
          if (userWithRestaurant.restaurant) {
            setRestaurant(userWithRestaurant.restaurant)
          } else {
            console.log('ℹ️ User exists but has no restaurant - ready for restaurant setup')
            setRestaurant(null)
          }
        } else {
          // If no user found, try to sync user first
          await syncUser()
        }
      } catch (apiError) {
        console.log('⚠️ Backend not available, trying sync...', apiError)

        // If backend API fails, try to sync user which might create the restaurant
        try {
          await syncUser()
        } catch (syncError) {
          console.error('❌ Sync also failed:', syncError)
          // Fall back to localStorage for now
          const savedRestaurant = localStorage.getItem(`restaurant_${user.id}`)

          if (savedRestaurant) {
            setRestaurant(JSON.parse(savedRestaurant))
            console.log('📱 Restaurant loaded from localStorage fallback')
          } else {
            // No restaurant exists - user needs to create one
            console.log('ℹ️ No restaurant found - user needs to create one')
            setRestaurant(null)
          }
        }
      }
    } catch (err) {
      console.error('❌ Error loading restaurant:', err)
      setError(err instanceof Error ? err.message : 'Failed to load restaurant')
    } finally {
      setLoading(false)
    }
  }

  const createRestaurant = async (data: { name: string; description?: string }) => {
    if (!user) return

    try {
      setError(null)
      setLoading(true)

      console.log('🔍 Creating restaurant:', data)

      try {
        // Try to create via backend API first
        const newRestaurant = await adminPortalApi.createRestaurant(data)
        setRestaurant(newRestaurant)
        console.log('✅ Restaurant created via backend:', newRestaurant)

        // Update localStorage as backup
        localStorage.setItem(`restaurant_${user.id}`, JSON.stringify(newRestaurant))
      } catch (apiError) {
        console.log('⚠️ Backend creation failed, using localStorage fallback:', apiError)

        // Fallback to localStorage creation
        const newRestaurant: Restaurant = {
          id: Date.now(),
          user_id: 0, // Will be set by backend when synced
          name: data.name,
          description: data.description || 'Descripción de tu restaurante - agrega información sobre tu cocina, especialidades y ambiente',
          logo_url: '',
          banner_url: '',
          address: '',
          phone: '',
          email: '',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        setRestaurant(newRestaurant)
        localStorage.setItem(`restaurant_${user.id}`, JSON.stringify(newRestaurant))
        console.log('📱 Restaurant created via localStorage fallback')
      }
    } catch (err) {
      console.error('❌ Error creating restaurant:', err)
      setError(err instanceof Error ? err.message : 'Failed to create restaurant')
    } finally {
      setLoading(false)
    }
  }

  const updateRestaurant = async (data: Partial<Restaurant>) => {
    if (!restaurant) return

    try {
      setError(null)

      console.log('🔍 Updating restaurant:', data)

      try {
        // Try to update via backend API first
        const updatedRestaurant = await adminPortalApi.updateRestaurant(data)
        setRestaurant(updatedRestaurant)
        console.log('✅ Restaurant updated via backend:', updatedRestaurant)

        // Update localStorage as backup
        localStorage.setItem(`restaurant_${user?.id}`, JSON.stringify(updatedRestaurant))
      } catch (apiError) {
        console.log('⚠️ Backend update failed, using localStorage fallback:', apiError)

        // Fallback to localStorage update
        const updatedRestaurant = {
          ...restaurant,
          ...data,
          updated_at: new Date().toISOString()
        }

        setRestaurant(updatedRestaurant)
        localStorage.setItem(`restaurant_${user?.id}`, JSON.stringify(updatedRestaurant))
        console.log('📱 Restaurant updated via localStorage fallback')
      }
    } catch (err) {
      console.error('❌ Error updating restaurant:', err)
      setError(err instanceof Error ? err.message : 'Failed to update restaurant')
    }
  }

  useEffect(() => {
    if (isLoaded && user) {
      refreshRestaurant()
    }
  }, [isLoaded, user])

  const value: RestaurantContextType = {
    restaurant,
    loading,
    error,
    refreshRestaurant,
    updateRestaurant,
    createRestaurant,
    syncUser
  }

  return (
    <RestaurantContext.Provider value={value}>
      {children}
    </RestaurantContext.Provider>
  )
}