import { LANGUAGES, getLanguage, onLanguageChange, setLanguage, t, type LanguageCode } from '../utils/i18n.ts'

/** Flag-based language dropdown (a native <select> cannot render SVG flags). */
export class LanguageSelector {
  private readonly toggle: HTMLButtonElement
  private readonly list: HTMLUListElement
  private readonly root: HTMLElement

  constructor(root: HTMLElement) {
    this.root = root
    root.classList.add('lang-select')
    root.innerHTML = `
      <button type="button" class="lang-toggle" aria-haspopup="listbox" aria-expanded="false"></button>
      <ul class="lang-list" role="listbox" tabindex="-1" hidden></ul>
    `
    this.toggle = root.querySelector<HTMLButtonElement>('.lang-toggle')!
    this.list = root.querySelector<HTMLUListElement>('.lang-list')!

    this.toggle.addEventListener('click', () => this.setOpen(this.toggle.getAttribute('aria-expanded') !== 'true'))
    this.list.addEventListener('click', (event) => {
      const option = (event.target as HTMLElement).closest<HTMLElement>('[data-lang]')
      if (option) void this.choose(option.dataset.lang as LanguageCode)
    })
    this.list.addEventListener('keydown', (event) => this.onListKey(event))
    document.addEventListener('click', (event) => {
      if (!this.root.contains(event.target as Node)) this.setOpen(false)
    })
    root.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        this.setOpen(false)
        this.toggle.focus()
      }
    })
    onLanguageChange(() => this.render())
    this.render()
  }

  render(): void {
    const active = LANGUAGES.find((language) => language.code === getLanguage()) ?? LANGUAGES[0]
    this.toggle.innerHTML = `${active.flag}<span class="lang-code">${active.code.toUpperCase()}</span><span class="lang-caret" aria-hidden="true">▾</span>`
    this.toggle.setAttribute('aria-label', `${t('language.label')}: ${t(active.labelKey)}`)
    this.list.setAttribute('aria-label', t('language.label'))
    this.list.innerHTML = LANGUAGES.map((language) => {
      const selected = language.code === active.code
      return `<li role="option" tabindex="-1" data-lang="${language.code}" aria-selected="${selected}" class="lang-option${selected ? ' is-selected' : ''}">${language.flag}<span>${t(language.labelKey)}</span></li>`
    }).join('')
  }

  private setOpen(open: boolean): void {
    this.list.hidden = !open
    this.toggle.setAttribute('aria-expanded', String(open))
    if (open) this.list.querySelector<HTMLElement>('.is-selected')?.focus()
  }

  private async choose(code: LanguageCode): Promise<void> {
    this.setOpen(false)
    this.toggle.focus()
    await setLanguage(code)
  }

  private onListKey(event: KeyboardEvent): void {
    const options = [...this.list.querySelectorAll<HTMLElement>('[data-lang]')]
    const index = options.indexOf(document.activeElement as HTMLElement)
    if (event.key === 'ArrowDown') options[Math.min(options.length - 1, index + 1)]?.focus()
    else if (event.key === 'ArrowUp') options[Math.max(0, index - 1)]?.focus()
    else if (event.key === 'Enter' || event.key === ' ') {
      const code = (document.activeElement as HTMLElement | null)?.dataset.lang as LanguageCode | undefined
      if (code) void this.choose(code)
    } else return
    event.preventDefault()
  }
}
