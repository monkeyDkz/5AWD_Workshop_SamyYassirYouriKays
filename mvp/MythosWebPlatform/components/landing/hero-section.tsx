import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src="/images/hero-bg.jpg"
          alt=""
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-background/70" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-transparent to-background" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center gap-8 px-6 pt-24 text-center">
        <div className="flex flex-col items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Beta ouverte — Jouez gratuitement
          </div>
        </div>

        <h1 className="font-display text-6xl font-bold leading-tight tracking-tight text-foreground sm:text-7xl lg:text-8xl text-balance">
          MYTHOS
        </h1>

        <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl text-pretty">
          Plongez dans des histoires ou l{"'"}IA est votre Maitre du Jeu.
          Faites des choix, changez le cours de l{"'"}histoire, jouez avec vos amis.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/register">
            <Button size="lg" className="glow-violet px-8 text-base font-semibold">
              Jouer maintenant
            </Button>
          </Link>
          <Link href="#how-it-works">
            <Button variant="outline" size="lg" className="px-8 text-base border-border/60 text-foreground hover:bg-secondary bg-transparent">
              Decouvrir
            </Button>
          </Link>
        </div>

        {/* Scroll indicator */}
        <div className="mt-12 animate-bounce text-muted-foreground">
          <ChevronDown className="h-6 w-6" />
        </div>
      </div>
    </section>
  )
}
