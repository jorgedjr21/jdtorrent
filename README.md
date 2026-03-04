# JDTorrent

Cliente de torrent desktop construído com Electron, Vue 3 e TypeScript.

## Funcionalidades

- Adicionar torrents via arquivo `.torrent` ou link magnet
- Pausar e retomar downloads
- Visualizar progresso, velocidade de download/upload e peers em tempo real
- Filtrar torrents por status (Todos, Baixando, Semeando, Pausado, Concluído)
- Configurar pasta de destino dos downloads
- Torrents persistidos entre sessões

## Tecnologias

- [Electron](https://www.electronjs.org/) — shell desktop
- [Vue 3](https://vuejs.org/) + [TypeScript](https://www.typescriptlang.org/) — frontend
- [Vite](https://vite.dev/) — bundler
- [WebTorrent](https://webtorrent.io/) — engine de torrent
- [Bulma](https://bulma.io/) — CSS framework
- [FontAwesome](https://fontawesome.com/) — ícones

## Pré-requisitos

- Node.js 18+
- npm

## Instalação

```bash
npm install
```

## Desenvolvimento

```bash
npm run dev
```

Inicia o Vite e o Electron em modo desenvolvimento com hot-reload.

## Build

```bash
npm run build
```

Gera o instalador na pasta `dist/`.

## Estrutura do projeto

```
electron/
  main.ts        # Lifecycle do Electron e criação da janela
  preload.ts     # Bridge entre frontend e backend (contextBridge)
  torrent.ts     # Lógica de torrent (WebTorrent, IPC handlers)
  settings.ts    # Configurações do app (pasta de download)
src/
  views/
    TorrentsView.vue   # Listagem e controle de torrents
    SettingsView.vue   # Configurações
  components/
    Sidebar.vue           # Navegação lateral
    AddTorrentModal.vue   # Modal para adicionar torrent
  types/
    torrent.ts     # Interfaces TorrentInfo e TorrentFile
    electron.d.ts  # Tipagem do window.electronAPI
  router/
    index.ts       # Rotas da aplicação
  main.ts          # Bootstrap do Vue
```
