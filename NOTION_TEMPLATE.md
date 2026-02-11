# MYTHOS - Documentation Projet Complète

> Ce document constitue la documentation exhaustive du projet MYTHOS.
> Chaque section correspond a une page Notion separee.

---

## 1. Dashboard Projet

| Propriete | Valeur |
|-----------|--------|
| **Projet** | MYTHOS |
| **Statut** | GO Conditionnel |
| **Score Faisabilite** | 3.80 / 5.00 |
| **Equipe** | 4 personnes |
| **Duree** | 14 semaines |
| **Budget MVP** | ~308 EUR |
| **Scenarios MVP** | TRIBUNAL + DEEP |
| **Sprint actuel** | Sprint 0 |
| **Capacite hebdo** | 97h / semaine |

### Progression par Sprint

| Sprint | Semaines | Jalon | Story Points | Statut |
|--------|----------|-------|--------------|--------|
| Sprint 0 | Sem. 1-2 | POC Gate | 23 SP | En cours |
| Sprint 1 | Sem. 3-4 | Alpha | 29 SP | A venir |
| Sprint 2 | Sem. 5-6 | Beta Closed | 37 SP | A venir |
| Sprint 3 | Sem. 7-8 | Beta Open | 37 SP | A venir |
| Sprint 4 | Sem. 9-10 | Release Candidate | 29 SP | A venir |
| Sprint 5 | Sem. 11-12 | Production | 26 SP | A venir |
| Buffer | Sem. 13-14 | Livraison | 15 SP | A venir |
| **TOTAL** | **14 semaines** | | **196 SP** | |

### Planning Scenarios

#### Scenario Nominal (60%)

- **Probabilite :** 60%
- **Echeance MVP :** 02/05/2026
- **Perimetre :** Toutes les fonctionnalites MUST-HAVE + SHOULD-HAVE livrees
- **Velocite cible :** ~28 SP / sprint
- **Conditions :** Equipe complete, pas de blocage technique majeur, API IA disponible
- **Resultat attendu :** MVP fonctionnel avec les deux scenarios (TRIBUNAL + DEEP), deploye en production

#### Scenario Degrade (30%)

- **Probabilite :** 30%
- **Impact planning :** Retard de 2 semaines (livraison repoussee au 16/05/2026)
- **Sacrifices fonctionnels :** Abandon des fonctionnalites SHOULD-HAVE
  - Pas d'OAuth Google/Discord (US-04)
  - Pas de parametrage temps par phase (US-11)
  - Pas de memoire contextuelle multi-tours (US-21)
  - Pas de fallback GPT-4o (US-22)
  - Pas de preuves et indices en cours de jeu (US-28)
  - Pas de systeme reparations collaboratif (US-33)
  - Pas de reactions et emojis (US-37)
  - Pas d'historique conversations (US-38)
  - Pas de mode spectateur (US-12)
  - Administration reportee post-MVP
- **Declencheur :** Velocite < 22 SP pendant 2 sprints consecutifs, ou perte de 1 semaine sur un blocage technique
- **Action :** Revue MoSCoW en urgence, focalisation exclusive sur MUST-HAVE

#### Scenario Critique (10%)

- **Probabilite :** 10%
- **Declencheur :** Perte d'un membre de l'equipe (maladie, abandon, conflit)
- **Plan de contingence :**
  - Redistribution immediate des taches du membre absent sur les 3 membres restants
  - Reduction du perimetre aux fonctionnalites MUST-HAVE exclusivement
  - Augmentation des heures hebdo des membres restants (+5h/personne si possible)
  - Priorisation : Backend IA > Frontend > Administration
  - Si perte du SM (Samy) : Kays reprend le role SM + backend IA, Youri prend plus de backend
  - Si perte du PO (Kays) : Samy reprend le role PO, focus sur les scenarios existants
  - Si perte de Youri : Yassir reprend le frontend lead, Kays aide sur le frontend
  - Si perte de Yassir : Youri absorbe le DevOps, deploiement simplifie
- **Resultat :** MVP minimal avec un seul scenario (TRIBUNAL uniquement), fonctionnalites reduites

---

## 2. Equipe

### Kays -- PO / Architecte

- **Heures/semaine :** 25h
- **Responsabilites :** Vision produit, architecture, backlog, veille marche
- **Competences cles :** Architecture systeme, game design, gestion de projet

### Samy -- SM / Backend + IA

- **Heures/semaine :** 28h
- **Responsabilites :** Scrum Master, NestJS, Claude API, prompt engineering
- **Competences cles :** Node.js, NestJS, API LLM, WebSocket

### Youri -- Frontend Lead

- **Heures/semaine :** 22h
- **Responsabilites :** React/Next.js, UI/UX implementation, WebSocket client
- **Competences cles :** React, Next.js, TailwindCSS, Socket.io

### Yassir -- Frontend / UX + DevOps

- **Heures/semaine :** 22h
- **Responsabilites :** Figma design, accessibilite, CI/CD, deploiement
- **Competences cles :** Figma, GitHub Actions, Railway, Vercel, WCAG

---

## 3. Architecture Technique

### Stack

| Couche | Technologies |
|--------|-------------|
| **Frontend** | Next.js 14, React 18, TailwindCSS, Zustand, Socket.io Client |
| **Backend** | NestJS 10, Prisma 5, JWT Auth, Socket.io Server |
| **Base de donnees** | PostgreSQL 16 (Railway) |
| **Cache/Sessions** | Redis 7 (Upstash) |
| **IA** | Claude Sonnet (narratif), Claude Haiku (logique), GPT-4o (fallback) |
| **Hebergement** | Vercel (frontend), Railway (backend) |
| **CI/CD** | GitHub Actions |
| **Monitoring** | Sentry |

### Protocoles de Communication

| Protocole | Usage | Cible |
|-----------|-------|-------|
| REST API | Operations stateless (CRUD, auth) | Toutes les operations non temps-reel |
| WebSocket | Temps reel (game state, chat) | Latence < 200ms |
| SSE Streaming | Reponses IA narrative | Affichage progressif |

### Schema de Base de Donnees

| Table | Description | Relations |
|-------|-------------|-----------|
| `users` | Comptes utilisateurs + profils | -> game_players, user_stats |
| `games` | Sessions de jeu | -> game_players, game_events |
| `game_players` | Participation joueur dans une partie | -> users, games |
| `game_events` | Log d'evenements de jeu | -> games |
| `user_stats` | Statistiques agregees | -> users |
| `messages` | Chat in-game | -> games, users |

### Architecture Decision Records (ADR)

#### ADR-001 : NestJS pour le Backend

| Champ | Detail |
|-------|--------|
| **Statut** | Accepte |
| **Date** | Fevrier 2026 |
| **Contexte** | Choix du framework backend pour une application temps-reel avec WebSocket et API REST |
| **Alternatives evaluees** | Express.js, Fastify, NestJS |
| **Decision** | NestJS 10 |
| **Justification** | |

- **Modularite :** Architecture modulaire native avec modules, controllers et providers. Permet une separation claire des responsabilites (auth, game engine, IA, chat)
- **TypeScript natif :** Support TypeScript first-class avec decorateurs, injection de dependances et typage fort bout en bout
- **WebSocket integre :** Module `@nestjs/websockets` avec support natif Socket.io, gateways et decorateurs pour les events
- **Ecosysteme mature :** Guards, interceptors, pipes, middleware standardises. Documentation exhaustive
- **Scalabilite :** Architecture facilitant le passage a micro-services si necessaire post-MVP

| Alternatives rejetees | Raison |
|----------------------|--------|
| Express.js | Pas de structure imposee, risque de code spaghetti sur un projet a 4 developpeurs. WebSocket necessite configuration manuelle |
| Fastify | Performant mais ecosysteme plus jeune, moins de modules pre-construits pour WebSocket et auth |

| **Consequences** | Configuration initiale plus lourde, courbe d'apprentissage decorateurs/DI pour l'equipe |

#### ADR-002 : PostgreSQL pour la Base de Donnees

| Champ | Detail |
|-------|--------|
| **Statut** | Accepte |
| **Date** | Fevrier 2026 |
| **Contexte** | Choix du SGBD pour stocker les donnees utilisateurs, parties, evenements de jeu et statistiques |
| **Alternatives evaluees** | MongoDB, MySQL, PostgreSQL |
| **Decision** | PostgreSQL 16 |
| **Justification** | |

- **JSONB :** Support natif des colonnes JSONB pour stocker les scenario packs, configurations IA et etats de jeu complexes sans schema rigide
- **Prisma ORM :** Integration parfaite avec Prisma 5, generation automatique du client TypeScript, migrations versionnees
- **Migrations :** Systeme de migration robuste via Prisma Migrate, indispensable pour un projet en equipe avec schema evolutif
- **Railway :** Hebergement PostgreSQL gratuit sur Railway avec backups automatiques et monitoring integre
- **Fiabilite :** ACID compliance, transactions complexes pour les operations de jeu concurrentes

| Alternatives rejetees | Raison |
|----------------------|--------|
| MongoDB | Schema flexible mais perte de l'integrite referentielle necessaire pour les relations users/games/events. Pas de transactions multi-documents natives fiables |
| MySQL | Pas de support JSONB natif. Ecosysteme Railway moins bien integre. Prisma fonctionne mais PostgreSQL est le SGBD recommande |

| **Consequences** | Necessite hebergement PostgreSQL (Railway free tier), equipe doit maitriser SQL relationnel |

#### ADR-003 : Claude API pour l'Intelligence Artificielle

| Champ | Detail |
|-------|--------|
| **Statut** | Accepte |
| **Date** | Fevrier 2026 |
| **Contexte** | Choix du fournisseur LLM pour la generation narrative temps-reel, le roleplay et la resolution d'actions |
| **Alternatives evaluees** | GPT-4 (OpenAI), Claude (Anthropic), Modeles open-source (Llama, Mistral) |
| **Decision** | Claude Sonnet (narratif principal) + Claude Haiku (logique/rapide) + GPT-4o (fallback) |
| **Justification** | |

- **Contexte 200k tokens :** Fenetre de contexte massive permettant de maintenir l'historique complet d'une partie multi-tours sans truncation
- **Roleplay superieur :** Claude excelle en generation narrative, maintien de personnalite, coherence de personnages sur la duree. Tests internes montrent une qualite narrative superieure a GPT-4 pour notre cas d'usage
- **Streaming natif :** API streaming stable pour l'affichage progressif des reponses narratives (SSE)
- **Cout optimise :** Strategie dual-model : Sonnet pour les narrations complexes, Haiku pour la logique rapide (validation d'actions, calculs de jauges). Cout moyen estime a ~0.10 EUR/session
- **API stable :** SDK TypeScript officiel `@anthropic-ai/sdk`, bonne documentation, rate limits genereux

| Alternatives rejetees | Raison |
|----------------------|--------|
| GPT-4 seul | Contexte 128k (vs 200k), qualite narrative comparable mais moins coherente en roleplay long. Conserve comme fallback |
| Open-source (Llama, Mistral) | Necessite infrastructure GPU dediee, cout d'hebergement prohibitif pour un projet etudiant. Qualite narrative insuffisante pour du roleplay |

| **Consequences** | Dependance a un fournisseur externe (risque d'indisponibilite), necessite monitoring des couts API, fallback GPT-4o a implementer |

#### ADR-004 : Vercel + Railway pour l'Hebergement

| Champ | Detail |
|-------|--------|
| **Statut** | Accepte |
| **Date** | Fevrier 2026 |
| **Contexte** | Choix de la plateforme d'hebergement pour le frontend et le backend dans un contexte de budget etudiant |
| **Alternatives evaluees** | AWS (EC2/ECS), Heroku, VPS (OVH/Hetzner), Vercel + Railway |
| **Decision** | Vercel (frontend) + Railway (backend + PostgreSQL + Redis) |
| **Justification** | |

- **Free tier genereux :** Vercel gratuit pour les projets hobby (100 GB bandwidth, serverless functions). Railway offre $5/mois de credits gratuits, suffisant pour le MVP
- **Auto-deploy :** Deploiement automatique sur push GitHub. Preview deployments sur chaque PR (Vercel). Railway deploy automatique sur push develop/main
- **Zero config :** Vercel detecte automatiquement Next.js. Railway propose des templates PostgreSQL et Redis one-click
- **Scalabilite :** Possibilite de scaler facilement post-MVP sans changer d'infrastructure
- **DX :** Dashboard intuitif, logs temps-reel, variables d'environnement par environnement

| Alternatives rejetees | Raison |
|----------------------|--------|
| AWS (EC2/ECS) | Complexite operationnelle excessive pour une equipe de 4 sans DevOps dedie. Cout imprevisible. Free tier limite |
| Heroku | Suppression du free tier en 2022. Plans payants plus chers que Railway pour des specs equivalentes |
| VPS (OVH/Hetzner) | Necessite gestion systeme (OS, securite, backups). Pas d'auto-deploy natif. Temps DevOps trop important |

| **Consequences** | Limitation aux contraintes des free tiers (cold starts, bandwidth), besoin de surveiller la consommation Railway |

#### ADR-005 : Socket.io pour le Temps Reel

| Champ | Detail |
|-------|--------|
| **Statut** | Accepte |
| **Date** | Fevrier 2026 |
| **Contexte** | Choix de la technologie temps-reel pour la synchronisation d'etat de jeu, le chat et les notifications |
| **Alternatives evaluees** | WebSocket natif (ws), Server-Sent Events (SSE), Long Polling, Socket.io |
| **Decision** | Socket.io v4 |
| **Justification** | |

- **Rooms :** Systeme de rooms natif, parfait pour isoler chaque partie de jeu. Un joueur rejoint la room de sa partie, recoit uniquement les events pertinents
- **Namespaces :** Separation logique des flux : `/game` pour l'etat de jeu, `/chat` pour la messagerie, `/admin` pour le monitoring
- **Reconnection automatique :** Gestion native de la reconnexion avec backoff exponentiel. Critique pour une experience de jeu ou une deconnexion temporaire ne doit pas ruiner la partie
- **Integration NestJS :** Module `@nestjs/platform-socket.io` officiel avec decorateurs `@WebSocketGateway`, `@SubscribeMessage`, injection de dependances
- **Fallback transport :** Degrade automatiquement vers long-polling si WebSocket est bloque (proxy entreprise, reseau restrictif)

| Alternatives rejetees | Raison |
|----------------------|--------|
| WebSocket natif (ws) | Pas de rooms, pas de reconnection automatique, pas de namespaces. Tout doit etre implemente manuellement |
| SSE (Server-Sent Events) | Unidirectionnel server->client. Ne convient pas pour le chat et les actions joueurs (bidirectionnel requis). Utilise uniquement pour le streaming IA |
| Long Polling | Latence trop elevee (>500ms) pour du temps-reel de jeu. Consommation serveur importante |

| **Consequences** | Taille du bundle client augmentee (~50KB gzip), necessite gestion explicite de l'etat de connexion cote frontend |

#### ADR-006 : Prisma ORM pour l'Acces Base de Donnees

| Champ | Detail |
|-------|--------|
| **Statut** | Accepte |
| **Date** | Fevrier 2026 |
| **Contexte** | Choix de l'ORM/couche d'acces aux donnees pour PostgreSQL avec TypeScript |
| **Alternatives evaluees** | TypeORM, Drizzle ORM, Raw SQL (pg), Prisma |
| **Decision** | Prisma 5 |
| **Justification** | |

- **Schema-first :** Schema declaratif (`schema.prisma`) servant de source de verite unique pour le modele de donnees. Lisibilite superieure, documentation auto-generee
- **TypeScript generation :** Client TypeScript auto-genere a partir du schema. Types exhaustifs pour toutes les queries, relations incluses. Zero risque de mismatch types/DB
- **Migrations :** `prisma migrate` genere des fichiers SQL versionnees, historique complet des changements de schema. Indispensable en equipe
- **Prisma Studio :** Interface graphique pour explorer et editer les donnees en developpement. Gain de temps considerable pour le debug
- **Ecosysteme :** Integration native avec NestJS, support JSONB PostgreSQL, seeding, introspection de bases existantes

| Alternatives rejetees | Raison |
|----------------------|--------|
| TypeORM | Decorateurs lourds, types moins fiables (many runtime errors), documentation incomplete. Migration depuis schema-first plus complexe |
| Drizzle ORM | Plus performant en runtime, mais ecosysteme plus jeune, moins de tooling (pas d'equivalent Prisma Studio), courbe d'apprentissage |
| Raw SQL (pg) | Performance maximale mais zero type safety, pas de migrations automatiques, risque d'injection SQL, maintenance difficile en equipe |

| **Consequences** | Overhead de generation du client Prisma a chaque changement de schema, performance legerement inferieure au raw SQL (acceptable pour notre echelle) |

---

## 4. Moteur de Jeu Universel

### Boucle de Jeu (6 Phases)

| # | Phase | Description | Timer |
|---|-------|-------------|-------|
| 1 | **SETUP** | Distribution des roles, generation du contexte initial | 30s |
| 2 | **NARRATION** | L'IA genere la scene narrative + options d'action | ~5s streaming |
| 3 | **ACTION** | Les joueurs soumettent leurs actions | 60-90s |
| 4 | **RESOLUTION** | L'IA resout les consequences narrativement | ~5s streaming |
| 5 | **DISCUSSION** | Chat libre entre joueurs | 60-120s |
| 6 | **FINALE** | Climax, revelations, ecran de fin | 30s |

### Scenario Packs (JSON)

Chaque scenario est defini par un fichier JSON contenant :

- `id`, `name`, `theme`, `description`
- `roles[]` -- Liste des roles avec briefings secrets
- `phases{}` -- Configuration par phase (timer, prompts IA, mecaniques)
- `resources{}` -- Jauges de ressources (pour DEEP)
- `winConditions{}` -- Conditions de victoire/defaite
- `aiConfig{}` -- Model, temperature, max tokens, system prompt

---

## 5. Scenarios

### TRIBUNAL (MVP)

| Propriete | Valeur |
|-----------|--------|
| **Theme** | Proces medieval avec roles caches |
| **Joueurs** | 3-6 |
| **Mecaniques** | Roles secrets, votes, temoignages, deduction sociale |
| **Roles** | Juge, Avocat, Temoin, Accuse |
| **Condition de victoire** | Verdict correct / Innocente a tort |

### DEEP (MVP)

| Propriete | Valeur |
|-----------|--------|
| **Theme** | Survie en sous-marin |
| **Joueurs** | 2-5 |
| **Mecaniques** | Jauges ressources, cooperation, dilemmes, timer critique |
| **Jauges** | O2, Energie, Coque |
| **Condition de victoire** | Survie de l'equipage / Naufrage |

### Post-MVP

- **CHRONOS** -- Voyages temporels et paradoxes
- **MASCARADE** -- Bal masque et intrigues de cour
- **SIGNAL** -- Signal extraterrestre et premier contact

---

## 6. Registre des Risques

### Risques Critiques (Score 15-25)

| ID | Risque | P | I | Score | Mitigation |
|----|--------|---|---|-------|------------|
| RSQ-O02 | Depassement du planning | 4 | 4 | **16** | Suivi strict velocite, MoSCoW, sprint buffers |
| RSQ-T02 | Latence excessive IA | 4 | 4 | **16** | Streaming, cache Redis, pre-generation, prompts optimises |
| RSQ-T01 | Qualite narrative IA insuffisante | 3 | 5 | **15** | Few-shot prompting, memoire contextuelle, tests narratifs |

### Risques Eleves (Score 10-14)

| ID | Risque | P | I | Score | Mitigation |
|----|--------|---|---|-------|------------|
| RSQ-T03 | Desynchronisation WebSocket | 3 | 4 | **12** | Architecture server-authoritative, reconciliation d'etat |
| RSQ-T04 | API IA indisponible | 3 | 4 | **12** | Fallback GPT-4o, mode degrade, queue de retry |
| RSQ-S01 | Failles securite (injection) | 2 | 5 | **10** | Sanitisation inputs, CORS, rate limiting, audit |

### Risques Moyens (Score 5-9)

| ID | Risque | P | I | Score | Mitigation |
|----|--------|---|---|-------|------------|
| RSQ-O04 | Scope creep | 3 | 3 | **9** | MoSCoW strict, revue de sprint, PO discipline |
| RSQ-O05 | Burnout equipe | 2 | 3 | **6** | Suivi charge, retrospectives, buffers |
| RSQ-F01 | Depassement budget API | 2 | 2 | **4** | Caching, rate limiting, dual-model (Sonnet/Haiku) |

---

## 7. Backlog Complet (47 Tickets + 5 Buffer)

### Definition of Done (DoD)

Chaque ticket est considere comme termine quand :

1. Le code est merge sur la branche `develop` via une Pull Request approuvee
2. Les tests unitaires couvrent les cas nominaux et les cas d'erreur (couverture >= seuils KPI)
3. Les tests d'integration passent pour les endpoints API concernes
4. Le code respecte les regles ESLint et Prettier sans warning
5. La documentation technique est mise a jour (JSDoc, README si necessaire)
6. La fonctionnalite a ete testee manuellement sur l'environnement de staging
7. Les criteres d'acceptation du ticket sont tous valides par le PO

### Definition of Ready (DoR)

Un ticket est pret a etre pris en sprint quand :

1. La user story est redigee au format : "En tant que [role], je veux [action] afin de [benefice]"
2. Les criteres d'acceptation sont definis et mesurables
3. Les story points sont estimes par l'equipe (planning poker)
4. Les dependances techniques sont identifiees et resolues (ou planifiees avant)
5. Les maquettes/wireframes sont disponibles si la fonctionnalite a un impact UI
6. Le ticket est priorise selon MoSCoW et affecte a un sprint

### Velocite par Sprint

| Sprint | Story Points | Tickets | Semaines |
|--------|-------------|---------|----------|
| Sprint 0 | 23 SP | 7 | Sem. 1-2 |
| Sprint 1 | 29 SP | 7 | Sem. 3-4 |
| Sprint 2 | 37 SP | 7 | Sem. 5-6 |
| Sprint 3 | 37 SP | 7 | Sem. 7-8 |
| Sprint 4 | 29 SP | 7 | Sem. 9-10 |
| Sprint 5 | 26 SP | 7 | Sem. 11-12 |
| Buffer | 15 SP | 5 | Sem. 13-14 |
| **TOTAL** | **196 SP** | **47 + 5** | **14 semaines** |

---

### Sprint 0 -- POC Gate (23 SP, 7 tickets)

#### S0-01 : Inscription email + mot de passe

| Champ | Valeur |
|-------|--------|
| **ID** | S0-01 |
| **Epic** | Authentification |
| **Priorite** | MUST-HAVE |
| **Assigne** | Samy |
| **Story Points** | 3 |
| **Description** | En tant qu'utilisateur, je veux pouvoir creer un compte avec mon email et un mot de passe afin d'acceder a la plateforme MYTHOS. Le mot de passe doit etre hash avec bcrypt, l'email unique en base. |
| **Criteres d'acceptation** | - [ ] Formulaire d'inscription avec champs email et mot de passe |
| | - [ ] Validation email format + unicite en base |
| | - [ ] Mot de passe hash bcrypt (salt rounds >= 10) |
| | - [ ] Retour d'erreur explicite si email deja utilise |
| | - [ ] Endpoint POST /api/auth/register fonctionnel |
| | - [ ] Tests unitaires sur la validation et le hashing |

#### S0-02 : Connexion avec JWT + refresh token

| Champ | Valeur |
|-------|--------|
| **ID** | S0-02 |
| **Epic** | Authentification |
| **Priorite** | MUST-HAVE |
| **Assigne** | Samy |
| **Story Points** | 5 |
| **Description** | En tant qu'utilisateur inscrit, je veux me connecter avec mon email et mot de passe afin de recevoir un token d'acces JWT et un refresh token pour maintenir ma session. |
| **Criteres d'acceptation** | - [ ] Endpoint POST /api/auth/login retourne access token (15min) et refresh token (7j) |
| | - [ ] Verification bcrypt du mot de passe |
| | - [ ] Endpoint POST /api/auth/refresh pour renouveler l'access token |
| | - [ ] Refresh token stocke en base avec expiration |
| | - [ ] Gestion des erreurs : credentials invalides, compte inexistant |
| | - [ ] Tests d'integration sur le flow complet login/refresh |

#### S0-03 : Gestion sessions et deconnexion

| Champ | Valeur |
|-------|--------|
| **ID** | S0-03 |
| **Epic** | Authentification |
| **Priorite** | MUST-HAVE |
| **Assigne** | Samy |
| **Story Points** | 2 |
| **Description** | En tant qu'utilisateur connecte, je veux pouvoir me deconnecter afin d'invalider ma session et proteger mon compte. |
| **Criteres d'acceptation** | - [ ] Endpoint POST /api/auth/logout invalide le refresh token |
| | - [ ] Le refresh token est supprime/invalide en base |
| | - [ ] L'access token reste valide jusqu'a expiration (stateless) |
| | - [ ] Test : apres logout, le refresh token ne peut plus etre utilise |

#### S0-04 : Creer une partie avec choix scenario

| Champ | Valeur |
|-------|--------|
| **ID** | S0-04 |
| **Epic** | Gestion des Parties |
| **Priorite** | MUST-HAVE |
| **Assigne** | Samy |
| **Story Points** | 3 |
| **Description** | En tant qu'utilisateur connecte, je veux creer une nouvelle partie en choisissant un scenario (TRIBUNAL ou DEEP) afin de demarrer une session de jeu. |
| **Criteres d'acceptation** | - [ ] Endpoint POST /api/games avec choix du scenario |
| | - [ ] Generation d'un code de partie unique (6 caracteres alphanumeriques) |
| | - [ ] Le createur est automatiquement ajoute comme premier joueur |
| | - [ ] La partie est creee avec le statut "LOBBY" |
| | - [ ] Retour du game ID et du code de partie |
| | - [ ] Tests sur la generation du code unique et la creation en base |

#### S0-05 : Rejoindre via code de partie

| Champ | Valeur |
|-------|--------|
| **ID** | S0-05 |
| **Epic** | Gestion des Parties |
| **Priorite** | MUST-HAVE |
| **Assigne** | Samy |
| **Story Points** | 3 |
| **Description** | En tant qu'utilisateur connecte, je veux rejoindre une partie existante en saisissant son code afin de participer a une session de jeu avec d'autres joueurs. |
| **Criteres d'acceptation** | - [ ] Endpoint POST /api/games/join avec le code de partie |
| | - [ ] Verification que la partie existe et est en statut LOBBY |
| | - [ ] Verification que le nombre max de joueurs n'est pas atteint |
| | - [ ] Le joueur est ajoute a la liste des participants |
| | - [ ] Erreur explicite si code invalide, partie pleine ou deja demarree |
| | - [ ] Tests sur les cas nominaux et les cas d'erreur |

#### S0-06 : Setup projet et CI/CD

| Champ | Valeur |
|-------|--------|
| **ID** | S0-06 |
| **Epic** | Infrastructure |
| **Priorite** | MUST-HAVE |
| **Assigne** | Yassir |
| **Story Points** | 5 |
| **Description** | En tant que developpeur, je veux un environnement de developpement configure avec CI/CD afin de pouvoir developper, tester et deployer automatiquement le code. |
| **Criteres d'acceptation** | - [ ] Monorepo initialise (NestJS backend + Next.js frontend) |
| | - [ ] ESLint + Prettier configures avec pre-commit hooks (Husky) |
| | - [ ] GitHub Actions CI : lint, typecheck, test sur chaque PR |
| | - [ ] Deploiement automatique staging sur push develop |
| | - [ ] Variables d'environnement configurees sur Railway et Vercel |
| | - [ ] README avec instructions de setup local |

#### S0-07 : Schema base de donnees initial

| Champ | Valeur |
|-------|--------|
| **ID** | S0-07 |
| **Epic** | Infrastructure |
| **Priorite** | MUST-HAVE |
| **Assigne** | Kays |
| **Story Points** | 2 |
| **Description** | En tant que developpeur, je veux un schema Prisma initial avec les tables fondamentales afin de pouvoir persister les donnees utilisateurs et parties. |
| **Criteres d'acceptation** | - [ ] Schema Prisma avec tables : users, games, game_players, game_events, user_stats, messages |
| | - [ ] Migration initiale generee et appliquee |
| | - [ ] Seed script avec donnees de test |
| | - [ ] Client Prisma genere et utilisable dans NestJS |
| | - [ ] Documentation du schema (commentaires dans schema.prisma) |

---

### Sprint 1 -- Alpha (29 SP, 7 tickets)

#### S1-01 : Lobby temps reel avec liste joueurs

| Champ | Valeur |
|-------|--------|
| **ID** | S1-01 |
| **Epic** | Gestion des Parties |
| **Priorite** | MUST-HAVE |
| **Assigne** | Youri |
| **Story Points** | 5 |
| **Description** | En tant que joueur dans un lobby, je veux voir en temps reel la liste des joueurs qui rejoignent et quittent la partie afin de savoir quand tout le monde est pret. |
| **Criteres d'acceptation** | - [ ] Interface lobby affichant la liste des joueurs connectes |
| | - [ ] Mise a jour temps reel via WebSocket quand un joueur rejoint/quitte |
| | - [ ] Affichage du code de partie pour le partager |
| | - [ ] Indicateur du nombre de joueurs (actuel / min / max) |
| | - [ ] Bouton "Pret" pour chaque joueur |
| | - [ ] Animation d'entree/sortie des joueurs |

#### S1-02 : Lancement de partie par le createur

| Champ | Valeur |
|-------|--------|
| **ID** | S1-02 |
| **Epic** | Gestion des Parties |
| **Priorite** | MUST-HAVE |
| **Assigne** | Samy |
| **Story Points** | 2 |
| **Description** | En tant que createur d'une partie, je veux pouvoir lancer le jeu quand suffisamment de joueurs sont prets afin de demarrer la session. |
| **Criteres d'acceptation** | - [ ] Bouton "Lancer la partie" visible uniquement pour le createur |
| | - [ ] Le bouton est actif seulement si le nombre minimum de joueurs est atteint |
| | - [ ] Le lancement change le statut de la partie de LOBBY a PLAYING |
| | - [ ] Tous les joueurs recoivent une notification WebSocket de demarrage |
| | - [ ] Transition vers l'ecran de jeu pour tous les participants |

#### S1-03 : Gestion min/max joueurs par scenario

| Champ | Valeur |
|-------|--------|
| **ID** | S1-03 |
| **Epic** | Gestion des Parties |
| **Priorite** | MUST-HAVE |
| **Assigne** | Samy |
| **Story Points** | 2 |
| **Description** | En tant que systeme, je dois appliquer les contraintes de nombre de joueurs definies par chaque scenario afin de garantir une experience de jeu equilibree. |
| **Criteres d'acceptation** | - [ ] Chaque scenario definit minPlayers et maxPlayers |
| | - [ ] Impossible de rejoindre une partie pleine (maxPlayers atteint) |
| | - [ ] Impossible de lancer si minPlayers non atteint |
| | - [ ] TRIBUNAL : min 3, max 6 joueurs |
| | - [ ] DEEP : min 2, max 5 joueurs |
| | - [ ] Messages d'erreur explicites dans le lobby |

#### S1-04 : Generation narrative IA en streaming

| Champ | Valeur |
|-------|--------|
| **ID** | S1-04 |
| **Epic** | Moteur de Jeu IA |
| **Priorite** | MUST-HAVE |
| **Assigne** | Samy |
| **Story Points** | 8 |
| **Description** | En tant que joueur, je veux voir les narrations de l'IA s'afficher progressivement en streaming afin de vivre une experience immersive sans attente de chargement longue. |
| **Criteres d'acceptation** | - [ ] Integration Claude Sonnet API avec streaming SSE |
| | - [ ] System prompt configure pour la narration de jeu |
| | - [ ] Texte affiche mot par mot cote client (effet machine a ecrire) |
| | - [ ] Temps de premier token < 1s (P50) |
| | - [ ] Gestion des erreurs API (timeout, rate limit) avec retry |
| | - [ ] Tests unitaires sur le service IA (mock API) |
| | - [ ] Metriques de latence logguees |

#### S1-05 : Page d'accueil et navigation

| Champ | Valeur |
|-------|--------|
| **ID** | S1-05 |
| **Epic** | Frontend Core |
| **Priorite** | MUST-HAVE |
| **Assigne** | Youri |
| **Story Points** | 5 |
| **Description** | En tant qu'utilisateur, je veux une page d'accueil attrayante avec navigation claire afin de comprendre le produit et acceder aux fonctionnalites rapidement. |
| **Criteres d'acceptation** | - [ ] Page d'accueil avec presentation de MYTHOS |
| | - [ ] Navigation : Accueil, Jouer, Profil, Connexion/Inscription |
| | - [ ] Design responsive (mobile, tablette, desktop) |
| | - [ ] Chargement de page LCP < 2.5s |
| | - [ ] Score Lighthouse performance >= 90 |
| | - [ ] Theme sombre par defaut (univers narratif) |

#### S1-06 : Pages authentification (login/register)

| Champ | Valeur |
|-------|--------|
| **ID** | S1-06 |
| **Epic** | Frontend Core |
| **Priorite** | MUST-HAVE |
| **Assigne** | Yassir |
| **Story Points** | 4 |
| **Description** | En tant qu'utilisateur, je veux des pages de connexion et d'inscription ergonomiques afin de creer mon compte et me connecter facilement. |
| **Criteres d'acceptation** | - [ ] Page /login avec formulaire email + mot de passe |
| | - [ ] Page /register avec formulaire inscription |
| | - [ ] Validation cote client (format email, mot de passe min 8 car) |
| | - [ ] Affichage des erreurs serveur (email deja pris, etc.) |
| | - [ ] Stockage JWT dans httpOnly cookie ou secure storage |
| | - [ ] Redirection apres connexion vers la page d'accueil |
| | - [ ] Accessible au clavier (navigation tab, focus visible) |

#### S1-07 : WebSocket Gateway de base

| Champ | Valeur |
|-------|--------|
| **ID** | S1-07 |
| **Epic** | Infrastructure |
| **Priorite** | MUST-HAVE |
| **Assigne** | Samy |
| **Story Points** | 3 |
| **Description** | En tant que developpeur, je veux une gateway WebSocket configuree avec Socket.io afin de gerer les communications temps-reel pour le lobby et le jeu. |
| **Criteres d'acceptation** | - [ ] Gateway Socket.io configuree dans NestJS |
| | - [ ] Authentification JWT sur la connexion WebSocket |
| | - [ ] Namespace /game pour les events de jeu |
| | - [ ] Systeme de rooms par partie (game:{gameId}) |
| | - [ ] Events : join_room, leave_room, player_joined, player_left |
| | - [ ] Gestion deconnexion/reconnexion gracieuse |
| | - [ ] Tests d'integration WebSocket |

---

### Sprint 2 -- Beta Closed (37 SP, 7 tickets)

#### S2-01 : Boucle de jeu 6 phases fonctionnelle

| Champ | Valeur |
|-------|--------|
| **ID** | S2-01 |
| **Epic** | Moteur de Jeu IA |
| **Priorite** | MUST-HAVE |
| **Assigne** | Kays |
| **Story Points** | 13 |
| **Description** | En tant que joueur, je veux que la partie se deroule selon les 6 phases du moteur de jeu (Setup, Narration, Action, Resolution, Discussion, Finale) afin de vivre une experience de jeu structuree et immersive. |
| **Criteres d'acceptation** | - [ ] Machine a etats implementee pour les 6 phases |
| | - [ ] Transitions automatiques entre phases selon les timers |
| | - [ ] Phase SETUP : distribution des roles, contexte initial |
| | - [ ] Phase NARRATION : appel IA streaming pour generer la scene |
| | - [ ] Phase ACTION : collecte des actions de tous les joueurs |
| | - [ ] Phase RESOLUTION : appel IA pour resoudre les consequences |
| | - [ ] Phase DISCUSSION : chat ouvert avec timer |
| | - [ ] Phase FINALE : calcul victoire/defaite, ecran de fin |
| | - [ ] Synchronisation d'etat via WebSocket pour tous les joueurs |
| | - [ ] Tests de la machine a etats (transitions, edge cases) |

#### S2-02 : Chargement des Scenario Packs JSON

| Champ | Valeur |
|-------|--------|
| **ID** | S2-02 |
| **Epic** | Moteur de Jeu IA |
| **Priorite** | MUST-HAVE |
| **Assigne** | Kays |
| **Story Points** | 5 |
| **Description** | En tant que systeme, je dois charger et valider les fichiers JSON de scenario afin de configurer dynamiquement le moteur de jeu selon le scenario choisi. |
| **Criteres d'acceptation** | - [ ] Structure JSON de scenario definie et documentee |
| | - [ ] Validation JSON Schema a la lecture du fichier |
| | - [ ] Chargement des roles, phases, ressources, conditions de victoire |
| | - [ ] Configuration IA (model, temperature, system prompt) par scenario |
| | - [ ] Fichiers TRIBUNAL.json et DEEP.json crees et valides |
| | - [ ] Tests de validation du format JSON |

#### S2-03 : Distribution roles avec briefings secrets

| Champ | Valeur |
|-------|--------|
| **ID** | S2-03 |
| **Epic** | Moteur de Jeu IA |
| **Priorite** | MUST-HAVE |
| **Assigne** | Kays |
| **Story Points** | 5 |
| **Description** | En tant que joueur, je veux recevoir un role avec un briefing secret au debut de la partie afin de savoir quel personnage j'incarne et quels sont mes objectifs caches. |
| **Criteres d'acceptation** | - [ ] Distribution aleatoire des roles definis dans le scenario pack |
| | - [ ] Chaque joueur recoit uniquement son propre briefing (pas celui des autres) |
| | - [ ] Briefing affiche dans une modale/ecran dedie |
| | - [ ] Le briefing contient : nom du role, description, objectif secret |
| | - [ ] Les roles sont stockes en base mais non visibles des autres joueurs |
| | - [ ] Tests sur l'aleatoire de la distribution et l'isolation des briefings |

#### S2-04 : Options d'action contextuelles IA

| Champ | Valeur |
|-------|--------|
| **ID** | S2-04 |
| **Epic** | Moteur de Jeu IA |
| **Priorite** | MUST-HAVE |
| **Assigne** | Samy |
| **Story Points** | 5 |
| **Description** | En tant que joueur, je veux recevoir des options d'action generees par l'IA en fonction du contexte narratif afin de pouvoir agir de maniere coherente dans l'histoire. |
| **Criteres d'acceptation** | - [ ] L'IA genere 3-5 options d'action par joueur a chaque phase ACTION |
| | - [ ] Les options sont contextuelles (tiennent compte du role, de l'historique, de la scene) |
| | - [ ] Option de texte libre en plus des suggestions |
| | - [ ] Affichage des options sous forme de boutons cliquables |
| | - [ ] Timer visible pendant la phase d'action |
| | - [ ] Action par defaut si le timer expire (abstention/silence) |

#### S2-05 : Resolution narrative des actions

| Champ | Valeur |
|-------|--------|
| **ID** | S2-05 |
| **Epic** | Moteur de Jeu IA |
| **Priorite** | MUST-HAVE |
| **Assigne** | Samy |
| **Story Points** | 5 |
| **Description** | En tant que joueur, je veux que l'IA resolve narrativement les actions de tous les joueurs afin de voir les consequences de nos choix integrees dans l'histoire. |
| **Criteres d'acceptation** | - [ ] Toutes les actions des joueurs sont envoyees a l'IA en un seul prompt |
| | - [ ] La resolution tient compte de toutes les actions et de leurs interactions |
| | - [ ] Le texte de resolution est diffuse en streaming a tous les joueurs |
| | - [ ] Les consequences sont coherentes avec le contexte et les regles du scenario |
| | - [ ] Les changements d'etat de jeu (jauges, statuts) sont calcules |
| | - [ ] Tests sur la coherence des resolutions (prompt testing) |

#### S2-06 : Chat temps reel phase Discussion

| Champ | Valeur |
|-------|--------|
| **ID** | S2-06 |
| **Epic** | Chat & Social |
| **Priorite** | MUST-HAVE |
| **Assigne** | Youri |
| **Story Points** | 5 |
| **Description** | En tant que joueur, je veux pouvoir discuter en temps reel avec les autres joueurs pendant la phase Discussion afin de debattre, negocier et elaborer des strategies. |
| **Criteres d'acceptation** | - [ ] Interface chat integree a l'ecran de jeu |
| | - [ ] Messages envoyes et recus en temps reel via WebSocket |
| | - [ ] Affichage du nom du joueur (role) et du timestamp |
| | - [ ] Scroll automatique vers les nouveaux messages |
| | - [ ] Chat actif uniquement pendant la phase DISCUSSION |
| | - [ ] Historique des messages conserve pendant toute la partie |
| | - [ ] Sanitisation des inputs (prevention XSS) |

#### S2-07 : Timer par phase avec auto-resolution

| Champ | Valeur |
|-------|--------|
| **ID** | S2-07 |
| **Epic** | Moteur de Jeu IA |
| **Priorite** | MUST-HAVE |
| **Assigne** | Kays |
| **Story Points** | 3 |
| **Description** | En tant que systeme, je dois gerer les timers de chaque phase et declencher automatiquement la transition a l'expiration afin de maintenir le rythme du jeu. |
| **Criteres d'acceptation** | - [ ] Timer configurable par phase et par scenario |
| | - [ ] Affichage visuel du timer (countdown) pour tous les joueurs |
| | - [ ] Transition automatique a l'expiration du timer |
| | - [ ] Les joueurs n'ayant pas soumis d'action recoivent une action par defaut |
| | - [ ] Synchronisation du timer entre tous les clients (server-authoritative) |
| | - [ ] Son/animation d'alerte quand le timer < 10 secondes |

---

### Sprint 3 -- Beta Open (37 SP, 7 tickets)

#### S3-01 : Systeme de vote accuse/innocent (TRIBUNAL)

| Champ | Valeur |
|-------|--------|
| **ID** | S3-01 |
| **Epic** | TRIBUNAL |
| **Priorite** | MUST-HAVE |
| **Assigne** | Samy |
| **Story Points** | 5 |
| **Description** | En tant que joueur du scenario TRIBUNAL, je veux pouvoir voter pour declarer l'accuse coupable ou innocent afin de rendre le verdict final du proces. |
| **Criteres d'acceptation** | - [ ] Interface de vote avec boutons Coupable / Innocent |
| | - [ ] Vote secret (les autres joueurs ne voient pas le vote avant revelation) |
| | - [ ] Timer de vote avec auto-abstention a l'expiration |
| | - [ ] Decompte des voix et annonce du verdict |
| | - [ ] Verdict determine par majorite simple |
| | - [ ] Animation de revelation des votes |

#### S3-02 : Temoignages et contre-interrogatoires (TRIBUNAL)

| Champ | Valeur |
|-------|--------|
| **ID** | S3-02 |
| **Epic** | TRIBUNAL |
| **Priorite** | MUST-HAVE |
| **Assigne** | Kays |
| **Story Points** | 5 |
| **Description** | En tant que joueur avec le role Temoin, je veux pouvoir delivrer un temoignage et etre contre-interroge par l'Avocat afin de creer une dynamique de deduction sociale. |
| **Criteres d'acceptation** | - [ ] Phase de temoignage ou le Temoin parle (texte ou choix pre-generes par IA) |
| | - [ ] Phase de contre-interrogatoire ou l'Avocat pose des questions |
| | - [ ] L'IA enrichit narrativement les echanges |
| | - [ ] Les informations revelees sont coherentes avec le briefing du Temoin |
| | - [ ] Possibilite de mentir (incoherence detectee par l'IA en resolution) |
| | - [ ] Historique des temoignages accessible pendant le vote |

#### S3-03 : Roles : Juge, Avocat, Temoin, Accuse (TRIBUNAL)

| Champ | Valeur |
|-------|--------|
| **ID** | S3-03 |
| **Epic** | TRIBUNAL |
| **Priorite** | MUST-HAVE |
| **Assigne** | Kays |
| **Story Points** | 3 |
| **Description** | En tant que systeme, je dois implementer les 4 roles specifiques du scenario TRIBUNAL avec leurs capacites et briefings uniques afin de creer une dynamique de jeu asymetrique. |
| **Criteres d'acceptation** | - [ ] Juge : modere les debats, peut demander l'ordre, influence le deroulement |
| | - [ ] Avocat : pose des questions, presente des arguments, oriente le debat |
| | - [ ] Temoin : livre des temoignages (veridiques ou mensongers selon briefing) |
| | - [ ] Accuse : se defend, peut reveler des informations strategiquement |
| | - [ ] Chaque role a des actions specifiques en phase ACTION |
| | - [ ] Briefings secrets definis dans le scenario pack JSON |

#### S3-04 : Jauges ressources temps reel (DEEP)

| Champ | Valeur |
|-------|--------|
| **ID** | S3-04 |
| **Epic** | DEEP |
| **Priorite** | MUST-HAVE |
| **Assigne** | Youri |
| **Story Points** | 8 |
| **Description** | En tant que joueur du scenario DEEP, je veux voir les jauges de ressources du sous-marin (O2, Energie, Coque) evoluer en temps reel afin de prendre des decisions eclairees pour la survie de l'equipage. |
| **Criteres d'acceptation** | - [ ] 3 jauges affichees : O2 (%), Energie (%), Coque (%) |
| | - [ ] Mise a jour temps reel via WebSocket |
| | - [ ] Animation fluide des variations de jauges |
| | - [ ] Code couleur : vert (>60%), jaune (30-60%), rouge (<30%) |
| | - [ ] Alertes visuelles et sonores quand une jauge passe en zone rouge |
| | - [ ] Les actions des joueurs et les evenements impactent les jauges |
| | - [ ] Condition de defaite si une jauge atteint 0% |
| | - [ ] Tests sur le calcul des jauges et les seuils |

#### S3-05 : Dilemmes cooperatifs + impact jauges (DEEP)

| Champ | Valeur |
|-------|--------|
| **ID** | S3-05 |
| **Epic** | DEEP |
| **Priorite** | MUST-HAVE |
| **Assigne** | Kays |
| **Story Points** | 5 |
| **Description** | En tant que joueur du scenario DEEP, je veux etre confronte a des dilemmes cooperatifs generes par l'IA qui impactent les jauges de ressources afin de vivre des moments de tension et de cooperation. |
| **Criteres d'acceptation** | - [ ] L'IA genere des dilemmes contextuels (ex: sacrifier O2 pour reparer la coque) |
| | - [ ] Chaque dilemme presente 2-3 options avec impacts differents sur les jauges |
| | - [ ] Le vote/consensus du groupe determine le choix |
| | - [ ] Les consequences sont narrativisees par l'IA |
| | - [ ] Equilibre : aucun choix n'est systematiquement "le bon" |
| | - [ ] Tests sur les calculs d'impact des dilemmes |

#### S3-06 : Evenements aleatoires (DEEP)

| Champ | Valeur |
|-------|--------|
| **ID** | S3-06 |
| **Epic** | DEEP |
| **Priorite** | MUST-HAVE |
| **Assigne** | Samy |
| **Story Points** | 5 |
| **Description** | En tant que joueur du scenario DEEP, je veux que des evenements aleatoires (pannes, creatures, anomalies) surviennent pendant la partie afin de pimenter l'experience et creer de l'imprevu. |
| **Criteres d'acceptation** | - [ ] Pool d'evenements definis dans le scenario pack JSON |
| | - [ ] Declenchement aleatoire ou conditionnel (seuils de jauges) |
| | - [ ] Chaque evenement est narrativise par l'IA |
| | - [ ] Impact sur une ou plusieurs jauges |
| | - [ ] Frequence equilibree (pas trop rapprochee, pas trop rare) |
| | - [ ] Notification visuelle/sonore pour les evenements |
| | - [ ] Tests sur le declenchement et l'impact des evenements |

#### S3-07 : Revelation roles secrets en finale (TRIBUNAL)

| Champ | Valeur |
|-------|--------|
| **ID** | S3-07 |
| **Epic** | TRIBUNAL |
| **Priorite** | MUST-HAVE |
| **Assigne** | Youri |
| **Story Points** | 3 |
| **Description** | En tant que joueur, je veux que les roles secrets soient reveles a la fin de la partie TRIBUNAL afin de decouvrir la verite et comprendre le deroulement du jeu. |
| **Criteres d'acceptation** | - [ ] Ecran de revelation apres le verdict |
| | - [ ] Chaque role et son briefing secret sont affiches a tous |
| | - [ ] Animation de revelation dramatique |
| | - [ ] Resume IA de la partie (moments cles, retournements) |
| | - [ ] Indication victoire/defaite pour chaque joueur selon son objectif secret |
| | - [ ] Bouton "Rejouer" pour lancer une nouvelle partie |

---

### Sprint 4 -- Release Candidate (29 SP, 7 tickets)

#### S4-01 : Memoire contextuelle multi-tours

| Champ | Valeur |
|-------|--------|
| **ID** | S4-01 |
| **Epic** | Moteur de Jeu IA |
| **Priorite** | SHOULD-HAVE |
| **Assigne** | Samy |
| **Story Points** | 5 |
| **Description** | En tant que systeme, je dois maintenir une memoire contextuelle des tours precedents afin que l'IA genere des narrations coherentes sur la duree de la partie. |
| **Criteres d'acceptation** | - [ ] Historique des actions, resolutions et evenements stocke par partie |
| | - [ ] Resume contextuel genere pour chaque appel IA (optimisation tokens) |
| | - [ ] L'IA reference des evenements precedents dans ses narrations |
| | - [ ] Gestion de la fenetre de contexte (pruning si > 150k tokens) |
| | - [ ] Tests sur la coherence narrative multi-tours |

#### S4-02 : Fallback GPT-4o

| Champ | Valeur |
|-------|--------|
| **ID** | S4-02 |
| **Epic** | Moteur de Jeu IA |
| **Priorite** | SHOULD-HAVE |
| **Assigne** | Samy |
| **Story Points** | 3 |
| **Description** | En tant que systeme, je dois basculer automatiquement vers GPT-4o si l'API Claude est indisponible afin de garantir la continuite du service. |
| **Criteres d'acceptation** | - [ ] Detection automatique de l'indisponibilite Claude (timeout, 5xx, rate limit) |
| | - [ ] Basculement transparent vers GPT-4o avec adaptation du prompt |
| | - [ ] Log de chaque basculement pour monitoring |
| | - [ ] Retour automatique vers Claude quand l'API est de nouveau disponible |
| | - [ ] Tests d'integration du mecanisme de fallback |

#### S4-03 : OAuth Google / Discord

| Champ | Valeur |
|-------|--------|
| **ID** | S4-03 |
| **Epic** | Authentification |
| **Priorite** | SHOULD-HAVE |
| **Assigne** | Samy |
| **Story Points** | 5 |
| **Description** | En tant qu'utilisateur, je veux pouvoir me connecter avec mon compte Google ou Discord afin de m'inscrire plus rapidement sans creer un nouveau mot de passe. |
| **Criteres d'acceptation** | - [ ] Bouton "Se connecter avec Google" fonctionnel |
| | - [ ] Bouton "Se connecter avec Discord" fonctionnel |
| | - [ ] Creation automatique du compte si premiere connexion |
| | - [ ] Liaison avec compte existant si meme email |
| | - [ ] Tokens OAuth stockes de maniere securisee |
| | - [ ] Tests sur les flows OAuth complets |

#### S4-04 : Preuves et indices en cours de jeu (TRIBUNAL)

| Champ | Valeur |
|-------|--------|
| **ID** | S4-04 |
| **Epic** | TRIBUNAL |
| **Priorite** | SHOULD-HAVE |
| **Assigne** | Kays |
| **Story Points** | 5 |
| **Description** | En tant que joueur du scenario TRIBUNAL, je veux decouvrir des preuves et indices au fil de la partie afin d'enrichir ma strategie de deduction. |
| **Criteres d'acceptation** | - [ ] L'IA distribue des indices a certains joueurs selon leur role |
| | - [ ] Les preuves sont affichees dans un panneau dedie ("Dossier") |
| | - [ ] Certaines preuves sont publiques, d'autres privees |
| | - [ ] Les joueurs peuvent choisir de partager ou cacher leurs preuves |
| | - [ ] Les preuves influencent la narration IA |
| | - [ ] Tests sur la distribution et la visibilite des preuves |

#### S4-05 : Systeme reparations collaboratif (DEEP)

| Champ | Valeur |
|-------|--------|
| **ID** | S4-05 |
| **Epic** | DEEP |
| **Priorite** | SHOULD-HAVE |
| **Assigne** | Youri |
| **Story Points** | 5 |
| **Description** | En tant que joueur du scenario DEEP, je veux pouvoir collaborer avec d'autres joueurs pour reparer les systemes du sous-marin afin de maintenir les jauges et survivre. |
| **Criteres d'acceptation** | - [ ] Systeme de reparation avec mini-jeu ou vote collaboratif |
| | - [ ] Certaines reparations necessitent 2+ joueurs |
| | - [ ] Impact positif sur les jauges en cas de reussite |
| | - [ ] Temps limite pour les reparations (timer) |
| | - [ ] L'IA narrativise les tentatives de reparation |
| | - [ ] Tests sur les mecaniques de reparation |

#### S4-06 : Dashboard admin stats globales

| Champ | Valeur |
|-------|--------|
| **ID** | S4-06 |
| **Epic** | Administration |
| **Priorite** | SHOULD-HAVE |
| **Assigne** | Yassir |
| **Story Points** | 5 |
| **Description** | En tant qu'administrateur, je veux voir un dashboard avec les statistiques globales de la plateforme afin de monitorer l'utilisation et la sante du service. |
| **Criteres d'acceptation** | - [ ] Page /admin protegee par role admin |
| | - [ ] Nombre d'utilisateurs inscrits et actifs |
| | - [ ] Nombre de parties creees, en cours, terminees |
| | - [ ] Cout API IA cumule |
| | - [ ] Graphiques d'evolution (Chart.js ou Recharts) |
| | - [ ] Export CSV des donnees |

#### S4-07 : Messages prives (whisper)

| Champ | Valeur |
|-------|--------|
| **ID** | S4-07 |
| **Epic** | Chat & Social |
| **Priorite** | MUST-HAVE |
| **Assigne** | Youri |
| **Story Points** | 3 |
| **Description** | En tant que joueur, je veux pouvoir envoyer des messages prives a un autre joueur pendant la phase Discussion afin de communiquer secretement. |
| **Criteres d'acceptation** | - [ ] Selection d'un destinataire pour envoyer un whisper |
| | - [ ] Le message n'est visible que par l'expediteur et le destinataire |
| | - [ ] Indicateur visuel distinguant les whispers des messages publics |
| | - [ ] Historique des whispers conserve |
| | - [ ] Tests sur l'isolation des messages prives |

---

### Sprint 5 -- Production (26 SP, 7 tickets)

#### S5-01 : Gestion utilisateurs et bans

| Champ | Valeur |
|-------|--------|
| **ID** | S5-01 |
| **Epic** | Administration |
| **Priorite** | SHOULD-HAVE |
| **Assigne** | Samy |
| **Story Points** | 5 |
| **Description** | En tant qu'administrateur, je veux pouvoir gerer les comptes utilisateurs (voir, suspendre, bannir) afin de maintenir un environnement de jeu sain. |
| **Criteres d'acceptation** | - [ ] Liste des utilisateurs avec recherche et filtres |
| | - [ ] Action suspendre (temporaire) avec duree configurable |
| | - [ ] Action bannir (permanent) avec motif |
| | - [ ] L'utilisateur banni est deconnecte immediatement |
| | - [ ] Historique des actions de moderation |
| | - [ ] Tests sur les mecaniques de ban/suspend |

#### S5-02 : Mot de passe oublie par email

| Champ | Valeur |
|-------|--------|
| **ID** | S5-02 |
| **Epic** | Authentification |
| **Priorite** | COULD-HAVE |
| **Assigne** | Samy |
| **Story Points** | 3 |
| **Description** | En tant qu'utilisateur, je veux pouvoir reinitialiser mon mot de passe par email afin de recuperer l'acces a mon compte en cas d'oubli. |
| **Criteres d'acceptation** | - [ ] Page /forgot-password avec champ email |
| | - [ ] Envoi d'un email avec lien de reinitialisation (token expire en 1h) |
| | - [ ] Page /reset-password pour saisir le nouveau mot de passe |
| | - [ ] Le token est a usage unique |
| | - [ ] Tests sur le flow complet (request, email, reset) |

#### S5-03 : Monitoring parties actives

| Champ | Valeur |
|-------|--------|
| **ID** | S5-03 |
| **Epic** | Administration |
| **Priorite** | SHOULD-HAVE |
| **Assigne** | Yassir |
| **Story Points** | 3 |
| **Description** | En tant qu'administrateur, je veux voir en temps reel les parties actives afin de monitorer la charge du systeme et intervenir si necessaire. |
| **Criteres d'acceptation** | - [ ] Liste des parties en cours avec nombre de joueurs |
| | - [ ] Phase actuelle de chaque partie |
| | - [ ] Indicateurs de sante (latence WebSocket, erreurs IA) |
| | - [ ] Possibilite de terminer une partie en cas de probleme |
| | - [ ] Rafraichissement automatique (polling ou WebSocket) |

#### S5-04 : Configuration IA (modele, temperature)

| Champ | Valeur |
|-------|--------|
| **ID** | S5-04 |
| **Epic** | Administration |
| **Priorite** | COULD-HAVE |
| **Assigne** | Samy |
| **Story Points** | 5 |
| **Description** | En tant qu'administrateur, je veux pouvoir configurer les parametres de l'IA (modele, temperature, max tokens) afin d'ajuster la qualite narrative et les couts. |
| **Criteres d'acceptation** | - [ ] Interface de configuration des parametres IA |
| | - [ ] Selection du modele (Claude Sonnet, Haiku, GPT-4o) |
| | - [ ] Ajustement temperature (0.0 a 2.0) |
| | - [ ] Configuration max tokens par type de reponse |
| | - [ ] Preview de generation avec les parametres choisis |
| | - [ ] Sauvegarde des presets par scenario |

#### S5-05 : Reactions et emojis

| Champ | Valeur |
|-------|--------|
| **ID** | S5-05 |
| **Epic** | Chat & Social |
| **Priorite** | SHOULD-HAVE |
| **Assigne** | Youri |
| **Story Points** | 3 |
| **Description** | En tant que joueur, je veux pouvoir reagir aux messages et aux narrations avec des emojis afin d'exprimer rapidement mes emotions sans ecrire. |
| **Criteres d'acceptation** | - [ ] Picker d'emojis accessible depuis le chat |
| | - [ ] Reactions sur les messages (comme Discord) |
| | - [ ] Reactions temps reel via WebSocket |
| | - [ ] Compteur de reactions affiche |
| | - [ ] Emojis thematiques par scenario |

#### S5-06 : Historique conversations post-partie

| Champ | Valeur |
|-------|--------|
| **ID** | S5-06 |
| **Epic** | Chat & Social |
| **Priorite** | COULD-HAVE |
| **Assigne** | Youri |
| **Story Points** | 3 |
| **Description** | En tant que joueur, je veux pouvoir consulter l'historique complet d'une partie terminee afin de revivre les moments cles et analyser le deroulement. |
| **Criteres d'acceptation** | - [ ] Page /games/:id/history accessible apres la fin de partie |
| | - [ ] Affichage chronologique de toutes les narrations, actions et messages |
| | - [ ] Distinction visuelle des phases |
| | - [ ] Informations revelees (roles secrets, preuves cachees) |
| | - [ ] Partage de l'historique via lien |

#### S5-07 : Parametrage temps par phase

| Champ | Valeur |
|-------|--------|
| **ID** | S5-07 |
| **Epic** | Gestion des Parties |
| **Priorite** | SHOULD-HAVE |
| **Assigne** | Kays |
| **Story Points** | 3 |
| **Description** | En tant que createur de partie, je veux pouvoir personnaliser les timers de chaque phase afin d'adapter le rythme du jeu a mon groupe. |
| **Criteres d'acceptation** | - [ ] Interface de parametrage dans le lobby |
| | - [ ] Timer configurable pour chaque phase (min 10s, max 300s) |
| | - [ ] Presets : Rapide (timers courts), Normal (defaut), Detente (timers longs) |
| | - [ ] Les parametres sont synchronises a tous les joueurs |
| | - [ ] Les timers personnalises sont utilises par le moteur de jeu |

---

### Buffer -- Livraison (15 SP, 5 tickets)

#### SB-01 : Mode spectateur

| Champ | Valeur |
|-------|--------|
| **ID** | SB-01 |
| **Epic** | Gestion des Parties |
| **Priorite** | SHOULD-HAVE |
| **Assigne** | Youri |
| **Story Points** | 5 |
| **Description** | En tant qu'utilisateur, je veux pouvoir observer une partie en cours sans y participer afin de regarder mes amis jouer ou d'apprendre les mecaniques. |
| **Criteres d'acceptation** | - [ ] Mode spectateur accessible depuis le lobby ou via lien |
| | - [ ] Le spectateur voit les narrations et les actions publiques |
| | - [ ] Le spectateur ne voit PAS les roles secrets ni les whispers |
| | - [ ] Pas d'impact sur le deroulement du jeu |
| | - [ ] Compteur de spectateurs visible pour les joueurs |

#### SB-02 : Optimisation performances

| Champ | Valeur |
|-------|--------|
| **ID** | SB-02 |
| **Epic** | Infrastructure |
| **Priorite** | SHOULD-HAVE |
| **Assigne** | Yassir |
| **Story Points** | 3 |
| **Description** | En tant que developpeur, je veux optimiser les performances de l'application (bundle size, caching, lazy loading) afin de garantir une experience utilisateur fluide. |
| **Criteres d'acceptation** | - [ ] Lighthouse performance >= 90 |
| | - [ ] LCP < 2.5s sur connection 3G simulee |
| | - [ ] Bundle frontend < 500Ko (gzipped) |
| | - [ ] Lazy loading des composants non-critiques |
| | - [ ] Cache Redis pour les donnees frequemment accedees |
| | - [ ] Images optimisees (WebP, lazy loading) |

#### SB-03 : Tests E2E parcours critique

| Champ | Valeur |
|-------|--------|
| **ID** | SB-03 |
| **Epic** | Qualite |
| **Priorite** | SHOULD-HAVE |
| **Assigne** | Kays |
| **Story Points** | 3 |
| **Description** | En tant que developpeur, je veux des tests E2E couvrant les parcours critiques afin de prevenir les regressions sur les fonctionnalites essentielles. |
| **Criteres d'acceptation** | - [ ] Cypress/Playwright configure |
| | - [ ] Test E2E : inscription -> connexion -> creer partie -> jouer -> fin |
| | - [ ] Test E2E : rejoindre partie -> lobby -> jeu |
| | - [ ] Tests executes dans la CI sur chaque PR |
| | - [ ] Captures d'ecran sur echec pour le debug |

#### SB-04 : Documentation technique

| Champ | Valeur |
|-------|--------|
| **ID** | SB-04 |
| **Epic** | Documentation |
| **Priorite** | SHOULD-HAVE |
| **Assigne** | Kays |
| **Story Points** | 2 |
| **Description** | En tant que developpeur (et pour la soutenance), je veux une documentation technique complete afin de faciliter la maintenance et la presentation du projet. |
| **Criteres d'acceptation** | - [ ] README complet avec instructions d'installation et de developpement |
| | - [ ] Documentation API (Swagger/OpenAPI ou Postman collection) |
| | - [ ] Architecture Decision Records (ADR) documentes |
| | - [ ] Schema d'architecture (diagrams) |
| | - [ ] Guide de contribution |

#### SB-05 : Accessibilite WCAG AA

| Champ | Valeur |
|-------|--------|
| **ID** | SB-05 |
| **Epic** | Conformite |
| **Priorite** | MUST-HAVE |
| **Assigne** | Yassir |
| **Story Points** | 2 |
| **Description** | En tant qu'utilisateur en situation de handicap, je veux que l'application soit accessible selon les criteres WCAG 2.1 AA afin de pouvoir utiliser toutes les fonctionnalites. |
| **Criteres d'acceptation** | - [ ] Lighthouse Accessibility >= 90 |
| | - [ ] WAVE : 0 erreurs |
| | - [ ] Navigation clavier complete (focus visible, tab order logique) |
| | - [ ] Labels ARIA sur tous les elements interactifs |
| | - [ ] Contrastes de couleurs conformes (ratio >= 4.5:1) |
| | - [ ] Textes alternatifs sur les images |

---

## 8. KPIs & Metriques (23 KPIs)

### KPIs Projet (9)

| ID | KPI | Unite | GREEN | YELLOW | RED | Frequence | Owner |
|----|-----|-------|-------|--------|-----|-----------|-------|
| PRJ-001 | Velocite sprint | SP/sprint | >= 28 SP | 22-27 SP | < 22 SP | Sprint | Samy |
| PRJ-002 | Deviation burndown | % | <= 10% | 10-25% | > 25% | Daily | Samy |
| PRJ-003 | Completion sprint | % | >= 85% | 70-84% | < 70% | Sprint | Samy |
| PRJ-004 | Taux de bugs | % tickets | <= 15% | 15-25% | > 25% | Sprint | Kays |
| PRJ-005 | Lead time | jours | <= 10j | 10-15j | > 15j | Sprint | Samy |
| PRJ-006 | Cycle time | jours | <= 3j | 3-5j | > 5j | Sprint | Kays |
| PRJ-007 | Review turnaround | heures | <= 4h | 4-8h | > 8h | Sprint | Kays |
| PRJ-008 | SPI (Schedule Performance Index) | ratio | >= 0.90 | 0.75-0.89 | < 0.75 | Sprint | Kays |
| PRJ-009 | CPI (Cost Performance Index) | ratio | >= 0.90 | 0.75-0.89 | < 0.75 | Sprint | Kays |

**Definitions :**
- **Velocite** : Nombre de story points termines (DoD) dans le sprint
- **Deviation burndown** : Ecart entre la courbe ideale et la courbe reelle du burndown chart
- **Completion** : % de tickets planifies qui sont termines en fin de sprint
- **Taux de bugs** : Nombre de bugs ouverts / nombre total de tickets dans le sprint
- **Lead time** : Temps entre la creation du ticket et sa mise en production
- **Cycle time** : Temps entre le debut du travail sur un ticket et sa completion
- **Review turnaround** : Temps moyen entre la creation d'une PR et sa premiere review
- **SPI** : Earned Value / Planned Value (>1 = en avance, <1 = en retard)
- **CPI** : Earned Value / Actual Cost (>1 = sous budget, <1 = sur budget)

### KPIs Produit (8)

| ID | KPI | Unite | GREEN | YELLOW | RED | Frequence | Owner |
|----|-----|-------|-------|--------|-----|-----------|-------|
| PROD-001a | Latence reponse IA (P50) | ms | <= 2000ms | 2000-3500ms | > 3500ms | Continu | Kays/Samy |
| PROD-001b | Latence reponse IA (P95) | ms | <= 5000ms | 5000-8000ms | > 8000ms | Continu | Kays/Samy |
| PROD-002 | Latence WebSocket (P50) | ms | <= 100ms | 100-200ms | > 200ms | Continu | Samy |
| PROD-003a | LCP (Largest Contentful Paint) | s | <= 2.5s | 2.5-4.0s | > 4.0s | Sprint | Youri |
| PROD-003b | INP (Interaction to Next Paint) | ms | <= 200ms | 200-500ms | > 500ms | Sprint | Youri |
| PROD-003c | CLS (Cumulative Layout Shift) | score | <= 0.1 | 0.1-0.25 | > 0.25 | Sprint | Youri |
| PROD-004 | Uptime plateforme | % | >= 99.0% | 97-98.9% | < 97% | Continu | Yassir |
| PROD-005 | Completion session jeu | % | >= 80% | 65-79% | < 65% | Hebdo | Kays+Samy |
| PROD-006 | Taux erreur IA | % | <= 5% | 5-10% | > 10% | Continu | Samy |
| PROD-007a | Couverture tests Backend | % | >= 70% | 50-69% | < 50% | PR/Sprint | Kays |
| PROD-007b | Couverture tests Frontend | % | >= 60% | 40-59% | < 40% | PR/Sprint | Kays |
| PROD-008 | Dette technique | issues | <= 5 | 6-10 | > 10 | Sprint | Kays |

**Definitions :**
- **Latence IA P50/P95** : Temps entre l'envoi du prompt et le dernier token recu (P50 = mediane, P95 = percentile 95)
- **Latence WebSocket** : Temps aller-retour d'un message via Socket.io
- **LCP** : Temps d'affichage du plus grand element visible (Core Web Vital)
- **INP** : Temps de reponse a la prochaine interaction utilisateur (Core Web Vital)
- **CLS** : Stabilite visuelle de la page lors du chargement (Core Web Vital)
- **Uptime** : Pourcentage de disponibilite de l'application sur la periode
- **Completion session** : % de parties demarrees qui arrivent a la phase FINALE
- **Taux erreur IA** : % d'appels API IA qui echouent (timeout, erreur, reponse incoherente)
- **Couverture tests** : % de lignes de code couvertes par les tests automatises
- **Dette technique** : Nombre d'issues taguees "tech-debt" ouvertes dans le backlog

### KPIs Conformite (6)

| ID | KPI | Unite | GREEN | YELLOW | RED | Frequence | Owner |
|----|-----|-------|-------|--------|-----|-----------|-------|
| CONF-001 | Score Lighthouse Accessibilite | score /100 | >= 90 | 75-89 | < 75 | Sprint | Samy |
| CONF-002 | Erreurs WAVE | nombre | 0 | 1-3 | > 3 | Sprint | Samy |
| CONF-003 | Eco-index | grade | A-B | C | D+ | Sprint | Youri |
| CONF-004 | Poids de page | Ko | <= 500Ko | 500-1000Ko | > 1000Ko | Sprint | Youri |
| CONF-005 | Conformite RGPD | % | 100% | 80-99% | < 80% | Sprint | Kays |
| CONF-006 | Conformite ANSSI | % | >= 90% | 75-89% | < 75% | Mi-projet/Fin | Kays/Yassir |

**Definitions :**
- **Lighthouse Accessibility** : Score d'accessibilite calcule par Google Lighthouse
- **WAVE** : Nombre d'erreurs detectees par l'outil WAVE (Web Accessibility Evaluation Tool)
- **Eco-index** : Grade de performance ecologique calcule par l'outil EcoIndex (A = meilleur, G = pire)
- **Poids de page** : Taille totale transferee pour charger une page (HTML + CSS + JS + images)
- **Conformite RGPD** : % des exigences RGPD implementees (voir checklist section 15)
- **Conformite ANSSI** : % des recommandations ANSSI appliquees (voir checklist section 15)

### Matrice RACI des KPIs

| KPI | Kays (PO) | Samy (SM) | Youri (FE) | Yassir (DevOps) |
|-----|-----------|-----------|------------|-----------------|
| PRJ-001 Velocite | A | R | C | C |
| PRJ-002 Burndown | I | R | C | C |
| PRJ-003 Completion | A | R | C | C |
| PRJ-004 Bugs | R | C | C | C |
| PRJ-005 Lead time | I | R | C | C |
| PRJ-006 Cycle time | R | C | C | C |
| PRJ-007 Review | R | C | C | C |
| PRJ-008 SPI | R | C | I | I |
| PRJ-009 CPI | R | C | I | I |
| PROD-001 Latence IA | R | R | I | I |
| PROD-002 Latence WS | I | R | C | I |
| PROD-003 Core Web Vitals | I | I | R | C |
| PROD-004 Uptime | I | C | I | R |
| PROD-005 Completion session | R | R | I | I |
| PROD-006 Erreur IA | C | R | I | I |
| PROD-007 Couverture tests | R | C | C | C |
| PROD-008 Dette technique | R | C | C | C |
| CONF-001 Lighthouse a11y | I | R | C | C |
| CONF-002 WAVE | I | R | C | C |
| CONF-003 Eco-index | I | I | R | C |
| CONF-004 Poids page | I | I | R | C |
| CONF-005 RGPD | R | C | C | C |
| CONF-006 ANSSI | R | C | I | R |

**Legende RACI :** R = Responsable (fait le travail), A = Accountable (rend des comptes), C = Consulte, I = Informe

---

## 9. Dashboard & Reporting Templates

### Sprint Dashboard Template

```
=== SPRINT [N] DASHBOARD ===
Date : [date debut] - [date fin]
Statut : [En cours / Termine]

1. RESUME SPRINT
   - Objectif : [objectif du sprint en 1-2 phrases]
   - Velocite realisee : [X] SP / [Y] SP prevus ([Z]%)
   - Completion : [N] tickets termines / [M] planifies ([%])

2. BURNDOWN CHART
   [Inserer graphique burndown]
   - Deviation : [X]% par rapport a la courbe ideale
   - Tendance : [En avance / Sur la cible / En retard]

3. TICKETS
   Termines :
   - [ID] [Titre] ([SP] SP) - [Assigne]
   - ...
   En cours :
   - [ID] [Titre] ([SP] SP) - [Assigne] - [% avancement]
   - ...
   Reportes au sprint suivant :
   - [ID] [Titre] ([SP] SP) - [Raison]
   - ...

4. KPI PROJET
   | KPI | Valeur | Cible | Statut |
   |-----|--------|-------|--------|
   | Velocite | [X] SP | >= 28 SP | [GREEN/YELLOW/RED] |
   | Completion | [X]% | >= 85% | [GREEN/YELLOW/RED] |
   | Bugs | [X]% | <= 15% | [GREEN/YELLOW/RED] |
   | Lead time | [X]j | <= 10j | [GREEN/YELLOW/RED] |
   | Cycle time | [X]j | <= 3j | [GREEN/YELLOW/RED] |
   | Review turnaround | [X]h | <= 4h | [GREEN/YELLOW/RED] |

5. KPI PRODUIT
   | KPI | Valeur | Cible | Statut |
   |-----|--------|-------|--------|
   | Latence IA P50 | [X]ms | <= 2000ms | [GREEN/YELLOW/RED] |
   | Latence IA P95 | [X]ms | <= 5000ms | [GREEN/YELLOW/RED] |
   | Latence WS P50 | [X]ms | <= 100ms | [GREEN/YELLOW/RED] |
   | Uptime | [X]% | >= 99.0% | [GREEN/YELLOW/RED] |
   | Couverture BE | [X]% | >= 70% | [GREEN/YELLOW/RED] |
   | Couverture FE | [X]% | >= 60% | [GREEN/YELLOW/RED] |

6. KPI CONFORMITE
   | KPI | Valeur | Cible | Statut |
   |-----|--------|-------|--------|
   | Lighthouse a11y | [X] | >= 90 | [GREEN/YELLOW/RED] |
   | WAVE erreurs | [X] | 0 | [GREEN/YELLOW/RED] |
   | Eco-index | [X] | A-B | [GREEN/YELLOW/RED] |
   | Poids page | [X]Ko | <= 500Ko | [GREEN/YELLOW/RED] |

7. BUGS
   - Ouverts : [N] (Critique: [X], Majeur: [Y], Mineur: [Z])
   - Resolus ce sprint : [N]
   - Taux resolution : [X]%

8. RISQUES
   Top 3 risques actifs :
   1. [RSQ-ID] [Description] - Score: [X] - Mitigation: [action]
   2. [RSQ-ID] [Description] - Score: [X] - Mitigation: [action]
   3. [RSQ-ID] [Description] - Score: [X] - Mitigation: [action]
   Nouvelles mitigations appliquees :
   - [Description de la mitigation]

9. BUDGET
   - Consomme ce sprint : [X] EUR
   - Consomme cumule : [X] EUR / [Y] EUR total ([Z]%)
   - Cout IA ce sprint : [X] EUR
   - Projection fin de projet : [X] EUR

10. BILAN
    Points positifs :
    + [Point 1]
    + [Point 2]
    Points a ameliorer :
    - [Point 1]
    - [Point 2]
```

### Sprint Retrospective Template

```
=== RETROSPECTIVE SPRINT [N] ===
Date : [date]
Participants : [noms]
Facilitateur : [nom]

1. SUIVI DES ACTIONS PRECEDENTES
   | Action | Owner | Deadline | Statut |
   |--------|-------|----------|--------|
   | [Action sprint N-1] | [Nom] | [Date] | [Fait/En cours/Non fait] |
   | ... | | | |

2. WHAT WENT WELL (Start doing)
   - [Point positif 1]
   - [Point positif 2]
   - [Point positif 3]

3. WHAT DIDN'T GO WELL (Stop doing)
   - [Point negatif 1]
   - [Point negatif 2]
   - [Point negatif 3]

4. WHAT TO CONTINUE (Continue)
   - [Pratique a maintenir 1]
   - [Pratique a maintenir 2]
   - [Pratique a maintenir 3]

5. ACTION ITEMS
   | # | Action | Owner | Deadline | Priorite |
   |---|--------|-------|----------|----------|
   | 1 | [Action concrete] | [Nom] | [Date] | Haute/Moyenne/Basse |
   | 2 | [Action concrete] | [Nom] | [Date] | Haute/Moyenne/Basse |
   | 3 | [Action concrete] | [Nom] | [Date] | Haute/Moyenne/Basse |

6. SENTIMENT EQUIPE (1-5)
   | Membre | Score | Commentaire |
   |--------|-------|-------------|
   | Kays | [1-5] | [Optionnel] |
   | Samy | [1-5] | [Optionnel] |
   | Youri | [1-5] | [Optionnel] |
   | Yassir | [1-5] | [Optionnel] |
   Moyenne : [X]/5
```

### Weekly Report Template

```
=== RAPPORT HEBDOMADAIRE ===
Semaine : [N] ([date debut] - [date fin])
Sprint : [N] - Semaine [1/2]
Redacteur : [Nom]

1. RESUME EXECUTIF (5 lignes max)
   [Resume concis de l'avancement de la semaine, les faits marquants,
   l'etat general du projet et les points d'attention principaux.
   Inclure la velocite et le % de completion si pertinent.]

2. TRAVAIL REALISE CETTE SEMAINE
   | Ticket | Description | Statut | Assigne |
   |--------|-------------|--------|---------|
   | [ID] | [Description courte] | Termine/En cours | [Nom] |
   | ... | | | |

3. TRAVAIL PREVU SEMAINE PROCHAINE
   | Ticket | Description | Priorite | Assigne |
   |--------|-------------|----------|---------|
   | [ID] | [Description courte] | MUST/SHOULD | [Nom] |
   | ... | | | |

4. INDICATEURS CLES
   | Indicateur | Valeur | Tendance | Statut |
   |------------|--------|----------|--------|
   | Velocite (sprint en cours) | [X] SP | [Hausse/Stable/Baisse] | [GREEN/YELLOW/RED] |
   | Bugs ouverts | [N] | [Hausse/Stable/Baisse] | [GREEN/YELLOW/RED] |
   | Couverture tests | [X]% | [Hausse/Stable/Baisse] | [GREEN/YELLOW/RED] |
   | Budget consomme | [X]% | [Hausse/Stable/Baisse] | [GREEN/YELLOW/RED] |

5. BLOCAGES / RISQUES
   | # | Description | Impact | Action | Owner |
   |---|-------------|--------|--------|-------|
   | 1 | [Blocage/Risque] | [Impact] | [Action] | [Nom] |
   | ... | | | | |

6. ECHEANCES A VENIR
   | Date | Echeance | Responsable |
   |------|----------|-------------|
   | [Date] | [Jalon/Livrable] | [Nom] |
   | ... | | |
```

---

## 10. Implementation & Deployment

### Git Flow

#### Strategie de Branches

| Branche | Description | Protection |
|---------|-------------|------------|
| `main` | Production - code deploye | 2 reviews requises, CI verte obligatoire |
| `staging` | Pre-production - tests d'integration | 1 review requise, CI verte obligatoire |
| `develop` | Integration - derniere version stable dev | 1 review requise, CI verte obligatoire |
| `feature/*` | Nouvelles fonctionnalites | Pas de protection, merge vers develop |
| `bugfix/*` | Corrections de bugs | Pas de protection, merge vers develop |
| `hotfix/*` | Corrections urgentes en production | Pas de protection, merge vers main + develop |

#### Convention de Nommage des Branches

```
feature/S1-04-ia-streaming
bugfix/S2-06-chat-xss-fix
hotfix/auth-jwt-expiration
```

#### Conventional Commits

| Prefixe | Usage | Exemple |
|---------|-------|---------|
| `feat:` | Nouvelle fonctionnalite | `feat: add JWT authentication endpoint` |
| `fix:` | Correction de bug | `fix: resolve WebSocket reconnection issue` |
| `docs:` | Documentation | `docs: update API endpoint documentation` |
| `refactor:` | Refactoring sans changement fonctionnel | `refactor: extract game engine state machine` |
| `test:` | Ajout ou modification de tests | `test: add integration tests for auth flow` |
| `ci:` | Configuration CI/CD | `ci: add staging deployment workflow` |
| `chore:` | Maintenance, dependencies | `chore: update Prisma to v5.12` |

#### PR Template

```markdown
## Description
[Description concise des changements]

## Ticket
[Lien vers le ticket : S0-01, S1-04, etc.]

## Type de changement
- [ ] feat: Nouvelle fonctionnalite
- [ ] fix: Correction de bug
- [ ] refactor: Refactoring
- [ ] docs: Documentation
- [ ] test: Tests
- [ ] ci: CI/CD
- [ ] chore: Maintenance

## Checklist
- [ ] Le code compile sans erreur
- [ ] Les tests passent localement
- [ ] Les nouveaux tests couvrent les changements
- [ ] Le code respecte les regles ESLint/Prettier
- [ ] La documentation est mise a jour
- [ ] Les criteres d'acceptation du ticket sont satisfaits
- [ ] Le code a ete self-reviewed

## Screenshots (si UI)
[Captures d'ecran avant/apres]

## Notes pour les reviewers
[Contexte supplementaire, points d'attention]
```

### CI/CD Pipeline

#### ci.yml (Sur chaque Pull Request)

```yaml
# Declencheur : push sur PR vers develop, staging, main
Steps:
  1. Checkout code
  2. Setup Node.js 20
  3. Install dependencies (bun install)
  4. Lint (ESLint)
  5. Typecheck (TypeScript)
  6. Test (Jest, couverture)
  7. Build (verification compilation)
  8. Security audit (npm audit / snyk)
```

#### deploy-staging.yml (Auto sur push develop)

```yaml
# Declencheur : push sur branche develop
Steps:
  1. Checkout code
  2. Run full CI pipeline
  3. Build frontend (Next.js)
  4. Build backend (NestJS)
  5. Deploy frontend vers Vercel (staging)
  6. Deploy backend vers Railway (staging)
  7. Run database migrations (staging)
  8. Smoke tests sur staging
  9. Notification Discord #deployments
```

#### deploy-production.yml (Manuel ou tag)

```yaml
# Declencheur : tag v*.*.* OU workflow_dispatch (manuel)
Steps:
  1. Checkout code
  2. Run full CI pipeline
  3. Build frontend (Next.js, production)
  4. Build backend (NestJS, production)
  5. Deploy frontend vers Vercel (production)
  6. Deploy backend vers Railway (production)
  7. Run database migrations (production)
  8. Smoke tests sur production
  9. Notification Discord #deployments
  10. Create GitHub Release
```

#### scheduled.yml (Audit hebdomadaire)

```yaml
# Declencheur : cron schedule (dimanche 02:00)
Steps:
  1. Checkout code
  2. npm audit
  3. Check for outdated dependencies
  4. Lighthouse CI (performance, a11y, SEO)
  5. WAVE accessibility check
  6. Report dans Discord #tech-help
```

### Environment URLs

| Environnement | Frontend | Backend | Base de donnees |
|---------------|----------|---------|-----------------|
| **Local** | http://localhost:3000 | http://localhost:3001 | postgresql://localhost:5432/mythos_dev |
| **Staging** | https://staging.mythos.app | https://api-staging.mythos.app | Railway (staging instance) |
| **Production** | https://mythos.app | https://api.mythos.app | Railway (production instance) |

### Production Deployment Checklist (Pre-deploy)

- [ ] Tous les tests passent dans la CI (lint, typecheck, tests unitaires, tests d'integration)
- [ ] Aucun bug critique ou haute priorite ouvert dans le backlog
- [ ] Couverture tests atteint les seuils KPI (BE >= 70%, FE >= 60%)
- [ ] Scores Lighthouse >= 90 (performance, accessibilite, SEO, best practices)
- [ ] WAVE : 0 erreurs d'accessibilite
- [ ] Security audit propre (`npm audit` sans vulnerabilites critiques/hautes)
- [ ] Variables d'environnement verifiees sur Railway et Vercel (production)
- [ ] Migrations de base de donnees reviewees et testees sur staging
- [ ] Plan de rollback documente (version precedente identifiee, procedure de retour)
- [ ] Equipe notifiee sur Discord #deployments (heure, scope, risques)

---

## 11. Change Management

### Processus de Demande de Changement (7 etapes)

| Etape | Action | Responsable | Livrable |
|-------|--------|-------------|----------|
| 1 | **Soumission** : Le demandeur cree une issue GitHub avec le label `change-request` | Tout membre | Issue GitHub |
| 2 | **Analyse d'impact** : Evaluation de l'impact sur le scope, planning, budget et qualite | PO (Kays) | Document d'impact |
| 3 | **Classification** : Categorisation en Mineur, Majeur ou Critique | PO (Kays) | Label sur l'issue |
| 4 | **Approbation** : Decision d'accepter, reporter ou rejeter le changement | Selon classification | Commentaire d'approbation |
| 5 | **Planification** : Integration dans le backlog avec priorisation MoSCoW | SM (Samy) + PO | Ticket(s) cree(s) |
| 6 | **Implementation** : Developpement selon le flow standard | Equipe | Code merge |
| 7 | **Validation** : Verification que le changement repond au besoin initial | PO (Kays) | Issue fermee |

### Grille d'Evaluation d'Impact

| Dimension | Questions a se poser | Indicateurs |
|-----------|---------------------|-------------|
| **Scope** | Quels tickets sont impactes ? Faut-il creer de nouveaux tickets ? | Nombre de tickets impactes |
| **Planning** | Quel retard potentiel ? Un sprint suffit-il ? | Jours de retard estimes |
| **Budget** | Cout supplementaire (API IA, infra, outils) ? | EUR supplementaires |
| **Qualite** | Impact sur la dette technique ? Tests a modifier ? | Nombre de tests a modifier |

### Niveaux d'Approbation

| Classification | Critere | Approbateur | Delai de decision |
|----------------|---------|-------------|-------------------|
| **Mineur** | Impact <= 3 SP, pas de retard, pas de cout | PO seul | 24h |
| **Majeur** | Impact 4-13 SP, retard possible <= 1 semaine | Equipe (vote majorite) | Sprint planning |
| **Critique** | Impact > 13 SP, retard > 1 semaine, ou cout > 50 EUR | Equipe + Parties prenantes | Reunion dediee sous 48h |

---

## 12. Stakeholder Communication

### Channels Discord

| Channel | Usage | Participants |
|---------|-------|-------------|
| `#general` | Annonces, informations generales | Tous |
| `#daily` | Standup quotidien asynchrone (si pas en vocal) | Equipe dev |
| `#deployments` | Notifications de deploiement (staging, production) | Tous |
| `#tech-help` | Questions techniques, debugging collaboratif | Equipe dev |
| `#backend` | Discussions specifiques backend (NestJS, Prisma, API) | Samy, Kays |
| `#frontend` | Discussions specifiques frontend (Next.js, React, UI) | Youri, Yassir |
| `#ai-service` | Discussions IA (prompts, Claude API, qualite narrative) | Samy, Kays |
| `#product` | Discussions produit (features, UX, priorites) | Tous |
| `#random` | Off-topic, social, memes | Tous |

### Ceremonies

| Ceremonie | Frequence | Duree | Format | Participants |
|-----------|-----------|-------|--------|-------------|
| **Daily standup** | Quotidien | 15 min | Discord vocal | Tous |
| **Sprint planning** | Debut de sprint | 2h | Discord vocal | Tous |
| **Sprint review** | Fin de sprint | 1h | Discord vocal + screenshare | Tous + parties prenantes |
| **Sprint retrospective** | Fin de sprint | 1h | Discord vocal | Equipe dev uniquement |
| **Backlog refinement** | Mi-sprint | 1h | Discord vocal | PO + equipe dev |

### Format Daily Standup

Chaque membre repond a 3 questions (2 min max par personne) :

1. **Hier** : Qu'est-ce que j'ai accompli ?
2. **Aujourd'hui** : Qu'est-ce que je prevois de faire ?
3. **Blocages** : Est-ce que quelque chose me bloque ?

### Preparation Soutenance

**Duree totale :** 10 minutes collectives

| Segment | Duree | Contenu | Speaker |
|---------|-------|---------|---------|
| **Contexte** | 2 min | Presentation du projet, problematique, equipe | Kays (PO) |
| **Methodologie** | 3 min | Architecture technique, processus Scrum, KPIs, ADR | Samy (SM) |
| **Demo** | 3 min | Demonstration live du MVP (TRIBUNAL + DEEP) | Youri + Yassir |
| **Bilan** | 2 min | Resultats, metriques, retour d'experience, perspectives | Kays (PO) |

---

## 13. Project Supervision

### Matrice RACI Decisions Cles

| Decision | Kays (PO) | Samy (SM) | Youri (FE) | Yassir (DevOps) |
|----------|-----------|-----------|------------|-----------------|
| Priorisation backlog | A/R | C | I | I |
| Architecture technique | A | R | C | C |
| Choix technologiques | A | R | C | C |
| Design UI/UX | A | I | R | R |
| Deploiement production | I | C | I | A/R |
| Gestion des risques | A | R | C | C |
| Budget et couts | A/R | C | I | I |
| Qualite du code | C | R | R | C |
| Securite | A | R | I | R |
| Accessibilite | C | C | R | R |

### Processus d'Escalation

| Niveau | Critere | Action | Delai | Responsable |
|--------|---------|--------|-------|-------------|
| **Niveau 1 - Equipe** | Blocage technique, question d'implementation | Discussion dans le channel Discord concerne, pair programming | 4h | Membre concerne |
| **Niveau 2 - PO** | Conflit de priorite, decision produit, ambiguite dans les specs | Reunion avec le PO pour trancher | 24h | Kays (PO) |
| **Niveau 3 - Stakeholders** | Risque critique, retard > 1 semaine, depassement budget > 20% | Reunion exceptionnelle avec parties prenantes + equipe | 48h | Kays (PO) + Samy (SM) |

### Quality Gates par Sprint

| Sprint | Gate | Criteres de passage |
|--------|------|---------------------|
| Sprint 0 | **POC Gate** | Auth fonctionnel, CRUD parties, CI/CD operationnel, DB schema deploye |
| Sprint 1 | **Alpha Gate** | Lobby temps reel, streaming IA, pages frontend core, WebSocket gateway |
| Sprint 2 | **Beta Closed Gate** | Boucle de jeu 6 phases complete, chat fonctionnel, scenarios charges |
| Sprint 3 | **Beta Open Gate** | TRIBUNAL jouable, DEEP jouable, jauges temps reel |
| Sprint 4 | **RC Gate** | Features SHOULD-HAVE integrees, couverture tests >= seuils, 0 bugs critiques |
| Sprint 5 | **Production Gate** | Administration, accessibilite, Lighthouse >= 90, WAVE 0 erreurs |
| Buffer | **Livraison Gate** | Tests E2E, documentation complete, deployment checklist valide |

### Revue des Risques Hebdomadaire

**Quand :** Chaque lundi, integree au daily standup (10 min supplementaires)
**Format :**

1. **Revue des risques existants** : Mise a jour des scores (probabilite/impact), nouvelles mitigations
2. **Identification de nouveaux risques** : Tour de table, chaque membre remonte les risques identifies
3. **Top 3 risques** : Selection des 3 risques prioritaires pour la semaine
4. **Actions** : Attribution des actions de mitigation avec owner et deadline

---

## 14. Budget

| Poste | Montant | Details |
|-------|---------|---------|
| API IA (Claude) | ~120 EUR | ~80 EUR/mois, Sonnet + Haiku |
| Infrastructure | ~30 EUR | Railway, Upstash (tiers gratuits) |
| Domaine | ~15 EUR | 1 an |
| Outils | ~0 EUR | GitHub (gratuit), Figma (gratuit), Vercel (gratuit) |
| **Sous-total** | **~216 EUR** | |
| Contingence (20%) | ~51 EUR | Marge de securite |
| **TOTAL MVP** | **~308 EUR** | |

### Repartition par Sprint

| Sprint | Cout estime | Poste principal |
|--------|------------|----------------|
| Sprint 0 | ~20 EUR | Infrastructure setup, domaine |
| Sprint 1 | ~30 EUR | API IA (premiers tests streaming) |
| Sprint 2 | ~50 EUR | API IA (boucle de jeu, tests intensifs) |
| Sprint 3 | ~50 EUR | API IA (2 scenarios, evenements) |
| Sprint 4 | ~30 EUR | API IA (memoire, fallback) |
| Sprint 5 | ~20 EUR | Infrastructure monitoring |
| Buffer | ~10 EUR | Marge |
| **TOTAL** | **~210 EUR** | Sous contingence |

---

## 15. Conformite & Standards

| Standard | Statut | Details |
|----------|--------|---------|
| **RGPD** | Integre Sprint 0 | Privacy-by-design, consentement, droit a l'oubli |
| **WCAG 2.1 AA** | Cible Sprint 5 | Navigation clavier, ARIA, contrastes |
| **RGAA 4.1** | Aligne WCAG | Referentiel accessibilite francais |
| **GreenIT / RGESN** | Monitoring continu | Eco-conception, performances |
| **RNCP38822** | Referentiel | Bloc 1 certification |
| **ISO 31000** | Appliquee | Gestion des risques |

### Checklist ANSSI (15 items)

| # | Recommandation ANSSI | Statut | Implementation | Sprint cible |
|---|---------------------|--------|----------------|--------------|
| 1 | Politique de mots de passe robuste | A faire | Min 8 caracteres, 1 majuscule, 1 chiffre, 1 special. Bcrypt hash (salt >= 10) | Sprint 0 |
| 2 | Authentification multi-facteurs | Reporte | Non prioritaire pour le MVP, a considerer post-MVP | Post-MVP |
| 3 | Gestion des sessions | A faire | JWT access token (15min), refresh token (7j), invalidation au logout | Sprint 0 |
| 4 | Chiffrement des communications (HTTPS) | A faire | TLS/HTTPS force sur Vercel et Railway. HSTS header | Sprint 0 |
| 5 | Protection contre les injections | A faire | Prisma ORM (requetes parametrees), sanitisation des inputs, validation Zod | Sprint 1 |
| 6 | Protection CSRF | A faire | Token CSRF sur les formulaires, SameSite cookies | Sprint 1 |
| 7 | En-tetes de securite HTTP | A faire | Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, Referrer-Policy | Sprint 1 |
| 8 | Rate limiting | A faire | Limite par IP sur les endpoints sensibles (auth, IA). NestJS Throttler | Sprint 2 |
| 9 | CORS configure strictement | A faire | Origines autorisees limitees aux domaines connus | Sprint 0 |
| 10 | Journalisation des evenements de securite | A faire | Log des tentatives de connexion, changements de mot de passe, acces admin | Sprint 3 |
| 11 | Mise a jour des dependances | A faire | Audit hebdomadaire (scheduled.yml), Dependabot active | Sprint 0 |
| 12 | Sauvegarde des donnees | A faire | Backups automatiques Railway (PostgreSQL), retention 7 jours | Sprint 1 |
| 13 | Principe du moindre privilege | A faire | Roles et permissions : user, admin. Guards NestJS par endpoint | Sprint 2 |
| 14 | Validation des entrees | A faire | Schemas Zod sur tous les endpoints, validation cote client et serveur | Sprint 1 |
| 15 | Plan de reponse aux incidents | A faire | Procedure documentee : detection, containment, eradication, recovery, lessons learned | Sprint 4 |

### Checklist RGPD (8 items)

| # | Exigence RGPD | Statut | Implementation | Sprint cible |
|---|--------------|--------|----------------|--------------|
| 1 | Consentement eclaire | A faire | Bandeau cookies, CGU, consentement explicite a l'inscription | Sprint 0 |
| 2 | Minimisation des donnees | A faire | Collecte uniquement email + mot de passe. Pas de donnees superflues | Sprint 0 |
| 3 | Droit d'acces | A faire | Endpoint GET /api/users/me/data retourne toutes les donnees personnelles | Sprint 2 |
| 4 | Droit a l'effacement | A faire | Endpoint DELETE /api/users/me avec suppression cascade (anonymisation des parties) | Sprint 2 |
| 5 | Droit a la portabilite | A faire | Export JSON de toutes les donnees personnelles | Sprint 4 |
| 6 | Registre des traitements | A faire | Document listant tous les traitements de donnees, finalites et durees de conservation | Sprint 0 |
| 7 | Notification de violation | A faire | Procedure de notification en cas de breach (72h CNIL). Email aux utilisateurs concernes | Sprint 4 |
| 8 | Privacy by design | A faire | Architecture concue pour minimiser l'exposition des donnees. Pas de tracking tiers, pas d'analytics invasif | Sprint 0 |

---

## 16. Ceremonies Scrum

| Ceremonie | Frequence | Duree | Participants |
|-----------|-----------|-------|-------------|
| Daily standup | Quotidien (Discord) | 15 min | Tous |
| Sprint planning | Debut de sprint | 2h | Tous |
| Sprint review | Fin de sprint | 1h | Tous + parties prenantes |
| Sprint retrospective | Fin de sprint | 1h | Equipe |
| Backlog refinement | Mi-sprint | 1h | PO + equipe |

### Detail des Ceremonies

#### Daily Standup (15 min)
- **Quand :** Tous les jours, 10h00
- **Ou :** Discord vocal #daily
- **Format :** Chaque membre repond aux 3 questions (hier, aujourd'hui, blocages)
- **Regle :** Si un sujet depasse 2 min, il est differe en "parking lot" pour discussion apres le daily

#### Sprint Planning (2h)
- **Quand :** Premier jour du sprint
- **Ou :** Discord vocal
- **Format :**
  - Partie 1 (30 min) : Revue de l'objectif du sprint par le PO
  - Partie 2 (60 min) : Selection des tickets, planning poker, estimation
  - Partie 3 (30 min) : Decomposition des tickets en taches, attribution

#### Sprint Review (1h)
- **Quand :** Dernier jour du sprint
- **Ou :** Discord vocal + screenshare
- **Format :**
  - Demo des fonctionnalites terminees (30 min)
  - Feedback des parties prenantes (15 min)
  - Revue des KPIs et metriques (15 min)

#### Sprint Retrospective (1h)
- **Quand :** Apres la Sprint Review
- **Ou :** Discord vocal
- **Format :** Voir template retrospective (section 9)

#### Backlog Refinement (1h)
- **Quand :** Milieu du sprint
- **Ou :** Discord vocal
- **Format :**
  - Revue des tickets du prochain sprint (30 min)
  - Clarification des criteres d'acceptation (15 min)
  - Pre-estimation (planning poker) (15 min)

---

## 17. Liens Utiles

| Ressource | Lien |
|-----------|------|
| Repository GitHub | [A remplir] |
| Board Trello | [Importer trello-import.json] |
| Figma | [A remplir] |
| Railway Dashboard | [A remplir] |
| Vercel Dashboard | [A remplir] |
| Sentry | [A remplir] |
| Documentation API | [A remplir] |
| Discord | [A remplir] |
| Lighthouse CI | [A remplir] |
| WAVE Tool | https://wave.webaim.org/ |
| EcoIndex | https://www.ecoindex.fr/ |
| Claude API Docs | https://docs.anthropic.com/ |
| NestJS Docs | https://docs.nestjs.com/ |
| Prisma Docs | https://www.prisma.io/docs/ |
| Socket.io Docs | https://socket.io/docs/v4/ |

---

*Documentation complete du projet MYTHOS -- 5AWD Workshop -- Samy, Yassir, Youri, Kays -- Fevrier 2026*
