/**
 * About Project Tab Component
 * Handles the logic, presentation, and links for the About Project view.
 */

export const GITHUB_REPO_URL = 'https://github.com/GFV-dev/Poke-Battle'
export const POKEMON_BATTLEGROUNDS_URL = 'https://pokemonbattlegrounds.com'

/**
 * Returns an accessible, crisp GitHub SVG icon.
 */
export function getGithubIconSvg(size: number = 20): string {
  return `
    <svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true" class="github-icon-svg">
      <path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
    </svg>
  `
}

/**
 * Standard clickable GitHub hyperlink pairing the GitHub icon with 'The full project here'.
 */
export function renderGithubLink(className: string = 'github-repo-link'): string {
  return `
    <a href="${GITHUB_REPO_URL}" target="_blank" rel="noopener noreferrer" class="${className}" aria-label="Visit the GitHub repository">
      ${getGithubIconSvg(20)}
      <span>The full project here</span>
    </a>
  `
}

export class AboutTab {
  private container: HTMLElement

  constructor(container: HTMLElement) {
    this.container = container
  }

  render(): void {
    this.container.innerHTML = this.getHtml()
  }

  getHtml(): string {
    return `
      <section class="about-section" id="about-section" aria-labelledby="about-heading">
        <div class="menu-section-heading">
          <div>
            <span class="section-kicker">COMMUNITY & OPEN SOURCE</span>
            <h2 id="about-heading">About Poké Battle</h2>
          </div>
          <div class="about-badges">
            <span class="about-badge about-badge--green">NON-COMMERCIAL</span>
            <span class="about-badge about-badge--blue">OPEN SOURCE</span>
            <span class="about-badge about-badge--gold">CONTINUOUS UPDATES</span>
          </div>
        </div>

        <div class="about-grid">
          <!-- Non-commercial Notice Card -->
          <article class="about-card about-card--highlight">
            <div class="about-card-header">
              <span class="about-card-icon" aria-hidden="true">🛡️</span>
              <h3>Non-Commercial & Non-Profitable Project</h3>
            </div>
            <p>
              <strong>Poké Battle</strong> is a strictly <em>non-commercial</em>, fan-made, and <em>non-profitable</em> software project.
              It is built purely out of admiration and artistic tribute to the Pokémon franchise. There are zero ads, zero paywalls,
              and no microtransactions or monetization of any kind.
            </p>
          </article>

          <!-- Inspiration Card -->
          <article class="about-card">
            <div class="about-card-header">
              <span class="about-card-icon" aria-hidden="true">🎬</span>
              <h3>Inspiration & Acknowledgement</h3>
            </div>
            <p>
              This simulator is directly inspired by the popular <strong>Pokémon Battleground</strong> videos.
              Special tribute and credit go to their phenomenal creators. You can visit their official project and watch their matches at:
            </p>
            <div class="about-link-row">
              <a href="${POKEMON_BATTLEGROUNDS_URL}" target="_blank" rel="noopener noreferrer" class="about-external-btn">
                <span>🌐 pokemonbattlegrounds.com</span>
                <span aria-hidden="true">↗</span>
              </a>
            </div>
          </article>

          <!-- Single Developer Story -->
          <article class="about-card about-card--story">
            <div class="about-card-header">
              <span class="about-card-icon" aria-hidden="true">💡</span>
              <h3>A Developer's Passion</h3>
            </div>
            <blockquote class="about-developer-note">
              "This game was developed by a single developer. 
              I've always planned a game where the pokemon would fight, without turns, only the moves, like the anime fights and then i watched the Pokémon Battleground videos. 
              After that i've decided to put my hands to work on it, an automated, real-time fighting Pokémon game in the browser. 
              The goal was to build a fluid experience where creatures dynamically maneuver with stats based orbits, execute physical dashes and ranged projectiles, dodge incoming attacks, in a all client-side without any downloads or server dependencies.
              Seeing it come to life in modern TypeScript has been an incredible journey."
            </blockquote>
          </article>

          <!-- Continuous Updates & Community Collaboration -->
          <article class="about-card about-card--collaboration">
            <div class="about-card-header">
              <span class="about-card-icon" aria-hidden="true">🤝</span>
              <h3>Continuous Updates & Community PRs</h3>
            </div>
            <p>
              This web app is under active, continuous development! New Pokémon species, refined damage formulas, shiny mechanics,
              animations, and battle arenas are continually introduced.
            </p>
            <p>
              Because this is a <strong>100% open-source project</strong>, the community is enthusiastically invited to collaborate.
              Whether you want to add new Pokémon sprites, balance move pools, create custom themes, or optimize rendering,
              your contributions are warmly welcomed! Feel free to fork the repository, open issues, and send <strong>Pull Requests (PRs)</strong>.
            </p>

            <div class="about-github-callout">
              <span class="callout-label">JOIN THE OPEN-SOURCE PROJECT:</span>
              ${renderGithubLink('github-repo-link github-repo-link--primary')}
            </div>
          </article>

          <!-- Legal & Attribution Footer Note -->
          <div class="about-disclaimer">
            <p>
              Pokémon and all respective names, sprites, and concepts are trademark & © of Nintendo, Creatures Inc., and Game Freak 1996–2026.
              Sprite sheets are contributed by the PMD SpriteCollab community under CC BY-NC 4.0.
            </p>
          </div>
        </div>
      </section>
    `
  }
}

