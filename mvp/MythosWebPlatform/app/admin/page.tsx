"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Users,
  Gamepad2,
  Trophy,
  Clock,
  ArrowLeft,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatCard } from "@/components/stat-card"
import { api, type AdminStats, type AdminUser, type AdminGame } from "@/lib/api"

const gameStatusLabel: Record<string, string> = {
  LOBBY: "En attente",
  IN_PROGRESS: "En cours",
  FINISHED: "Terminee",
  CANCELLED: "Annulee",
}

const statusBadge: Record<string, string> = {
  "En cours": "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  "Terminee": "border-muted-foreground/30 bg-muted/30 text-muted-foreground",
  "En attente": "border-amber-500/30 bg-amber-500/10 text-amber-400",
  "Annulee": "border-red-500/30 bg-red-500/10 text-red-400",
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [games, setGames] = useState<AdminGame[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.admin.stats().catch(() => null),
      api.admin.users().catch(() => []),
      api.admin.games().catch(() => []),
    ]).then(([s, u, g]) => {
      setStats(s)
      setUsers(u)
      setGames(g)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Retour</span>
          </Button>
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Administration MYTHOS
          </h1>
          <p className="text-sm text-muted-foreground">
            {"Vue d'ensemble de la plateforme"}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Utilisateurs inscrits" value={stats?.totalUsers ?? 0} />
        <StatCard icon={Gamepad2} label="Parties en cours" value={stats?.activeGames ?? 0} />
        <StatCard icon={Trophy} label="Parties terminees aujourd'hui" value={stats?.finishedToday ?? 0} />
        <StatCard icon={Clock} label="Total parties" value={stats?.totalGames ?? 0} />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="games">
        <TabsList className="w-full bg-card border border-border">
          <TabsTrigger value="games" className="flex-1">
            Parties
          </TabsTrigger>
          <TabsTrigger value="users" className="flex-1">
            Utilisateurs
          </TabsTrigger>
        </TabsList>

        {/* Games tab */}
        <TabsContent value="games" className="mt-6">
          {games.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Gamepad2 className="mb-4 h-12 w-12 text-muted-foreground/40" />
              <p className="text-muted-foreground">Aucune partie pour le moment.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-card">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Code</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Scenario</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Joueurs</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Statut</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {games.map((g) => {
                    const label = gameStatusLabel[g.status] ?? g.status
                    return (
                      <tr
                        key={g.id}
                        className="border-b border-border/50 last:border-b-0 hover:bg-secondary/30"
                      >
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{g.code}</td>
                        <td className="px-4 py-3 font-medium text-foreground">{g.scenarioSlug.toUpperCase()}</td>
                        <td className="px-4 py-3 text-muted-foreground">{g.playerCount}/{g.maxPlayers}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={statusBadge[label] ?? ""}>
                            {label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(g.createdAt).toLocaleDateString("fr-FR")}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* Users tab */}
        <TabsContent value="users" className="mt-6">
          {users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="mb-4 h-12 w-12 text-muted-foreground/40" />
              <p className="text-muted-foreground">Aucun utilisateur pour le moment.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-card">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Pseudo</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Inscription</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Parties</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-border/50 last:border-b-0 hover:bg-secondary/30"
                    >
                      <td className="px-4 py-3 font-medium text-foreground">{u.username}</td>
                      <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(u.createdAt).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{u.gamesPlayed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
