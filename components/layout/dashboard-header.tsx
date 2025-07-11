"use client"

import { Bell, ChevronLeft, ChevronRight, LogOut, Search, Settings, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/components/auth/auth-context"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface DashboardHeaderProps {
  sidebarOpen?: boolean
  onSidebarOpenChange?: (open: boolean) => void
  user?: { name: string; email: string; fullname:string; role?: string } | null
}

export function DashboardHeader({ sidebarOpen = true, onSidebarOpenChange, user }: DashboardHeaderProps) {
  const { logout } = useAuth()
  const router = useRouter()

  const toggleSidebar = () => {
    if (onSidebarOpenChange) {
      onSidebarOpenChange(!sidebarOpen)
    }
  }

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
      {/* Sidebar toggle button - visible only on desktop */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className="hidden md:flex"
        aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
      >
        {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </Button>

      <div className="hidden w-full max-w-sm md:flex">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Search..." className="w-full rounded-lg bg-background pl-8 md:w-[300px]" />
        </div>
      </div>
      <div className="ml-auto flex items-center gap-2">

        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <div className="flex h-8 w-8 p-3 items-center justify-center rounded-full bg-primary/10">
                <span className="text-xs font-medium text-primary">
                  {user?.fullname?.substring(0, 2).toUpperCase() || "AD"}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.fullname || "Admin User"}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email || "admin@example.com"}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <Link href={'/profile'}>
                <span>Profile & Settings</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
