import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

const TABS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'forumRequests', label: 'Forum Requests' },
  { key: 'subForumRequests', label: 'SubForum Requests' },
  { key: 'forums', label: 'Forums' },
  { key: 'threads', label: 'Threads' },
]

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [currentUser, setCurrentUser] = useState(null)

  const [forumRequestsStatus, setForumRequestsStatus] = useState('pending')
  const [forumRequests, setForumRequests] = useState([])
  const [forumReviewNotes, setForumReviewNotes] = useState({})

  const [subForumRequestsStatus, setSubForumRequestsStatus] = useState('pending')
  const [subForumRequests, setSubForumRequests] = useState([])
  const [subForumReviewNotes, setSubForumReviewNotes] = useState({})

  const [forums, setForums] = useState([])
  const [selectedForum, setSelectedForum] = useState(null)
  const [forumForm, setForumForm] = useState({ name: '', description: '', isActive: true })

  const [threadQuery, setThreadQuery] = useState('')
  const [threadResults, setThreadResults] = useState([])
  const [selectedThread, setSelectedThread] = useState(null)

  const isAdmin = currentUser?.role === 'admin'

  const dashboardCards = useMemo(
    () => [
      { title: 'Pending Forum Requests', value: forumRequests.filter((r) => r.status === 'pending').length },
      {
        title: 'Pending SubForum Requests',
        value: subForumRequests.filter((r) => r.status === 'pending').length,
      },
      { title: 'Total Forums', value: forums.length },
      { title: 'Thread Search Results', value: threadResults.length },
    ],
    [forumRequests, subForumRequests, forums, threadResults],
  )

  const clearAlerts = () => {
    setMessage('')
    setError('')
  }

  const parseJson = async (response) => {
    const text = await response.text()
    if (!text) return {}
    try {
      return JSON.parse(text)
    } catch {
      return { message: text }
    }
  }

  const apiCall = async (path, options = {}) => {
    clearAlerts()
    setLoading(true)
    try {
      const config = {
        method: options.method || 'GET',
        credentials: 'include',
        headers: {},
      }
      if (options.body) {
        config.headers['Content-Type'] = 'application/json'
        config.body = JSON.stringify(options.body)
      }
      const response = await fetch(`${API_BASE_URL}${path}`, config)
      const data = await parseJson(response)
      if (!response.ok) throw new Error(data?.message || `Request failed (${response.status})`)
      if (data?.message) setMessage(data.message)
      return data
    } catch (requestError) {
      setError(requestError.message || 'Something went wrong')
      return null
    } finally {
      setLoading(false)
    }
  }

  const loginWithGoogle = () => {
    window.location.href = `${API_BASE_URL}/auth/google`
  }

  const fetchCurrentUser = async () => {
    const data = await apiCall('/auth/me')
    if (data) setCurrentUser(data?.data?.user || null)
  }

  const logout = async () => {
    const data = await apiCall('/auth/logout', { method: 'POST' })
    if (data) setCurrentUser(null)
  }

  const refreshToken = async () => {
    await apiCall('/auth/refresh', { method: 'POST' })
  }

  const loadForumRequests = async () => {
    const data = await apiCall(`/api/forum-requests?status=${forumRequestsStatus}`)
    if (data) setForumRequests(data?.data?.requests || [])
  }

  const reviewForumRequest = async (requestId, status) => {
    const data = await apiCall(`/api/forum-requests/${requestId}/review`, {
      method: 'PATCH',
      body: {
        status,
        reviewNote: forumReviewNotes[requestId] || '',
      },
    })
    if (data) loadForumRequests()
  }

  const loadSubForumRequests = async () => {
    const data = await apiCall(`/api/subforum-requests?status=${subForumRequestsStatus}`)
    if (data) setSubForumRequests(data?.data?.requests || [])
  }

  const reviewSubForumRequest = async (requestId, status) => {
    const data = await apiCall(`/api/subforum-requests/${requestId}/review`, {
      method: 'PATCH',
      body: {
        status,
        reviewNote: subForumReviewNotes[requestId] || '',
      },
    })
    if (data) loadSubForumRequests()
  }

  const loadForums = async () => {
    const data = await apiCall('/api/forums')
    if (!data) return
    const list = data?.data?.forums || []
    setForums(list)
    if (list.length > 0 && (!selectedForum || !list.find((forum) => forum._id === selectedForum._id))) {
      setSelectedForum(list[0])
      setForumForm({
        name: list[0].name || '',
        description: list[0].description || '',
        isActive: Boolean(list[0].isActive),
      })
    }
  }

  const selectForum = (forum) => {
    setSelectedForum(forum)
    setForumForm({
      name: forum.name || '',
      description: forum.description || '',
      isActive: Boolean(forum.isActive),
    })
  }

  const updateForum = async () => {
    if (!selectedForum) return setError('Select a forum first.')
    const data = await apiCall(`/api/forums/${selectedForum._id}`, {
      method: 'PATCH',
      body: forumForm,
    })
    if (data) loadForums()
  }

  const deactivateForum = async () => {
    if (!selectedForum) return setError('Select a forum first.')
    const data = await apiCall(`/api/forums/${selectedForum._id}`, { method: 'DELETE' })
    if (data) loadForums()
  }

  const searchThreads = async () => {
    if (!threadQuery.trim()) return setError('Enter a thread title query.')
    const data = await apiCall(`/api/threads/search?q=${encodeURIComponent(threadQuery)}`)
    if (data) setThreadResults(data?.data?.pagination?.threads || [])
  }

  const selectThread = async (thread) => {
    const data = await apiCall(`/api/threads/${thread._id}`)
    if (data) setSelectedThread(data?.data?.thread || null)
  }

  const setThreadPinned = async (value) => {
    if (!selectedThread) return setError('Select a thread first.')
    const data = await apiCall(`/api/threads/${selectedThread._id}`, {
      method: 'PATCH',
      body: { isPinned: value },
    })
    if (data) selectThread(selectedThread)
  }

  const deleteThread = async () => {
    if (!selectedThread) return setError('Select a thread first.')
    const data = await apiCall(`/api/threads/${selectedThread._id}`, { method: 'DELETE' })
    if (data) {
      setSelectedThread(null)
      setThreadResults((prev) => prev.filter((item) => item._id !== selectedThread._id))
    }
  }

  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([fetchCurrentUser(), loadForums(), loadForumRequests(), loadSubForumRequests()])
    }
    loadInitialData()
  }, [])

  useEffect(() => {
    if (activeTab === 'forumRequests') loadForumRequests()
    if (activeTab === 'subForumRequests') loadSubForumRequests()
    if (activeTab === 'forums') loadForums()
  }, [activeTab, forumRequestsStatus, subForumRequestsStatus])

  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === 'forumRequests' || activeTab === 'dashboard') loadForumRequests()
      if (activeTab === 'subForumRequests' || activeTab === 'dashboard') loadSubForumRequests()
      if (activeTab === 'forums' || activeTab === 'dashboard') loadForums()
      if (activeTab === 'threads' && threadQuery.trim()) searchThreads()
    }, 10000)

    return () => clearInterval(interval)
  }, [activeTab, forumRequestsStatus, subForumRequestsStatus, threadQuery])

  return (
    <div className="app">
      <aside className="left-panel">
        <h1>UNIHUB Admin</h1>
        <p className="small">API: {API_BASE_URL}</p>
        <p className="small">User: {currentUser ? `${currentUser.name} (${currentUser.role})` : 'Not logged in'}</p>

        <div className="auth-actions">
          <button onClick={loginWithGoogle}>Login</button>
          <button onClick={fetchCurrentUser}>Refresh User</button>
          <button onClick={refreshToken}>Refresh Token</button>
          <button onClick={logout}>Logout</button>
        </div>

        <nav>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={activeTab === tab.key ? 'tab active' : 'tab'}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="main-panel">
        {(message || error || loading) && (
          <section className="status-strip">
            {loading && <p className="info">Auto syncing...</p>}
            {message && <p className="ok">{message}</p>}
            {error && <p className="bad">{error}</p>}
          </section>
        )}

        {!isAdmin && currentUser && (
          <section className="card warning">
            Your role is <strong>{currentUser.role}</strong>. Admin-only actions may fail for this account.
          </section>
        )}

        {activeTab === 'dashboard' && (
          <section className="card">
            <h2>Quick Overview</h2>
            <p className="small">Data auto-refreshes every 10 seconds.</p>
            <div className="stats-grid">
              {dashboardCards.map((item) => (
                <div key={item.title} className="stat">
                  <span>{item.title}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'forumRequests' && (
          <section className="card">
            <h2>Forum Requests</h2>
            <div className="inline-actions">
              <select value={forumRequestsStatus} onChange={(e) => setForumRequestsStatus(e.target.value)}>
                <option value="pending">pending</option>
                <option value="approved">approved</option>
                <option value="rejected">rejected</option>
              </select>
            </div>
            <div className="list">
              {forumRequests.map((req) => (
                <article key={req._id} className="list-item">
                  <h3>{req.name}</h3>
                  <p>{req.description || 'No description'}</p>
                  <p className="small">Type: {req.type} | Status: {req.status}</p>
                  <input
                    placeholder="Review note"
                    value={forumReviewNotes[req._id] || ''}
                    onChange={(e) =>
                      setForumReviewNotes((prev) => ({
                        ...prev,
                        [req._id]: e.target.value,
                      }))
                    }
                  />
                  <div className="inline-actions">
                    <button onClick={() => reviewForumRequest(req._id, 'approved')}>Approve</button>
                    <button className="danger" onClick={() => reviewForumRequest(req._id, 'rejected')}>
                      Reject
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'subForumRequests' && (
          <section className="card">
            <h2>SubForum Requests</h2>
            <div className="inline-actions">
              <select value={subForumRequestsStatus} onChange={(e) => setSubForumRequestsStatus(e.target.value)}>
                <option value="pending">pending</option>
                <option value="approved">approved</option>
                <option value="rejected">rejected</option>
              </select>
            </div>
            <div className="list">
              {subForumRequests.map((req) => (
                <article key={req._id} className="list-item">
                  <h3>{req.name}</h3>
                  <p>{req.description || 'No description'}</p>
                  <p className="small">Status: {req.status}</p>
                  <input
                    placeholder="Review note"
                    value={subForumReviewNotes[req._id] || ''}
                    onChange={(e) =>
                      setSubForumReviewNotes((prev) => ({
                        ...prev,
                        [req._id]: e.target.value,
                      }))
                    }
                  />
                  <div className="inline-actions">
                    <button onClick={() => reviewSubForumRequest(req._id, 'approved')}>Approve</button>
                    <button className="danger" onClick={() => reviewSubForumRequest(req._id, 'rejected')}>
                      Reject
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'forums' && (
          <section className="card two-col">
            <div>
              <h2>Forums</h2>
              <div className="list">
                {forums.map((forum) => (
                  <button
                    key={forum._id}
                    className={selectedForum?._id === forum._id ? 'list-item selected' : 'list-item'}
                    onClick={() => selectForum(forum)}
                  >
                    <h3>{forum.name}</h3>
                    <p>{forum.description || 'No description'}</p>
                    <p className="small">Type: {forum.type} | Active: {String(forum.isActive)}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2>Edit Selected Forum</h2>
              {selectedForum ? (
                <>
                  <label>Name</label>
                  <input value={forumForm.name} onChange={(e) => setForumForm((p) => ({ ...p, name: e.target.value }))} />
                  <label>Description</label>
                  <textarea
                    value={forumForm.description}
                    onChange={(e) => setForumForm((p) => ({ ...p, description: e.target.value }))}
                  />
                  <label className="checkline">
                    <input
                      type="checkbox"
                      checked={forumForm.isActive}
                      onChange={(e) => setForumForm((p) => ({ ...p, isActive: e.target.checked }))}
                    />
                    isActive
                  </label>
                  <div className="inline-actions">
                    <button onClick={updateForum}>Save Changes</button>
                    <button className="danger" onClick={deactivateForum}>
                      Deactivate Forum
                    </button>
                  </div>
                </>
              ) : (
                <p>Select a forum from the left list.</p>
              )}
            </div>
          </section>
        )}

        {activeTab === 'threads' && (
          <section className="card two-col">
            <div>
              <h2>Threads</h2>
              <div className="inline-actions">
                <input value={threadQuery} onChange={(e) => setThreadQuery(e.target.value)} placeholder="Search by title" />
                <button onClick={searchThreads}>Search</button>
              </div>
              <div className="list">
                {threadResults.map((thread) => (
                  <button
                    key={thread._id}
                    className={selectedThread?._id === thread._id ? 'list-item selected' : 'list-item'}
                    onClick={() => selectThread(thread)}
                  >
                    <h3>{thread.title}</h3>
                    <p className="small">Author: {thread.author?.name || '-'} | Comments: {thread.commentCount || 0}</p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h2>Thread Actions</h2>
              {selectedThread ? (
                <>
                  <h3>{selectedThread.title}</h3>
                  <p>{selectedThread.content}</p>
                  <p className="small">Pinned: {String(selectedThread.isPinned)}</p>
                  <div className="inline-actions">
                    <button onClick={() => setThreadPinned(!selectedThread.isPinned)}>
                      {selectedThread.isPinned ? 'Unpin' : 'Pin'}
                    </button>
                    <button className="danger" onClick={deleteThread}>
                      Delete Thread
                    </button>
                  </div>
                </>
              ) : (
                <p>Select a thread from the left list.</p>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

export default App
