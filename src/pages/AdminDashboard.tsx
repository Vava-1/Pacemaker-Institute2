import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Link } from 'react-router'
import {
  Users, BookOpen, GraduationCap, DollarSign,
  Shield, Loader2, UserX, UserCheck
} from 'lucide-react'
import { trpc } from '@/providers/trpc'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const settingsSchema = z.object({
  smtp_host: z.string().optional(),
  smtp_user: z.string().optional(),
  smtp_password: z.string().optional(),
  smtp_from_email: z.string().email().optional().or(z.literal('')),
  stripe_secret_key: z.string().optional(),
  anthropic_api_key: z.string().optional(),
})

export default function AdminDashboard() {
  const { user } = useAuth()

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-slate-500 mb-6">You need administrator privileges to access this page.</p>
            <Link to="/">
              <Button>Back to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-purple-500" /> Admin Dashboard
          </h1>
          <p className="text-sm text-slate-500">Manage your platform, users, and content</p>
        </div>
        <Badge className="bg-purple-500 text-white hover:bg-purple-600">Administrator</Badge>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
          <TabsTrigger value="overview" className="data-[state=active]:border-b-2 data-[state=active]:border-purple-500 rounded-none border-b-2 border-transparent px-4 py-2">Overview</TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:border-b-2 data-[state=active]:border-purple-500 rounded-none border-b-2 border-transparent px-4 py-2">Users</TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:border-b-2 data-[state=active]:border-purple-500 rounded-none border-b-2 border-transparent px-4 py-2">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <OverviewTab />
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <UsersTab />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <SettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function OverviewTab() {
  const { data: stats, isLoading, isError } = trpc.admin.stats.useQuery()

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    )
  }

  if (isError || !stats) {
    return (
      <div className="text-center text-red-500 p-6">
        Failed to load statistics.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-500" />
            </div>
          </div>
          <div className="text-3xl font-bold">{stats.totalUsers.toLocaleString()}</div>
          <div className="text-sm text-slate-500 mt-1">Total Users</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-emerald-500" />
            </div>
          </div>
          <div className="text-3xl font-bold">{stats.totalCourses.toLocaleString()}</div>
          <div className="text-sm text-slate-500 mt-1">Total Courses</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-purple-500" />
            </div>
          </div>
          <div className="text-3xl font-bold">{stats.totalEnrollments.toLocaleString()}</div>
          <div className="text-sm text-slate-500 mt-1">Total Enrollments</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-amber-500" />
            </div>
          </div>
          <div className="text-3xl font-bold">
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(stats.totalRevenue)}
          </div>
          <div className="text-sm text-slate-500 mt-1">Total Revenue</div>
        </CardContent>
      </Card>
    </div>
  )
}

function UsersTab() {
  const { data: users, isLoading, refetch } = trpc.admin.users.useQuery()
  const toggleSuspension = trpc.admin.toggleUserSuspension.useMutation({
    onSuccess: () => {
      toast.success("User status updated")
      refetch()
    },
    onError: (error) => {
      toast.error(error.message)
    }
  })
  const updateRole = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => {
      toast.success("User role updated")
      refetch()
    },
    onError: (error) => {
      toast.error(error.message)
    }
  })

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Users</CardTitle>
        <CardDescription>View and manage user accounts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b text-sm text-muted-foreground text-left">
                <th className="pb-3 font-medium">Name</th>
                <th className="pb-3 font-medium">Email</th>
                <th className="pb-3 font-medium">Role</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users?.map(u => (
                <tr key={u.id} className="border-b last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-4 px-2">
                    <div className="font-medium">{u.name}</div>
                  </td>
                  <td className="py-4 px-2 text-slate-500">{u.email}</td>
                  <td className="py-4 px-2">
                    <Select
                      value={u.role}
                      onValueChange={(val) => updateRole.mutate({ userId: u.id, role: val as any })}
                      disabled={updateRole.isPending}
                    >
                      <SelectTrigger className="w-[130px] h-8">
                        <SelectValue placeholder="Role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="instructor">Instructor</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="py-4 px-2">
                    <Badge variant={u.isSuspended ? 'destructive' : 'default'} className={!u.isSuspended ? 'bg-emerald-500 hover:bg-emerald-600' : ''}>
                      {u.isSuspended ? 'Suspended' : 'Active'}
                    </Badge>
                  </td>
                  <td className="py-4 px-2 text-right">
                    <Button
                      variant={u.isSuspended ? "outline" : "destructive"}
                      size="sm"
                      onClick={() => toggleSuspension.mutate({ userId: u.id, suspended: !u.isSuspended })}
                      disabled={toggleSuspension.isPending}
                      className="h-8"
                    >
                      {u.isSuspended ? <UserCheck className="h-4 w-4 mr-1" /> : <UserX className="h-4 w-4 mr-1" />}
                      {u.isSuspended ? 'Unsuspend' : 'Suspend'}
                    </Button>
                  </td>
                </tr>
              ))}
              {users?.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

function SettingsTab() {
  const { data: settings, isLoading } = trpc.admin.getSettings.useQuery()
  const updateSettings = trpc.admin.updateSettings.useMutation()

  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      smtp_host: '',
      smtp_user: '',
      smtp_password: '',
      smtp_from_email: '',
      stripe_secret_key: '',
      anthropic_api_key: '',
    }
  })

  // Set default values once data is loaded
  useEffect(() => {
    if (settings) {
      form.reset({
        smtp_host: settings.smtp_host || '',
        smtp_user: settings.smtp_user || '',
        smtp_password: settings.smtp_password || '',
        smtp_from_email: settings.smtp_from_email || '',
        stripe_secret_key: settings.stripe_secret_key || '',
        anthropic_api_key: settings.anthropic_api_key || '',
      })
    }
  }, [settings, form])

  function onSubmit(values: z.infer<typeof settingsSchema>) {
    updateSettings.mutate(values, {
      onSuccess: () => {
        toast.success("Settings updated successfully")
      },
      onError: (error) => {
        toast.error(`Failed to update settings: ${error.message}`)
      }
    })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    )
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Platform Settings</CardTitle>
        <CardDescription>Configure integrations and email settings</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Email (SMTP)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="smtp_host"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SMTP Host</FormLabel>
                      <FormControl>
                        <Input placeholder="smtp.example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="smtp_from_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From Email</FormLabel>
                      <FormControl>
                        <Input placeholder="noreply@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="smtp_user"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SMTP User</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="smtp_password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SMTP Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-medium">Integrations</h3>
              <FormField
                control={form.control}
                name="stripe_secret_key"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stripe Secret Key</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="anthropic_api_key"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Anthropic API Key</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" disabled={updateSettings.isPending}>
              {updateSettings.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Settings
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
