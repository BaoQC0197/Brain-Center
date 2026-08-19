'use client'

import { useEffect, useState } from 'react'
import { Project, KanbanTask, UserAccount } from '@/lib/types'
import { ProjectSkeletonGrid } from '@/app/components/Skeletons'
import AuthModal from '@/app/components/AuthModal'
import Link from 'next/link'

function EditProjectModal({
  project,
  onClose,
  onSaved,
}: {
  project: Project
  onClose: () => void
  onSaved: (updated: Project) => void
}) {
  const [name, setName] = useState(project.name)
  const [description, setDescription] = useState(project.description || '')
  const [techStack, setTechStack] = useState(project.techStack || '')
  const [stagingUrl, setStagingUrl] = useState(project.stagingUrl || '')
  const [stagingAdminUrl, setStagingAdminUrl] = useState(project.stagingAdminUrl || '')
  const [prodUrl, setProdUrl] = useState(project.prodUrl || '')
  const [prodAdminUrl, setProdAdminUrl] = useState(project.prodAdminUrl || '')
  const [bugListUrl, setBugListUrl] = useState(project.bugListUrl || '')
  const [figmaUrl, setFigmaUrl] = useState(project.figmaUrl || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return setError('Vui lòng nhập tên dự án')
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          techStack: techStack.trim(),
          stagingUrl: stagingUrl.trim(),
          stagingAdminUrl: stagingAdminUrl.trim(),
          prodUrl: prodUrl.trim(),
          prodAdminUrl: prodAdminUrl.trim(),
          bugListUrl: bugListUrl.trim(),
          figmaUrl: figmaUrl.trim(),
          createdAt: project.createdAt,
        }),
      })
      const updated = await res.json()
      if (!res.ok) throw new Error(updated.error || 'Lỗi cập nhật dự án')
      onSaved(updated)
    } catch (err: any) {
      setError(err.message || 'Không thể lưu dự án')
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-slate-900/65 flex items-center justify-center z-50 p-4 sm:p-6 backdrop-blur-xs">
      <div className="bg-white border-2 border-indigo-400 rounded-3xl shadow-2xl p-5 md:p-6 w-full max-w-xl space-y-4 text-slate-900 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3">
          <h2 className="font-extrabold text-lg md:text-xl text-slate-900">
            Chỉnh sửa Dự án
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-lg font-extrabold p-1 cursor-pointer">✕</button>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-sm md:text-base font-extrabold text-slate-900 mb-1.5">Tên dự án <span className="text-rose-600 font-bold">*</span></label>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Tên dự án..."
              className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl px-4 py-3 text-sm md:text-base text-slate-900 font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm md:text-base font-extrabold text-slate-900 mb-1.5">Mô tả ngắn nghiệp vụ</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              placeholder="Mô tả dự án..."
              className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl px-4 py-3 text-sm md:text-base text-slate-900 font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y leading-relaxed"
            />
          </div>
          <div>
            <label className="block text-sm md:text-base font-extrabold text-slate-900 mb-1.5">Tech Stack</label>
            <input
              value={techStack}
              onChange={e => setTechStack(e.target.value)}
              placeholder="Ví dụ: React, Node.js, PostgreSQL"
              className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl px-4 py-3 text-sm md:text-base text-slate-900 font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Quick Domain & Tool Links Config Section */}
          <div className="space-y-3 bg-slate-50 border border-slate-200 p-4 rounded-xl">
            <h4 className="font-semibold text-xs text-slate-700 uppercase tracking-wider font-mono">LIÊN KẾT MÔI TRƯỜNG VÀ CÔNG CỤ</h4>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1 truncate">Staging Web</label>
                <input
                  value={stagingUrl}
                  onChange={e => setStagingUrl(e.target.value)}
                  placeholder="https://staging.app.com"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1 truncate">Staging Admin</label>
                <input
                  value={stagingAdminUrl}
                  onChange={e => setStagingAdminUrl(e.target.value)}
                  placeholder="https://staging-admin.app.com"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1 truncate">Production Web</label>
                <input
                  value={prodUrl}
                  onChange={e => setProdUrl(e.target.value)}
                  placeholder="https://app.com"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1 truncate">Production Admin</label>
                <input
                  value={prodAdminUrl}
                  onChange={e => setProdAdminUrl(e.target.value)}
                  placeholder="https://admin.app.com"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1 truncate">Figma Link</label>
                <input
                  value={figmaUrl}
                  onChange={e => setFigmaUrl(e.target.value)}
                  placeholder="https://www.figma.com/file/..."
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1 truncate">Bug List Online</label>
                <input
                  value={bugListUrl}
                  onChange={e => setBugListUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/..."
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>
          </div>



          {error && <div className="bg-red-50 border-2 border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-bold">{error}</div>}

          <div className="flex gap-4 pt-4 border-t-2 border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border-2 border-slate-300 rounded-xl py-3 text-sm md:text-base font-extrabold text-slate-700 hover:bg-slate-100 transition-all"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 text-sm md:text-base font-extrabold transition-all disabled:opacity-50 shadow-md"
            >
              {saving ? 'Đang lưu...' : 'Lưu Thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [activeNavTab, setActiveNavTab] = useState<'projects' | 'kanban' | 'reports'>('projects')
  const [selectedKanbanProject, setSelectedKanbanProject] = useState<string>('ALL')
  const [showForm, setShowForm] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [form, setForm] = useState({ name: '', description: '', techStack: '', stagingUrl: '', stagingAdminUrl: '', prodUrl: '', prodAdminUrl: '', bugListUrl: '', figmaUrl: '' })
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [draggedId, setDraggedId] = useState<string | null>(null)

  // ── AUTH & USER PROFILES STATE ──
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [usersList, setUsersList] = useState<UserAccount[]>([])

  // ── KANBAN FULL CRUD & PERSISTENCE STATE ──
  const [kanbanTasks, setKanbanTasks] = useState<KanbanTask[]>([])
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [editingTask, setEditingTask] = useState<KanbanTask | null>(null)
  const [taskForm, setTaskForm] = useState<{
    title: string
    description: string
    project: string
    role: string
    status: 'TODO' | 'IN_PROGRESS' | 'DONE'
    priority: 'High' | 'Medium' | 'Low'
    assignee: string
    assigneeId?: string
  }>({
    title: '',
    description: '',
    project: 'Med PH',
    role: 'QA Engineer',
    status: 'TODO',
    priority: 'Medium',
    assignee: '',
    assigneeId: '',
  })

  // Load User Accounts & Session
  async function fetchUsersList() {
    try {
      const res = await fetch('/api/users')
      if (res.ok) {
        const data = await res.json()
        setUsersList(data.users || [])
      }
    } catch {
      // Fallback
    }
  }

  // Sync current user session
  function checkUserSession() {
    try {
      const stored = localStorage.getItem('qa_brain_current_user')
      if (stored) {
        setCurrentUser(JSON.parse(stored))
      } else {
        setCurrentUser(null)
      }
    } catch {
      setCurrentUser(null)
    }
  }

  // Load Kanban Tasks & Current User Session
  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then(data => { setProjects(data); setLoading(false) })

    fetchUsersList()
    checkUserSession()

    const handleUserChanged = () => checkUserSession()
    const handleOpenLogin = () => setShowAuthModal(true)

    window.addEventListener('storage', handleUserChanged)
    window.addEventListener('qa_brain_user_changed', handleUserChanged)
    window.addEventListener('open_login_modal', handleOpenLogin)

    try {
      const savedTasks = localStorage.getItem('qa_brain_kanban_tasks')
      if (savedTasks) {
        setKanbanTasks(JSON.parse(savedTasks))
      } else {
        const initialDefaults: KanbanTask[] = [
          { id: 'task-1', title: 'Rà soát tài liệu SRS & BRD Med PH', description: 'Kiểm tra chi tiết tính đầy đủ và nhất quán của tài liệu đặc tả', project: 'Med PH', role: 'BA / PO', status: 'TODO', priority: 'High', assignee: 'Minh Tuấn', isReleased: false },
          { id: 'task-2', title: 'Thiết kế API Spec & Schema DB', description: 'Đặc tả OpenAPI 3.0 cho 12 endpoints quản lý đơn hàng', project: 'Med PH', role: 'Dev Lead', status: 'IN_PROGRESS', priority: 'High', assignee: 'Quốc Bảo', isReleased: false },
          { id: 'task-3', title: 'Chạy Agent Clarify phát hiện lỗ hổng', description: 'Phân tích tĩnh phát hiện 8 điểm mơ hồ cần BA/PO phỏng vấn làm rõ', project: 'Med PH', role: 'QA Lead', status: 'IN_PROGRESS', priority: 'Medium', assignee: 'Phương Anh', isReleased: false },
          { id: 'task-4', title: 'Sinh 45 Test Cases BDD Gherkin', description: 'Đã hoàn thành sinh bộ Test Cases Given-When-Then', project: 'Med PH', role: 'QA Engineer', status: 'DONE', priority: 'High', assignee: 'Trần Nam', isReleased: true },
          { id: 'task-5', title: 'Nghiệm thu Change Request ITIL v2', description: 'Đánh giá tác động thay đổi hệ thống thanh toán mới', project: 'Fintech Hub', role: 'PO', status: 'TODO', priority: 'Medium', assignee: 'Hoàng Long', isReleased: false },
          { id: 'task-6', title: 'Xuất Báo cáo Release (.doc/.csv)', description: 'Tổng hợp danh mục kiểm thử hồi quy trình Sếp duyệt Go-Live', project: 'Fintech Hub', role: 'QA Lead', status: 'DONE', priority: 'Low', assignee: 'Minh Tuấn', isReleased: false },
        ]
        setKanbanTasks(initialDefaults)
        localStorage.setItem('qa_brain_kanban_tasks', JSON.stringify(initialDefaults))
      }
    } catch {
      // Fallback ignore error
    }

    return () => {
      window.removeEventListener('storage', handleUserChanged)
      window.removeEventListener('qa_brain_user_changed', handleUserChanged)
      window.removeEventListener('open_login_modal', handleOpenLogin)
    }
  }, [])

  // Helper to persist tasks
  function saveKanbanTasksToStorage(newTasks: KanbanTask[]) {
    setKanbanTasks(newTasks)
    try {
      localStorage.setItem('qa_brain_kanban_tasks', JSON.stringify(newTasks))
    } catch {
      // Ignore
    }
  }

  function handleLogout() {
    localStorage.removeItem('qa_brain_current_user')
    setCurrentUser(null)
  }

  function handleToggleRelease(taskId: string, e: React.MouseEvent) {
    e.stopPropagation()
    const updated = kanbanTasks.map(t => {
      if (t.id === taskId) {
        const nextReleased = !t.isReleased
        return {
          ...t,
          isReleased: nextReleased,
          status: nextReleased ? ('DONE' as const) : t.status,
        }
      }
      return t
    })
    saveKanbanTasksToStorage(updated)
  }

  function handleTaskDragStart(e: React.DragEvent, taskId: string) {
    setDraggedTaskId(taskId)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleTaskDrop(e: React.DragEvent, targetStatus: 'TODO' | 'IN_PROGRESS' | 'DONE') {
    e.preventDefault()
    if (!draggedTaskId) return
    const updated = kanbanTasks.map(t => (t.id === draggedTaskId ? { ...t, status: targetStatus } : t))
    saveKanbanTasksToStorage(updated)
    setDraggedTaskId(null)
  }

  function handleCreateTask() {
    fetchUsersList()
    setEditingTask(null)
    setTaskForm({
      title: '',
      description: '',
      project: selectedKanbanProject !== 'ALL' ? selectedKanbanProject : (projects[0]?.name || 'Med PH'),
      role: currentUser?.role || 'QA Engineer',
      status: 'TODO',
      priority: 'Medium',
      assignee: currentUser?.fullName || '',
      assigneeId: currentUser?.id || '',
    })
    setShowTaskModal(true)
  }

  function handleEditTask(t: KanbanTask, e: React.MouseEvent) {
    e.stopPropagation()
    fetchUsersList()
    setEditingTask(t)
    setTaskForm({
      title: t.title,
      description: t.description || '',
      project: t.project,
      role: t.role,
      status: t.status,
      priority: t.priority,
      assignee: t.assignee,
      assigneeId: t.assigneeId || '',
    })
    setShowTaskModal(true)
  }

  function handleAssigneeSelect(assigneeName: string) {
    const foundUser = usersList.find(u => u.fullName === assigneeName || u.email === assigneeName)
    setTaskForm(f => ({
      ...f,
      assignee: assigneeName,
      assigneeId: foundUser?.id || f.assigneeId,
      // Auto fill role if matched from DB
      ...(foundUser?.role ? { role: foundUser.role } : {}),
    }))
  }

  function handleDeleteTask(taskId: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (confirm('Bạn có chắc chắn muốn xóa công việc này khỏi Kanban Board?')) {
      const updated = kanbanTasks.filter(t => t.id !== taskId)
      saveKanbanTasksToStorage(updated)
    }
  }

  function handleSaveTaskSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!taskForm.title.trim()) return

    if (editingTask) {
      // Update
      const updated = kanbanTasks.map(t =>
        t.id === editingTask.id
          ? {
            ...t,
            title: taskForm.title.trim(),
            description: taskForm.description.trim(),
            project: taskForm.project,
            role: taskForm.role,
            status: taskForm.status,
            priority: taskForm.priority,
            assignee: taskForm.assignee || 'Unassigned',
            assigneeId: taskForm.assigneeId,
          }
          : t
      )
      saveKanbanTasksToStorage(updated)
    } else {
      // Create new
      const newTask: KanbanTask = {
        id: `task-${Date.now()}`,
        title: taskForm.title.trim(),
        description: taskForm.description.trim(),
        project: taskForm.project,
        role: taskForm.role,
        status: taskForm.status,
        priority: taskForm.priority,
        assignee: taskForm.assignee || 'Unassigned',
        assigneeId: taskForm.assigneeId,
      }
      saveKanbanTasksToStorage([newTask, ...kanbanTasks])
    }
    setShowTaskModal(false)
  }

  async function createProject(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const project = await res.json()
    setProjects(prev => [project, ...prev])
    setForm({ name: '', description: '', techStack: '', stagingUrl: '', stagingAdminUrl: '', prodUrl: '', prodAdminUrl: '', bugListUrl: '', figmaUrl: '' })
    setShowForm(false)
    setSaving(false)
  }

  const filteredProjects = projects.filter(p => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q))
  })

  function handleDragStart(e: React.DragEvent, id: string) {
    setDraggedId(id)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  async function handleDrop(e: React.DragEvent, targetId: string) {
    e.preventDefault()
    if (!draggedId || draggedId === targetId) return

    const draggedIndex = projects.findIndex(p => p.id === draggedId)
    const targetIndex = projects.findIndex(p => p.id === targetId)

    if (draggedIndex < 0 || targetIndex < 0) return

    const newProjects = [...projects]
    const [removed] = newProjects.splice(draggedIndex, 1)
    newProjects.splice(targetIndex, 0, removed)

    const updatedProjects = newProjects.map((p, idx) => ({ ...p, sortOrder: idx }))
    setProjects(updatedProjects)
    setDraggedId(null)

    try {
      await fetch('/api/projects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orders: updatedProjects.map(p => ({ id: p.id, sortOrder: p.sortOrder })),
        }),
      })
    } catch (err) {
      console.error('Lỗi cập nhật vị trí dự án:', err)
    }
  }

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Modern Top Navigation Bar */}
      <div className="bg-white border-2 border-slate-300 rounded-2xl px-5 py-3.5 shadow-sm text-slate-900 flex items-center justify-between flex-wrap gap-4">
        {/* Left Side: Navigation Menu Items */}
        <div className="flex items-center gap-2 flex-wrap font-extrabold text-xs md:text-sm">
          <button
            type="button"
            onClick={() => setActiveNavTab('projects')}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer ${activeNavTab === 'projects'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
              }`}
          >
            <span>Danh sách dự án</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveNavTab('kanban')}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer ${activeNavTab === 'kanban'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
              }`}
          >
            <span>Kanban Board</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveNavTab('reports')}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer ${activeNavTab === 'reports'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
              }`}
          >
            <span>Báo cáo tiến độ</span>
          </button>
        </div>

        {/* Right Side: Version Badge */}
        <div className="flex items-center gap-2.5 ml-auto shrink-0 text-xs">
          <span className="bg-indigo-50 text-indigo-900 border border-indigo-300 px-3 py-1.5 rounded-xl font-semibold shadow-2xs">
            v1.0 Internal EZG
          </span>
        </div>
      </div>

      {/* TAB 1: DANH SÁCH DỰ ÁN VIEW */}
      {activeNavTab === 'projects' && (
        <>
          {/* Search & Action Control Bar */}
          <div className="flex items-center justify-between flex-wrap gap-4 bg-white border-2 border-slate-300 p-4 rounded-2xl shadow-sm">
            <div className="relative flex-1 min-w-[280px] max-w-lg">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm dự án theo tên, mô tả..."
                className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl px-4 py-2.5 text-xs md:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
              />
            </div>

            <div className="flex items-center gap-3.5 flex-wrap ml-auto">
              <div className="flex items-center gap-2 bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-300 shadow-2xs text-xs md:text-sm font-bold text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Tổng dự án:</span>
                <strong className="text-slate-900 font-black text-sm md:text-base">{projects.length}</strong>
              </div>

              <button
                onClick={() => setShowForm(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <span>+</span> Thêm dự án
              </button>
            </div>
          </div>

          {/* Project Grid Cards */}
          {loading ? (
            <ProjectSkeletonGrid />
          ) : filteredProjects.length === 0 ? (
            <div className="bg-white border-2 border-slate-300 rounded-2xl p-12 text-center space-y-4 shadow-md">
              <div>
                <h3 className="font-semibold text-slate-900 text-lg md:text-xl">Chưa có dự án kiểm thử nào</h3>
                <p className="text-xs md:text-sm text-slate-600 mt-1 max-w-md mx-auto font-semibold">
                  Hãy tạo dự án đầu tiên để bắt đầu lưu trữ tài liệu Phase 1 và sử dụng các Trợ lý QA tự động hoá công việc kiểm thử.
                </p>
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all shadow-md"
              >
                + Tạo dự án đầu tiên
              </button>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProjects.map(p => {
                const initialLetter = p.name ? p.name.trim().charAt(0).toUpperCase() : 'P'
                return (
                  <div
                    key={p.id}
                    draggable
                    onDragStart={e => handleDragStart(e, p.id)}
                    onDragOver={handleDragOver}
                    onDrop={e => handleDrop(e, p.id)}
                    className={`bg-white border-2 p-4.5 sm:p-5 rounded-2xl flex flex-col shadow-sm transition-all group cursor-grab active:cursor-grabbing select-none ${draggedId === p.id
                      ? 'opacity-40 border-dashed border-indigo-600 bg-indigo-50 scale-95'
                      : 'border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/20 hover:shadow-lg'
                      }`}
                  >
                    <div className="space-y-2 flex-1 flex flex-col">
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-indigo-100 border-2 border-indigo-300 flex items-center justify-center font-bold text-indigo-700 shrink-0 text-sm shadow-xs">
                            {initialLetter}
                          </div>
                          <div className="min-w-0">
                            <Link href={`/projects/${p.id}`}>
                              <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-base truncate" title={p.name}>
                                {p.name}
                              </h3>
                            </Link>
                            <p className="text-[11px] text-slate-500 font-medium">
                              {new Date(p.createdAt).toLocaleDateString('vi-VN')}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                          <button
                            onClick={e => {
                              e.stopPropagation()
                              setEditingProject(p)
                            }}
                            className="text-slate-500 hover:text-indigo-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-xs font-bold border border-slate-200 cursor-pointer"
                            title="Chỉnh sửa dự án"
                          >
                            Sửa
                          </button>
                        </div>
                      </div>

                      {/* 1-Line Truncated Description with Hover Tooltip */}
                      <div className="h-5 flex items-center min-w-0">
                        {p.description ? (
                          <p className="text-xs text-slate-600 font-semibold truncate leading-tight w-full" title={p.description}>
                            {p.description}
                          </p>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-semibold italic">Chưa có mô tả</span>
                        )}
                      </div>

                      {/* Tech Stack & Domain Quick Links Container */}
                      <div className="space-y-2 pt-0.5">
                        {p.techStack && (
                          <div className="flex flex-wrap gap-1">
                            {p.techStack.split(',').map(t => (
                              <span
                                key={t}
                                className="bg-slate-100 text-slate-800 border border-slate-300 text-[11px] px-2 py-0.2 rounded-full font-medium"
                              >
                                {t.trim()}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Domain Environments, Figma & Bug List Quick Launcher Pills */}
                        {(p.stagingUrl || p.stagingAdminUrl || p.prodUrl || p.prodAdminUrl || p.bugListUrl || p.figmaUrl) ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {p.stagingUrl && (
                              <a
                                href={p.stagingUrl.startsWith('http') ? p.stagingUrl : `https://${p.stagingUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                                className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 transition-all shadow-2xs"
                                title={`Mở Staging WebApp: ${p.stagingUrl}`}
                              >
                                <span>STG Web</span>
                              </a>
                            )}
                            {p.stagingAdminUrl && (
                              <a
                                href={p.stagingAdminUrl.startsWith('http') ? p.stagingAdminUrl : `https://${p.stagingAdminUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                                className="bg-orange-50 hover:bg-orange-100 text-orange-900 border border-orange-300 px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 transition-all shadow-2xs"
                                title={`Mở Staging Admin Portal: ${p.stagingAdminUrl}`}
                              >
                                <span>STG Admin</span>
                              </a>
                            )}
                            {p.prodUrl && (
                              <a
                                href={p.prodUrl.startsWith('http') ? p.prodUrl : `https://${p.prodUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 transition-all shadow-2xs"
                                title={`Mở Production WebApp: ${p.prodUrl}`}
                              >
                                <span>PROD Web</span>
                              </a>
                            )}
                            {p.prodAdminUrl && (
                              <a
                                href={p.prodAdminUrl.startsWith('http') ? p.prodAdminUrl : `https://${p.prodAdminUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-300 px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 transition-all shadow-2xs"
                                title={`Mở Production Admin Portal: ${p.prodAdminUrl}`}
                              >
                                <span>PROD Admin</span>
                              </a>
                            )}
                            {p.figmaUrl && (
                              <a
                                href={p.figmaUrl.startsWith('http') ? p.figmaUrl : `https://${p.figmaUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                                className="bg-pink-50 hover:bg-pink-100 text-pink-900 border border-pink-300 px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 transition-all shadow-2xs"
                                title={`Mở Design Figma File: ${p.figmaUrl}`}
                              >
                                <span>Figma Link</span>
                              </a>
                            )}
                            {p.bugListUrl && (
                              <a
                                href={p.bugListUrl.startsWith('http') ? p.bugListUrl : `https://${p.bugListUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                                className="bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-300 px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 transition-all shadow-2xs"
                                title={`Mở File Bug List: ${p.bugListUrl}`}
                              >
                                <span>Bug List</span>
                              </a>
                            )}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation()
                              setEditingProject(p)
                            }}
                            className="text-[11px] text-slate-400 hover:text-indigo-600 font-semibold flex items-center gap-1 transition-colors"
                          >
                            <span>+ Cấu hình Domain WebApp/Admin, Figma và Bug List</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="pt-2.5 border-t-2 border-slate-100 flex items-center justify-center text-xs md:text-sm text-indigo-600 group-hover:text-indigo-700 font-extrabold text-center mt-3.5">
                      <Link href={`/projects/${p.id}`} className="flex items-center justify-center w-full text-center">
                        <span>Mở Dashboard</span>
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* TAB 2: KANBAN BOARD */}
      {activeNavTab === 'kanban' && (
        <div className="space-y-4">
          <div className="bg-white border-2 border-slate-300 rounded-2xl p-5 shadow-sm flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-lg md:text-xl font-black text-slate-900">
                Kanban Taskboard — Quản lý tiến độ công việc
              </h2>
              <p className="text-xs md:text-sm text-slate-600 font-medium mt-1">

              </p>
            </div>

            {/* Dynamic Project Filter Dropdown & Add Task Button */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 bg-slate-50 border-2 border-slate-300 rounded-xl px-3 py-1.5 shadow-2xs">
                <span className="text-xs font-bold text-slate-700">Lọc dự án:</span>
                <select
                  value={selectedKanbanProject}
                  onChange={e => setSelectedKanbanProject(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="ALL">Tất cả dự án ({projects.length})</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleCreateTask}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs md:text-sm font-extrabold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>+</span> Thêm công việc
              </button>
              <span className="bg-indigo-50 text-indigo-900 border border-indigo-200 px-3 py-2 rounded-xl text-xs font-extrabold">
                {kanbanTasks.filter(t => selectedKanbanProject === 'ALL' || t.project === selectedKanbanProject).length} Tasks
              </span>
            </div>
          </div>

          {/* 3 Columns Kanban Board Grid */}
          <div className="grid md:grid-cols-3 gap-5 items-start">
            {/* Column 1: TODO */}
            <div
              onDragOver={handleDragOver}
              onDrop={e => handleTaskDrop(e, 'TODO')}
              className="bg-slate-100/90 border-2 border-slate-300 rounded-2xl p-4 space-y-3 min-h-[500px]"
            >
              <div className="flex items-center justify-between border-b-2 border-slate-200 pb-2 px-1">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500" />
                  <h3 className="font-extrabold text-slate-800 text-sm">Cần làm (TODO)</h3>
                </div>
                <span className="bg-white text-slate-700 px-2.5 py-0.5 rounded-full text-xs font-black border border-slate-300">
                  {kanbanTasks.filter(t => t.status === 'TODO' && (selectedKanbanProject === 'ALL' || t.project === selectedKanbanProject)).length}
                </span>
              </div>

              <div className="space-y-3">
                {kanbanTasks
                  .filter(t => t.status === 'TODO' && (selectedKanbanProject === 'ALL' || t.project === selectedKanbanProject))
                  .map(t => (
                    <div
                      key={t.id}
                      draggable
                      onDragStart={e => handleTaskDragStart(e, t.id)}
                      className="bg-white border-2 border-slate-300 hover:border-indigo-500 p-4 rounded-xl shadow-xs space-y-2.5 cursor-grab active:cursor-grabbing transition-all hover:shadow-md group relative"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="bg-indigo-100 text-indigo-950 font-black text-[11px] px-2 py-0.5 rounded">
                          {t.project}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="bg-amber-50 text-amber-900 border border-amber-300 font-bold text-[10px] px-2 py-0.5 rounded">
                            {t.role}
                          </span>
                          <button
                            type="button"
                            onClick={e => handleEditTask(t, e)}
                            className="text-slate-400 hover:text-indigo-600 text-xs px-1 font-bold cursor-pointer"
                            title="Sửa task"
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            onClick={e => handleDeleteTask(t.id, e)}
                            className="text-slate-400 hover:text-rose-600 text-xs px-1 font-bold cursor-pointer"
                            title="Xóa task"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                      <h4 className="font-extrabold text-slate-900 text-xs md:text-sm leading-snug">
                        {t.title}
                      </h4>
                      {t.description && (
                        <p className="text-[11px] text-slate-600 font-medium leading-relaxed bg-slate-50 border border-slate-200 rounded-lg p-2 line-clamp-2">
                          {t.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 text-slate-500 font-semibold">
                        <span>{t.assignee}</span>
                        <span className="text-rose-600 font-bold">{t.priority}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Column 2: IN PROGRESS */}
            <div
              onDragOver={handleDragOver}
              onDrop={e => handleTaskDrop(e, 'IN_PROGRESS')}
              className="bg-indigo-50/70 border-2 border-indigo-300 rounded-2xl p-4 space-y-3 min-h-[500px]"
            >
              <div className="flex items-center justify-between border-b-2 border-indigo-200 pb-2 px-1">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-indigo-600 animate-pulse" />
                  <h3 className="font-extrabold text-indigo-950 text-sm">Đang thực hiện (In progress)</h3>
                </div>
                <span className="bg-white text-indigo-950 px-2.5 py-0.5 rounded-full text-xs font-black border border-indigo-300">
                  {kanbanTasks.filter(t => t.status === 'IN_PROGRESS' && (selectedKanbanProject === 'ALL' || t.project === selectedKanbanProject)).length}
                </span>
              </div>

              <div className="space-y-3">
                {kanbanTasks
                  .filter(t => t.status === 'IN_PROGRESS' && (selectedKanbanProject === 'ALL' || t.project === selectedKanbanProject))
                  .map(t => (
                    <div
                      key={t.id}
                      draggable
                      onDragStart={e => handleTaskDragStart(e, t.id)}
                      className="bg-white border-2 border-indigo-300 hover:border-indigo-600 p-4 rounded-xl shadow-xs space-y-2.5 cursor-grab active:cursor-grabbing transition-all hover:shadow-md"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="bg-indigo-100 text-indigo-950 font-black text-[11px] px-2 py-0.5 rounded">
                          {t.project}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="bg-sky-50 text-sky-900 border border-sky-300 font-bold text-[10px] px-2 py-0.5 rounded">
                            {t.role}
                          </span>
                          <button
                            type="button"
                            onClick={e => handleEditTask(t, e)}
                            className="text-slate-400 hover:text-indigo-600 text-xs px-1 font-bold cursor-pointer"
                            title="Sửa task"
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            onClick={e => handleDeleteTask(t.id, e)}
                            className="text-slate-400 hover:text-rose-600 text-xs px-1 font-bold cursor-pointer"
                            title="Xóa task"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                      <h4 className="font-extrabold text-slate-900 text-xs md:text-sm leading-snug">
                        {t.title}
                      </h4>
                      {t.description && (
                        <p className="text-[11px] text-slate-600 font-medium leading-relaxed bg-slate-50 border border-slate-200 rounded-lg p-2 line-clamp-2">
                          {t.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 text-slate-500 font-semibold">
                        <span>{t.assignee}</span>
                        <span className="text-indigo-600 font-bold">{t.priority}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Column 3: DONE */}
            <div
              onDragOver={handleDragOver}
              onDrop={e => handleTaskDrop(e, 'DONE')}
              className="bg-emerald-50/70 border-2 border-emerald-300 rounded-2xl p-4 space-y-3 min-h-[500px]"
            >
              <div className="flex items-center justify-between border-b-2 border-emerald-200 pb-2 px-1">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  <h3 className="font-extrabold text-emerald-950 text-sm">Hoàn thành (Done)</h3>
                </div>
                <span className="bg-white text-emerald-950 px-2.5 py-0.5 rounded-full text-xs font-black border border-emerald-300">
                  {kanbanTasks.filter(t => t.status === 'DONE' && !t.isReleased && (selectedKanbanProject === 'ALL' || t.project === selectedKanbanProject)).length}
                </span>
              </div>

              <div className="space-y-3">
                {kanbanTasks
                  .filter(t => t.status === 'DONE' && !t.isReleased && (selectedKanbanProject === 'ALL' || t.project === selectedKanbanProject))
                  .map(t => (
                    <div
                      key={t.id}
                      draggable
                      onDragStart={e => handleTaskDragStart(e, t.id)}
                      className="bg-white border-2 border-emerald-300 hover:border-emerald-600 p-4 rounded-xl shadow-xs space-y-2.5 cursor-grab active:cursor-grabbing transition-all hover:shadow-md opacity-90"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="bg-emerald-100 text-emerald-950 font-black text-[11px] px-2 py-0.5 rounded">
                          {t.project}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="bg-emerald-50 text-emerald-900 border border-emerald-300 font-bold text-[10px] px-2 py-0.5 rounded">
                            {t.role}
                          </span>
                          <button
                            type="button"
                            onClick={e => handleEditTask(t, e)}
                            className="text-slate-400 hover:text-indigo-600 text-xs px-1 font-bold cursor-pointer"
                            title="Sửa task"
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            onClick={e => handleDeleteTask(t.id, e)}
                            className="text-slate-400 hover:text-rose-600 text-xs px-1 font-bold cursor-pointer"
                            title="Xóa task"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                      <h4 className="font-extrabold text-slate-900 text-xs md:text-sm leading-snug line-through text-slate-600">
                        {t.title}
                      </h4>
                      {t.description && (
                        <p className="text-[11px] text-slate-600 font-medium leading-relaxed bg-slate-50 border border-slate-200 rounded-lg p-2 line-clamp-2">
                          {t.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100 font-semibold">
                        <span>{t.assignee}</span>
                        <button
                          type="button"
                          onClick={e => handleToggleRelease(t.id, e)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded-lg text-[10px] font-black transition-all shadow-xs cursor-pointer"
                        >
                          Đánh dấu Release
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Archived / Released Tasks Section */}
          {kanbanTasks.some(t => t.isReleased && (selectedKanbanProject === 'ALL' || t.project === selectedKanbanProject)) && (
            <div className="bg-slate-100 border-2 border-slate-300 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-300 pb-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-slate-800 text-sm md:text-base">
                    Mục lưu trữ (Released archive)
                  </h3>
                </div>
                <span className="bg-indigo-100 text-indigo-900 border border-indigo-300 px-3 py-0.5 rounded-full text-xs font-black">
                  {kanbanTasks.filter(t => t.isReleased && (selectedKanbanProject === 'ALL' || t.project === selectedKanbanProject)).length} Tasks đã Release
                </span>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {kanbanTasks
                  .filter(t => t.isReleased && (selectedKanbanProject === 'ALL' || t.project === selectedKanbanProject))
                  .map(t => (
                    <div
                      key={t.id}
                      className="bg-white border-2 border-indigo-200 p-3.5 rounded-xl space-y-2 shadow-2xs opacity-85 hover:opacity-100 transition-all"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="bg-indigo-100 text-indigo-900 font-bold px-2 py-0.5 rounded">
                          {t.project}
                        </span>
                        <span className="bg-emerald-100 text-emerald-900 font-black px-2 py-0.5 rounded">
                          Đã Release
                        </span>
                      </div>
                      <h4 className="font-extrabold text-slate-800 text-xs truncate" title={t.title}>
                        {t.title}
                      </h4>
                      {t.description && (
                        <p className="text-[10px] text-slate-600 font-medium line-clamp-1 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5">
                          {t.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100 font-semibold">
                        <span>{t.assignee}</span>
                        <button
                          type="button"
                          onClick={e => handleToggleRelease(t.id, e)}
                          className="text-indigo-600 hover:underline font-bold cursor-pointer"
                        >
                          Khôi phục về Board
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: BÁO CÁO TIẾN ĐỘ VIEW */}
      {activeNavTab === 'reports' && (
        <div className="space-y-6">
          <div className="bg-white border-2 border-slate-300 rounded-2xl p-6 shadow-sm flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900">
                Báo cáo tiến độ hoàn thành & tiến độ release theo dự án
              </h2>
              <p className="text-xs md:text-sm text-slate-600 font-medium mt-1">
                • <strong>Tiến độ hoàn thành:</strong> Số task có trạng thái DONE / Tổng task.<br />
                • <strong>Tiến độ release:</strong> Số task đã đánh dấu RELEASE / Tổng task (Tự động di chuyển vào Lưu trữ).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-50 text-emerald-900 border border-emerald-300 px-3 py-1 rounded-xl text-xs font-bold">
                {projects.length} Dự án Active
              </span>
            </div>
          </div>

          {/* Per-Project Dual Progress Cards Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map(p => {
              const pTasks = kanbanTasks.filter(
                t => t.project.toLowerCase() === p.name.toLowerCase() || t.project === p.name
              )
              const total = pTasks.length
              const doneTasks = pTasks.filter(t => t.status === 'DONE' || t.isReleased).length
              const releasedTasks = pTasks.filter(t => t.isReleased).length

              // Calculations: If total tasks is 0, default to 100% (No pending work / baseline complete)
              const completionPercent = total > 0 ? Math.round((doneTasks / total) * 100) : 100
              const releasePercent = total > 0 ? Math.round((releasedTasks / total) * 100) : 100

              // Perfect SVG Donut Circle Math (box = 96x96, cx=48, cy=48, r=38, stroke=8)
              const radius = 38
              const circumference = 2 * Math.PI * radius
              const offsetCompletion = circumference - (completionPercent / 100) * circumference
              const offsetRelease = circumference - (releasePercent / 100) * circumference

              return (
                <div
                  key={p.id}
                  className="bg-white border-2 border-slate-300 rounded-2xl p-6 space-y-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[11px] font-mono font-bold text-slate-400 uppercase">PROJECT</span>
                      <h3 className="text-lg font-black text-slate-900 truncate max-w-[180px]" title={p.name}>
                        {p.name}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedKanbanProject(p.name)
                        setActiveNavTab('kanban')
                      }}
                      className="text-xs font-extrabold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                    >
                      Chi tiết ➔
                    </button>
                  </div>

                  {/* Dual Donut Progress Charts (Fixed Perfect Alignment & No Edge Cutoff) */}
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                    {/* Chart 1: Tiến độ Hoàn thành */}
                    <div className="flex flex-col items-center text-center space-y-1">
                      <div className="relative flex items-center justify-center w-24 h-24">
                        <svg viewBox="0 0 96 96" className="w-24 h-24 transform -rotate-90 overflow-visible">
                          <circle cx="48" cy="48" r={radius} stroke="#e2e8f0" strokeWidth="8" fill="none" />
                          <circle
                            cx="48"
                            cy="48"
                            r={radius}
                            stroke="#6366f1"
                            strokeWidth="8"
                            strokeDasharray={circumference}
                            strokeDashoffset={offsetCompletion}
                            strokeLinecap="round"
                            fill="none"
                            className="transition-all duration-700"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-sm font-black text-indigo-950">
                            {completionPercent}%
                          </span>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-slate-700">Tiến độ Hoàn thành</span>
                      <span className="text-[10px] text-slate-500 font-semibold">{doneTasks}/{total} Tasks</span>
                    </div>

                    {/* Chart 2: Tiến độ Release */}
                    <div className="flex flex-col items-center text-center space-y-1">
                      <div className="relative flex items-center justify-center w-24 h-24">
                        <svg viewBox="0 0 96 96" className="w-24 h-24 transform -rotate-90 overflow-visible">
                          <circle cx="48" cy="48" r={radius} stroke="#e2e8f0" strokeWidth="8" fill="none" />
                          <circle
                            cx="48"
                            cy="48"
                            r={radius}
                            stroke="#10b981"
                            strokeWidth="8"
                            strokeDasharray={circumference}
                            strokeDashoffset={offsetRelease}
                            strokeLinecap="round"
                            fill="none"
                            className="transition-all duration-700"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-sm font-black text-emerald-950">
                            {releasePercent}%
                          </span>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-slate-700">Tiến độ Release</span>
                      <span className="text-[10px] text-slate-500 font-semibold">{releasedTasks}/{total} Released</span>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-2.5 text-center text-xs font-semibold text-slate-700 shadow-2xs">
                    {total === 0 ? (
                      <span className="text-slate-500 italic">Chưa tạo task (Mặc định 100% Hoàn thành)</span>
                    ) : releasePercent === 100 ? (
                      <span className="text-emerald-700 font-bold">🎉 Tất cả tasks đã Release thành công!</span>
                    ) : (
                      <span>Đã Release <strong>{releasedTasks}</strong>/<strong>{total}</strong> tasks vào Mục lưu trữ</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}



      {/* Create Project Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/65 flex items-center justify-center z-50 p-4 sm:p-6 backdrop-blur-xs">
          <div className="bg-white border-2 border-indigo-400 rounded-3xl shadow-2xl p-5 md:p-6 w-full max-w-xl md:max-w-2xl space-y-4 text-slate-900 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3">
              <h2 className="font-extrabold text-lg md:text-xl text-slate-900">
                Tạo Dự án QA mới
              </h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700 text-lg font-extrabold p-1 cursor-pointer">✕</button>
            </div>

            <form onSubmit={createProject} className="space-y-5">
              <div>
                <label className="block text-sm md:text-base font-extrabold text-slate-900 mb-1.5">Tên dự án <span className="text-rose-600 font-bold">*</span></label>
                <input
                  autoFocus
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Ví dụ: E-Commerce Mobile App"
                  className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl px-4 py-3 text-sm md:text-base text-slate-900 font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm md:text-base font-extrabold text-slate-900 mb-1.5">Mô tả ngắn nghiệp vụ</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={4}
                  placeholder="Ví dụ: Hệ thống bán lẻ đa kênh với các luồng Thanh toán, Đơn hàng, Kho..."
                  className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl px-4 py-3 text-sm md:text-base text-slate-900 font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y leading-relaxed"
                />
              </div>
              <div>
                <label className="block text-sm md:text-base font-extrabold text-slate-900 mb-1.5">Tech Stack</label>
                <input
                  value={form.techStack}
                  onChange={e => setForm(f => ({ ...f, techStack: e.target.value }))}
                  placeholder="Ví dụ: React Native, Node.js, PostgreSQL, Kafka"
                  className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl px-4 py-3 text-sm md:text-base text-slate-900 font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Quick Domain & Tool Links Config Section */}
              <div className="space-y-3 bg-slate-50 border border-slate-200 p-4 rounded-xl">
                <h4 className="font-semibold text-xs text-slate-700 uppercase tracking-wider font-mono">LIÊN KẾT MÔI TRƯỜNG VÀ CÔNG CỤ</h4>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-900 mb-1 truncate">Staging Web</label>
                    <input
                      value={form.stagingUrl}
                      onChange={e => setForm(f => ({ ...f, stagingUrl: e.target.value }))}
                      placeholder="https://staging.app.com"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-900 mb-1 truncate">Staging Admin</label>
                    <input
                      value={form.stagingAdminUrl}
                      onChange={e => setForm(f => ({ ...f, stagingAdminUrl: e.target.value }))}
                      placeholder="https://staging-admin.app.com"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-900 mb-1 truncate">Production Web</label>
                    <input
                      value={form.prodUrl}
                      onChange={e => setForm(f => ({ ...f, prodUrl: e.target.value }))}
                      placeholder="https://app.com"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-900 mb-1 truncate">Production Admin</label>
                    <input
                      value={form.prodAdminUrl}
                      onChange={e => setForm(f => ({ ...f, prodAdminUrl: e.target.value }))}
                      placeholder="https://admin.app.com"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-900 mb-1 truncate">Figma Link</label>
                    <input
                      value={form.figmaUrl}
                      onChange={e => setForm(f => ({ ...f, figmaUrl: e.target.value }))}
                      placeholder="https://www.figma.com/file/..."
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-900 mb-1 truncate">Bug List Online</label>
                    <input
                      value={form.bugListUrl}
                      onChange={e => setForm(f => ({ ...f, bugListUrl: e.target.value }))}
                      placeholder="https://docs.google.com/spreadsheets/..."
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>
              </div>


              <div className="flex gap-4 pt-4 border-t-2 border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 border-2 border-slate-300 rounded-xl py-3 text-sm md:text-base font-extrabold text-slate-700 hover:bg-slate-100 transition-all"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  disabled={saving || !form.name.trim()}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 text-sm md:text-base font-extrabold transition-all disabled:opacity-50 shadow-md"
                >
                  {saving ? 'Đang khởi tạo...' : 'Thêm Dự án'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {editingProject && (
        <EditProjectModal
          project={editingProject}
          onClose={() => setEditingProject(null)}
          onSaved={updated => {
            setProjects(prev => prev.map(p => p.id === updated.id ? updated : p))
            setEditingProject(null)
          }}
        />
      )}

      {/* Kanban Task Modal (Create / Edit Task) */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-slate-900/70 flex items-center justify-center z-50 p-4 sm:p-6 backdrop-blur-sm">
          <div className="bg-white border-2 border-indigo-500 rounded-3xl shadow-2xl p-5 md:p-6 w-full max-w-xl space-y-4 text-slate-900 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3">
              <h2 className="font-extrabold text-lg md:text-xl text-slate-900">
                {editingTask ? 'Chỉnh sửa Công việc' : 'Thêm Công việc Kanban mới'}
              </h2>
              <button
                type="button"
                onClick={() => setShowTaskModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xl font-extrabold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTaskSubmit} className="space-y-5">
              <div>
                <label className="block text-sm md:text-base font-extrabold text-slate-900 mb-1.5">
                  Tên công việc (Task Title) <span className="text-rose-600 font-bold">*</span>
                </label>
                <input
                  autoFocus
                  value={taskForm.title}
                  onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Ví dụ: Review SRS & chuẩn bị kịch bản Test..."
                  className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl px-4 py-3 text-sm md:text-base text-slate-900 font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm md:text-base font-extrabold text-slate-900 mb-1.5">
                  Chi tiết công việc (Task Description)
                </label>
                <textarea
                  value={taskForm.description}
                  onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))}
                  rows={4}
                  placeholder="Mô tả nội dung công việc chi tiết, kịch bản cần rà soát..."
                  className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl px-4 py-3 text-sm md:text-base text-slate-900 font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y leading-relaxed"
                />
              </div>

              {/* Row 1: Project & Assignee Dropdowns */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs md:text-sm font-extrabold text-slate-900 mb-1.5">
                    Dự án áp dụng
                  </label>
                  <select
                    value={taskForm.project}
                    onChange={e => setTaskForm(f => ({ ...f, project: e.target.value }))}
                    className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl px-4 py-3 text-xs md:text-sm text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    {projects.length > 0 ? (
                      projects.map(p => (
                        <option key={p.id} value={p.name}>
                          {p.name}
                        </option>
                      ))
                    ) : (
                      <option value="Med PH">Med PH</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-extrabold text-slate-900 mb-1.5">
                    Người phụ trách (Account Supabase)
                  </label>
                  {usersList.length > 0 ? (
                    <select
                      value={taskForm.assignee}
                      onChange={e => handleAssigneeSelect(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl px-4 py-3 text-xs md:text-sm text-slate-900 font-extrabold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="">-- Chọn nhân sự --</option>
                      {usersList.map(u => (
                        <option key={u.id} value={u.fullName}>
                          {u.fullName} ({u.role})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={taskForm.assignee}
                      onChange={e => setTaskForm(f => ({ ...f, assignee: e.target.value }))}
                      placeholder="Tên nhân sự..."
                      className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl px-4 py-3 text-xs md:text-sm text-slate-900 font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  )}
                </div>
              </div>

              {/* Row 2: Role, Status, Priority Dropdowns */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs md:text-sm font-extrabold text-slate-900 mb-1.5">
                    Vai trò
                  </label>
                  <input
                    disabled
                    readOnly
                    value={taskForm.role || 'Chưa gán'}
                    title="Vai trò tự động gán từ Database nhân sự"
                    className="w-full bg-slate-100 border-2 border-slate-300 rounded-xl px-4 py-3 text-xs md:text-sm text-slate-700 font-extrabold cursor-not-allowed opacity-85 select-none"
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-extrabold text-slate-900 mb-1.5">
                    Trạng thái
                  </label>
                  <select
                    value={taskForm.status}
                    onChange={e => setTaskForm(f => ({ ...f, status: e.target.value as any }))}
                    className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl px-3.5 py-3 text-xs md:text-sm text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="TODO">Cần làm (TODO)</option>
                    <option value="IN_PROGRESS">Đang làm</option>
                    <option value="DONE">Hoàn thành</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-extrabold text-slate-900 mb-1.5">
                    Độ ưu tiên
                  </label>
                  <select
                    value={taskForm.priority}
                    onChange={e => setTaskForm(f => ({ ...f, priority: e.target.value as any }))}
                    className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl px-3.5 py-3 text-xs md:text-sm text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="High">Cao</option>
                    <option value="Medium">Trung bình</option>
                    <option value="Low">Thấp</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t-2 border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="flex-1 border-2 border-slate-300 rounded-xl py-3 text-sm md:text-base font-extrabold text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  disabled={!taskForm.title.trim()}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 text-sm md:text-base font-extrabold transition-all disabled:opacity-50 shadow-md cursor-pointer"
                >
                  {editingTask ? 'Lưu cập nhật' : 'Tạo Task mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Auth Modal (Sign In / Register) */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={user => {
            setCurrentUser(user)
            setShowAuthModal(false)
            fetchUsersList()
          }}
        />
      )}
    </div>
  )
}
