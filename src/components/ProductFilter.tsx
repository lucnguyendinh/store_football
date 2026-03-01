'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ProductFilters, ProductType, Team, TEAM_LABELS } from '@/types'

interface ProductFilterProps {
  filters: ProductFilters
  onFilterChange: (filters: ProductFilters) => void
}

export default function ProductFilter({ filters, onFilterChange }: ProductFilterProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const debounceRef = useRef<NodeJS.Timeout>()
  const [searchValue, setSearchValue] = useState(filters.search || '')

  // Sync URL -> filters on mount
  useEffect(() => {
    const search = searchParams.get('search') || ''
    const type = (searchParams.get('type') || '') as ProductType | ''
    const team = (searchParams.get('team') || '') as Team | ''
    setSearchValue(search)
    onFilterChange({ search, type, team })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setSearchValue(filters.search || '')
  }, [filters.search])

  useEffect(() => {
    return () => clearTimeout(debounceRef.current)
  }, [])

  const updateURL = (newFilters: ProductFilters) => {
    const params = new URLSearchParams()
    if (newFilters.search) params.set('search', newFilters.search)
    if (newFilters.type) params.set('type', newFilters.type)
    if (newFilters.team) params.set('team', newFilters.team)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextSearch = e.target.value
    setSearchValue(nextSearch)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const newFilters = { ...filters, search: nextSearch }
      onFilterChange(newFilters)
      updateURL(newFilters)
    }, 400)
  }

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newFilters = { ...filters, type: e.target.value as ProductType | '' }
    onFilterChange(newFilters)
    updateURL(newFilters)
  }

  const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newFilters = { ...filters, team: e.target.value as Team | '' }
    onFilterChange(newFilters)
    updateURL(newFilters)
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search */}
      <div className="flex-1 relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="Tìm kiếm theo tên, tag..."
          value={searchValue}
          onChange={handleSearch}
          className="input-field pl-9"
        />
      </div>

      {/* Type filter */}
      <select
        value={filters.type || ''}
        onChange={handleTypeChange}
        className="input-field sm:w-36"
      >
        <option value="">Tất cả loại</option>
        <option value="PLAYER">Player</option>
        <option value="FAN">Fan</option>
        <option value="RETRO">Retro</option>
      </select>

      {/* Team filter */}
      <select
        value={filters.team || ''}
        onChange={handleTeamChange}
        className="input-field sm:w-44"
      >
        <option value="">Tất cả đội</option>
        {(Object.entries(TEAM_LABELS) as [Team, string][]).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  )
}
