import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { QOR_LAYOUT } from '@domain/constants/adminPanelConstants'

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-qor-canvas">
      <aside
        className="fixed inset-y-0 left-0 bg-qor-sidebar"
        style={{
          width: collapsed ? 0 : QOR_LAYOUT.sidebarExpandedWidth,
          transition: QOR_LAYOUT.sidebarCollapseTransition,
          overflow: 'hidden',
        }}
      >
        <div className="p-4 text-white">QOR Admin</div>
      </aside>

      <button
        type="button"
        onClick={() => setCollapsed((value) => !value)}
        aria-label="Toggle sidebar"
      >
        Collapse
      </button>

      <div
        data-testid="body-wrapper"
        style={{
          width: collapsed ? '100%' : `calc(100% - ${QOR_LAYOUT.sidebarExpandedWidth}px)`,
          marginLeft: collapsed ? 0 : QOR_LAYOUT.sidebarExpandedWidth,
          transition: QOR_LAYOUT.sidebarCollapseTransition,
        }}
      >
        <Outlet />
      </div>
    </div>
  )
}
