import { ScenarioCard } from "@/components/scenario-card"

const scenarios = [
  {
    title: "TRIBUNAL",
    description:
      "Proces medieval — Jures, Avocats et Accuse. Qui dit la verite ? Decouvrez la verite dans ce scenario d'intrigue et de deduction.",
    image: "/images/scenario-tribunal.jpg",
    duration: "20 min",
    players: "3-8 joueurs",
    difficulty: "Normal" as const,
    href: "/scenarios/tribunal",
  },
  {
    title: "DEEP",
    description:
      "Station sous-marine en peril — Survivez, mais mefiez-vous du saboteur. Dans les abysses, personne ne vous entend crier.",
    image: "/images/scenario-deep.jpg",
    duration: "15-25 min",
    players: "2-6 joueurs",
    difficulty: "Difficile" as const,
    href: "/scenarios/deep",
  },
]

export function ScenariosSection() {
  return (
    <section id="scenarios" className="relative py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl text-balance">
            Scenarios disponibles
          </h2>
          <p className="mt-4 text-muted-foreground text-pretty">
            Choisissez votre aventure. Chaque scenario offre une experience unique.
          </p>
        </div>

        <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
          {scenarios.map((scenario) => (
            <ScenarioCard key={scenario.title} {...scenario} />
          ))}
        </div>
      </div>
    </section>
  )
}
