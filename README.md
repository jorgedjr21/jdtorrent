# JDTorrent

Cliente de torrent desktop construído com Electron, Vue 3 e TypeScript.

## Funcionalidades

- Adicionar torrents via arquivo `.torrent` ou link magnet
- Pausar e retomar downloads
- Selecionar arquivos individuais antes de baixar
- Visualizar progresso, velocidade de download/upload e peers em tempo real
- Mapa de peças em tempo real (completas, baixando, pendentes)
- Filtrar torrents por status (Todos, Baixando, Semeando, Pausado)
- Configurar pasta de destino, URL da API YTS, trackers e porta de download (VPN)
- Torrents persistidos entre sessões
- Descoberta de filmes via API YTS com trailer, screenshots e elenco
- Auto-update via GitHub Releases
- Interface em português e inglês (vue-i18n)

## Tecnologias

- [Electron](https://www.electronjs.org/) — shell desktop
- [Vue 3](https://vuejs.org/) + [TypeScript](https://www.typescriptlang.org/) — frontend (Composition API)
- [Vite](https://vite.dev/) — bundler
- [WebTorrent v2](https://webtorrent.io/) — engine de torrent
- [Bulma](https://bulma.io/) — CSS framework
- [FontAwesome](https://fontawesome.com/) — ícones
- [Vue Router](https://router.vuejs.org/) — roteamento
- [vue-i18n](https://vue-i18n.intlify.dev/) — internacionalização
- [electron-updater](https://www.electron.build/auto-update) — auto-update

## Pré-requisitos

- Node.js 22+
- npm

## Instalação

```bash
npm install
```

## Comandos

```bash
# Desenvolvimento (Vite + Electron com hot-reload)
npm run dev

# Testes
npm test

# Lint
npm run lint

# Build para a plataforma atual
npm run build

# Build apenas para Linux (.AppImage + .deb)
npm run build:linux

# Build apenas para Windows (.exe)
npm run build:win
```

## Estrutura do projeto

```
electron/
  main.ts        # Lifecycle do Electron, janela e auto-updater
  preload.ts     # contextBridge — expõe electronAPI ao renderer
  torrent.ts     # Lógica WebTorrent (add, pause, resume, remove, peek)
  settings.ts    # Configurações (downloadPath, ytsApiUrl, trackers, locale, torrentPort)
  __tests__/     # Testes unitários do processo principal

src/
  views/
    TorrentsView.vue      # Listagem e controle de torrents (polling 500ms)
    SettingsView.vue      # Configurações do app
    MoviesView.vue        # Busca de filmes via YTS
    MovieDetailsView.vue  # Detalhes do filme e download por qualidade
  components/
    Sidebar.vue             # Navegação lateral
    AddTorrentModal.vue     # Modal para adicionar torrent
    TorrentFilesModal.vue   # Seleção de arquivos do torrent
  services/yts.ts   # Chamadas à API YTS
  utils/torrent.ts  # Helpers: formatSpeed, formatSize, statusLabel
  locales/          # Traduções pt-BR e en
  types/
    torrent.ts     # TorrentInfo, TorrentFile
    movie.ts       # Tipos da API YTS
    electron.d.ts  # Tipagem window.electronAPI
  router/index.ts  # Rotas da aplicação
  main.ts          # Bootstrap do Vue
```

## CI/CD

- **CI** (`ci.yml`): lint + testes em cada push/PR
- **Release** (`release.yml`): build para Linux e Windows ao fazer push de tag `v*`
- **Version bump** (`version-bump.yml`): ao fazer merge de PR com `major`, `minor` ou `patch` no nome da branch, bump automático de versão e criação da tag
