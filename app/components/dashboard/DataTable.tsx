'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { useTranslations } from 'next-intl'

export interface Column<T> {
  key: keyof T | string
  header: string
  width?: string
  render?: (item: T) => React.ReactNode
  sortable?: boolean
  truncate?: boolean
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyField: keyof T
  isLoading?: boolean
  emptyMessage?: string
  onRowClick?: (item: T) => void
  onRowMouseEnter?: (item: T, event: React.MouseEvent<HTMLDivElement>) => void
  onRowMouseLeave?: (item: T, event: React.MouseEvent<HTMLDivElement>) => void
  minTableWidth?: number | string
  pagination?: {
    page: number
    pageSize: number
    total: number
    onPageChange: (page: number) => void
  }
  sortConfig?: {
    sortBy: string
    sortOrder: 'asc' | 'desc'
    onSort: (key: string) => void
  }
}

export default function DataTable<T extends object>({
  columns,
  data,
  keyField,
  isLoading = false,
  emptyMessage,
  onRowClick,
  onRowMouseEnter,
  onRowMouseLeave,
  minTableWidth = 480,
  pagination,
  sortConfig,
}: DataTableProps<T>) {
  const t = useTranslations('dashboard')
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)
  const resolvedEmptyMessage = emptyMessage ?? t('noData')

  const totalPages = pagination ? Math.ceil(pagination.total / pagination.pageSize) : 1

  return (
    <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' as const }}>
      {/* Table */}
      <div
        style={{
          border: '1px solid var(--border-color)',
          background: 'var(--white)',
          overflow: 'hidden',
          minWidth: minTableWidth,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: columns.map((c) => c.width || '1fr').join(' '),
            borderBottom: '1px solid var(--border-color)',
            background: 'var(--gray-50)',
          }}
        >
          {columns.map((column) => (
            <div
              key={String(column.key)}
              onClick={
                column.sortable && sortConfig
                  ? () => sortConfig.onSort(String(column.key))
                  : undefined
              }
              style={{
                padding: '12px 16px',
                fontSize: 12,
                fontWeight: 500,
                color: 'var(--gray-500)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                cursor: column.sortable ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {column.header}
              {column.sortable && sortConfig && sortConfig.sortBy === column.key && (
                <span style={{ fontSize: 10 }}>
                  {sortConfig.sortOrder === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Body */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                padding: '40px 16px',
                textAlign: 'center',
                color: 'var(--gray-400)',
              }}
            >
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{ fontSize: 14 }}
              >
                {t('loadingData')}
              </motion.div>
            </motion.div>
          ) : data.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                padding: '40px 16px',
                textAlign: 'center',
                color: 'var(--gray-400)',
                fontSize: 14,
              }}
            >
              {resolvedEmptyMessage}
            </motion.div>
          ) : (
            data.map((item, index) => {
              const key = String(item[keyField])
              const isHovered = hoveredRow === key

              return (
                <div
                  key={key}
                  onMouseEnter={(e) => { setHoveredRow(key); onRowMouseEnter?.(item, e) }}
                  onMouseLeave={(e) => { setHoveredRow(null); onRowMouseLeave?.(item, e) }}
                  onClick={() => onRowClick?.(item)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: columns.map((c) => c.width || '1fr').join(' '),
                    borderBottom: index < data.length - 1 ? '1px solid var(--border-color)' : 'none',
                    background: isHovered ? 'var(--gray-50)' : 'transparent',
                    cursor: onRowClick ? 'pointer' : 'default',
                    transition: 'background 0.15s ease',
                  }}
                >
                  {columns.map((column) => {
                    const shouldTruncate = column.truncate !== false

                    return (
                      <div
                        key={String(column.key)}
                        style={{
                          padding: '14px 16px',
                          fontSize: 14,
                          color: 'var(--gray-700)',
                          overflow: shouldTruncate ? 'hidden' : 'visible',
                          textOverflow: shouldTruncate ? 'ellipsis' : 'clip',
                          whiteSpace: shouldTruncate ? 'nowrap' : 'normal',
                        }}
                      >
                        {column.render
                          ? column.render(item)
                          : String(item[column.key as keyof T] ?? '')}
                      </div>
                    )
                  })}
                </div>
              )
            })
          )}
        </AnimatePresence>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '16px 0',
          }}
        >
          <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>
            {t('paginationInfo', { total: pagination.total, page: pagination.page, totalPages })}
          </span>

          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 8 }}>
            <PaginationButton
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              {t('previousPage')}
            </PaginationButton>

            {/* Page numbers */}
            {generatePageNumbers(pagination.page, totalPages).map((pageNum, i) => (
              <PaginationButton
                key={i}
                onClick={
                  typeof pageNum === 'number'
                    ? () => pagination.onPageChange(pageNum)
                    : undefined
                }
                active={pageNum === pagination.page}
                disabled={typeof pageNum !== 'number'}
              >
                {pageNum}
              </PaginationButton>
            ))}

            <PaginationButton
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= totalPages}
            >
              {t('nextPage')}
            </PaginationButton>
          </div>
        </div>
      )}
    </div>
  )
}

function PaginationButton({
  children,
  onClick,
  disabled = false,
  active = false,
}: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  active?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '6px 12px',
        fontSize: 13,
        background: active ? 'var(--black)' : 'var(--white)',
        color: active ? 'var(--white)' : disabled ? 'var(--gray-300)' : 'var(--gray-600)',
        border: '1px solid',
        borderColor: active ? 'var(--black)' : 'var(--border-color)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.15s ease',
      }}
    >
      {children}
    </button>
  )
}

function generatePageNumbers(
  currentPage: number,
  totalPages: number
): (number | string)[] {
  const pages: (number | string)[] = []
  const delta = 2

  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - delta && i <= currentPage + delta)
    ) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...')
    }
  }

  return pages
}

// 狀態標籤元件
export function StatusBadge({
  status,
  variant = 'default',
}: {
  status: string
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
}) {
  const colors = {
    default: { bg: 'var(--gray-100)', text: 'var(--gray-600)' },
    success: { bg: '#DCFCE7', text: '#166534' },
    warning: { bg: '#FEF9C3', text: '#854D0E' },
    error: { bg: '#FEE2E2', text: '#991B1B' },
    info: { bg: '#DBEAFE', text: '#1E40AF' },
  }

  const color = colors[variant]

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 8px',
        fontSize: 11,
        fontWeight: 500,
        background: color.bg,
        color: color.text,
        textTransform: 'uppercase',
        letterSpacing: '0.03em',
      }}
    >
      {status}
    </span>
  )
}

// 搜尋輸入元件
export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  const t = useTranslations('dashboard')
  const resolvedPlaceholder = placeholder ?? t('searchDefault')
  return (
    <div style={{ position: 'relative' }}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={resolvedPlaceholder}
        style={{
          width: '100%',
          padding: '10px 12px 10px 36px',
          fontSize: 14,
          border: '1px solid var(--border-color)',
          outline: 'none',
          background: 'var(--white)',
          transition: 'border-color 0.15s ease',
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--black)')}
        onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
      />
      <span
        style={{
          position: 'absolute',
          left: 12,
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: 14,
          color: 'var(--gray-400)',
        }}
      >
        ⌕
      </span>
    </div>
  )
}
