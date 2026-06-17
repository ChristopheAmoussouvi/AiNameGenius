# AINameGenius — Design System Reference V1

**Version**: V1 — 2026-06-16  
**Tagline**: SMART NAMES. VERIFIED POTENTIAL.  
**Source**: Google Drive — "2026-06-16 - AINameGenius - Design System Reference - V1"

---

## 1. Vision de marque

**Mission** : Aider les fondateurs, freelances, agences et créateurs de produits à trouver rapidement des noms de marque intelligents, mémorables et vérifiables.

**Positionnement** : Assistant de naming premium — plus complet qu'un simple générateur de domaine : il combine inspiration créative, vérification, scoring, logo et kit de marque.

**Personnalité** : Premium · Intelligent · Confiant · Accessible

---

## 2. Palette de couleurs

```css
:root {
  /* Primary */
  --ang-primary:   #6367FF;  /* CTA, liens actifs, badges score */
  --ang-secondary: #8494FF;  /* Hover, iconographie */
  --ang-lavender:  #C9BEFF;  /* Backgrounds secondaires, chips */
  --ang-pink:      #FFDBFD;  /* Illustrations, empty states */

  /* Neutral */
  --ang-deep-navy: #0B0E19;  /* Fond principal dark, hero */
  --ang-slate:     #151827;  /* Cards dark, surfaces niveau 1 */
  --ang-charcoal:  #1F2433;  /* Inputs, tables, surfaces niveau 2 */
  --ang-mist:      #F2F1FF;  /* Fond clair, docs */
  --ang-white:     #FFFFFF;

  /* Semantic */
  --ang-success:   #6FCF97;  /* Domaine disponible, check OK */
  --ang-warning:   #FFCF95;  /* Similarité trouvée, partiel */
  --ang-danger:    #F48F68;  /* Domaine pris, conflit, erreur */
  --ang-info:      #8494FF;  /* En cours, suggestion IA */
}
```

**Répartition recommandée** : 60% navy/white · 20% primary · 10% secondary · 5% lavender · 5% pink

---

## 3. Typographie

**Police** : Plus Jakarta Sans → Inter → system-ui, sans-serif

| Nom | Taille / Leading | Poids | Usage |
|-----|-----------------|-------|-------|
| Display | 64 / 72px | 700 | Hero landing |
| H1 | 56 / 64px | 700 | Titre principal |
| H2 | 36 / 44px | 600 | Sections principales |
| H3 | 24 / 32px | 600 | Sous-sections, cards |
| Body | 16 / 24px | 400 | Texte courant |
| Caption | 14 / 20px | 400 | Labels, microcopy |
| Button | 14 / 20px | 600 | Boutons, tabs |
| Overline | 12 / 16px | 500 | Labels uppercase espacés |

---

## 4. Fondations UI

**Grid** : 12 col · gouttière 24px · max-width 1280px  
**Margins** : 24px mobile · 40px tablet · 64px desktop

**Spacing scale** : 4 · 8 · 12 · 16 · 24 · 32 · 40 · 48 · 64px

**Border radius** : 6 / 10 / 14 / 20 / 28px

**Shadows** :
```
sm: 0 1px 2px rgba(0,0,0,.25)
md: 0 4px 12px rgba(0,0,0,.35)
lg: 0 12px 30px rgba(0,0,0,.45)
```

---

## 5. Composants clés

### Buttons
- **Primary** : `#6367FF` bg, white text, radius 10px — Generate Names, Start Free Trial
- **Secondary** : transparent, border `#8494FF` — View Report, See Details
- **Ghost** : no border, text `#8494FF` — Secondary links
- **Danger** : `#F48F68` — Remove, unavailable actions
- Hauteur minimale CTA : **40px**

### Badges de statut
| Badge | Couleur | Label |
|-------|---------|-------|
| Available | `#6FCF97` | Available |
| Taken | `#F48F68` | Taken |
| Premium | `#FFCF95` | Premium domain |
| AI Suggested | `#8494FF` | AI Suggested |
| Brandable | `#C9BEFF` | Brandable |
| Short | `#FFDBFD` | Short |

### Name result card
```
NovaLume
Bright ideas. Smarter growth.
[AI Suggested] [Brandable] [Short]
novalume.com  ● Available
novalume.fr   ✗ Taken
Score: 91 — Excellent Potential
[Save Name]  [View Full Report]  [Register Domain]
```

---

## 6. Logo system

**Mascotte** : chevelure blanche iconique, lunettes circulaires `#6367FF`, moustache, badge de vérification. Abstraite — jamais réaliste.

**Versions** :
- Primary stacked : hero, couverture, pitch
- Horizontal : navbar, footer, app header
- Icon only : favicon, avatar social (min 32px)

**Alt text** : `"AINameGenius genius mascot logo with verification badge"`

**Interdits** : ne pas retirer le check badge, ne pas ajouter de dégradés, ne pas faire de portrait réaliste.

---

## 7. Microcopy (ton)

**À utiliser** :
- *"Great signal — this name looks available in your selected domains."*
- *"Potential conflict detected. Review similar marks before deciding."*
- *"AINameGenius provides pre-checks, not legal advice."*

**À bannir** :
- *"This name is legally safe."*
- *"Trademark guaranteed."*
- *"Magic naming now."*

---

## 8. Tokens Tailwind (tailwind.config.ts)

Voir `/tailwind.config.ts` dans le repo — tous les tokens de ce design system sont implémentés sous le préfixe `ang-`.

---

## 9. Prompt de génération visuelle

```
Create a premium AINameGenius brand/UI visual using the official design system.
Use solid colors only: #6367FF, #8494FF, #C9BEFF, #FFDBFD, plus #0B0E19,
#151827, #1F2433, #F2F1FF and #FFFFFF. Preserve the genius mascot: white wild
hair, round glasses, small moustache and verification check badge. Use clean
vector SaaS aesthetics, Plus Jakarta Sans style typography, dark premium
background, precise spacing, no gradients, no metallic effects, no excessive
glow. Show clear UI components for an AI naming tool: search input, name
suggestion cards, domain availability badges, trademark pre-check status,
score chip and CTA buttons.
```

---

## 10. Règles d'accessibilité

- Contraste minimum : 4.5:1 pour texte courant
- Ne jamais utiliser `#C9BEFF` ou `#FFDBFD` comme texte principal sur fond blanc
- États d'erreur : icône + couleur + texte (jamais couleur seule)
- Badges lisibles à 12px minimum
- CTA hauteur minimale 40px
