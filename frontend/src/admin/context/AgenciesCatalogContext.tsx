import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { MOCK_AGENCIES, type Agency } from '../partners/agencyModel'

type AgenciesCatalogValue = {
  agencies: Agency[]
  getAgencyById: (id: string) => Agency | undefined
  updateAgency: (a: Agency) => void
  addAgency: (a: Agency) => void
  removeAgency: (id: string) => void
}

const AgenciesCatalogContext = createContext<AgenciesCatalogValue | null>(null)

export function AgenciesCatalogProvider({ children }: { children: ReactNode }) {
  const [agencies, setAgencies] = useState<Agency[]>(() => [...MOCK_AGENCIES])

  const getAgencyById = useCallback(
    (id: string) => agencies.find((x) => x.id === id),
    [agencies],
  )

  const addAgency = useCallback((a: Agency) => {
    setAgencies((prev) => (prev.some((x) => x.id === a.id) ? prev : [a, ...prev]))
  }, [])

  const updateAgency = useCallback((a: Agency) => {
    setAgencies((prev) => prev.map((x) => (x.id === a.id ? a : x)))
  }, [])

  const removeAgency = useCallback((id: string) => {
    setAgencies((prev) => prev.filter((x) => x.id !== id))
  }, [])

  const value = useMemo(
    () => ({
      agencies,
      getAgencyById,
      addAgency,
      updateAgency,
      removeAgency,
    }),
    [agencies, getAgencyById, addAgency, updateAgency, removeAgency],
  )

  return (
    <AgenciesCatalogContext.Provider value={value}>
      {children}
    </AgenciesCatalogContext.Provider>
  )
}

export function useAgenciesCatalog(): AgenciesCatalogValue {
  const ctx = useContext(AgenciesCatalogContext)
  if (!ctx) {
    throw new Error('useAgenciesCatalog must be used within AgenciesCatalogProvider')
  }
  return ctx
}
