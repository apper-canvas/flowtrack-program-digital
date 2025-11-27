import { Outlet } from "react-router-dom"
import { useAuth } from "@/layouts/Root"
import { useSelector } from "react-redux"
import Button from "@/components/atoms/Button"

function Layout() {
  const { logout } = useAuth()
  const { user, isAuthenticated } = useSelector(state => state.user)

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="relative">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-30" />
        
        {/* Content */}
        <div className="relative">
          <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 shadow-sm sticky top-0 z-10">
            <div className="max-w-6xl mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    F
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-slate-800">FlowTrack</h1>
                    <p className="text-xs text-slate-500">Task Management Made Simple</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {isAuthenticated && user && (
                    <div className="text-right">
                      <div className="text-sm font-medium text-slate-700">
                        Welcome, {user.firstName || user.name || 'User'}!
                      </div>
                      <div className="text-xs text-slate-500">{user.emailAddress || 'Ready to be productive?'}</div>
                    </div>
                  )}
                  {isAuthenticated ? (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-slate-600">
                          {user?.firstName?.[0] || user?.name?.[0] || 'U'}
                        </span>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleLogout}
                        className="ml-2"
                      >
                        Logout
                      </Button>
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-slate-600">U</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          <main>
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}

export default Layout