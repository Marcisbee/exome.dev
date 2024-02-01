import { defineConfig } from 'vocs'

import exome from 'exome/package.json' assert { type: "json" }

export default defineConfig({
  title: 'Exome',
  iconUrl: {
    light: '/icon.svg',
    dark: '/icon.svg',
  },
  logoUrl: {
    light: '/logo-title-dark.svg',
    dark: '/logo-title-light.svg',
  },
  socials: [
    {
      icon: 'github',
      link: 'https://github.com/Marcisbee/exome',
    },
    {
      icon: 'x',
      link: 'https://twitter.com/marcisbee',
    },
  ],
  sidebar: [
    {
      text: 'Getting Started',
      link: '/getting-started',
    },
    {
      text: 'Basics',
      link: '/basics',
      items: [
        {
          text: 'Stores',
          link: '/basics/#stores',
        },
        {
          text: 'Properties',
          link: '/basics/#properties',
        },
        {
          text: 'Actions',
          link: '/basics/#actions',
        },
        {
          text: 'Async Actions',
          link: '/basics/#async-actions',
        },
        {
          text: 'Effects',
          link: '/basics/#effects',
        },
      ],
    },

    {
      text: 'Tutorials',
      items: [
        {
          text: 'Todo App',
          link: '/tutorials/todo-app',
        },
        {
          text: 'Movie DB app',
          link: '/tutorials/todo-app',
        },
        {
          text: 'Cookie Clicker Game',
          link: '/tutorials/cookie-clicker-game',
        },
      ],
    },

    {
      text: 'Integration',
      items: [
        {
          text: 'React',
          link: '/integration/react',
        },
        {
          text: 'Preact',
          link: '/integration/preact',
        },
        {
          text: 'Vue',
          link: '/integration/vue',
        },
        {
          text: 'Svelte',
          link: '/integration/svelte',
        },
        {
          text: 'Solid',
          link: '/integration/solid',
        },
        {
          text: 'Lit',
          link: '/integration/lit',
        },
        {
          text: 'Rxjs',
          link: '/integration/rxjs',
        },
        {
          text: 'Angular',
          link: '/integration/angular',
        },
        {
          text: 'No framework',
          link: '/integration/vanilla',
        },
      ],
    },

    {
      text: 'Guides',
      items: [
        {
          text: 'Folder structure',
          link: '/guides/folder-structure',
        },
        {
          text: 'Nested stores',
          link: '/guides/nested-stores',
        },
        {
          text: 'Testing',
          link: '/guides/testing',
        },
      ],
    },

    {
      text: 'API reference',
      collapsed: true,
      items: [
        {
          text: 'exome',
          link: '/api/exome',
        },
        {
          text: 'exome/devtools',
          link: '/api/devtools',
        },
        {
          text: 'exome/ghost',
          link: '/api/ghost',
        },
        {
          text: 'exome/state',
          link: '/api/state',
        },
        {
          text: 'exome/utils',
          link: '/api/utils',
        },
        {
          text: 'exome/react',
          link: '/api/react',
        },
        {
          text: 'exome/preact',
          link: '/api/preact',
        },
        {
          text: 'exome/vue',
          link: '/api/vue',
        },
        {
          text: 'exome/lit',
          link: '/api/lit',
        },
        {
          text: 'exome/rxjs',
          link: '/api/rxjs',
        },
        {
          text: 'exome/svelte',
          link: '/api/svelte',
        },
        {
          text: 'exome/solid',
          link: '/api/solid',
        },
        {
          text: 'exome/angular',
          link: '/api/angular',
        },
      ],
    },
  ],
  topNav: [
    { text: 'Guide & API', link: '/getting-started' },
    // { text: 'Blog', link: '/blog' },
    {
      text: exome.version,
      items: [
        {
          text: 'Changelog',
          link: 'https://github.com/Marcisbee/exome/blob/main/CHANGELOG.md',
        },
        {
          text: 'Contributing',
          link: 'https://github.com/Marcisbee/exome/blob/main/.github/CONTRIBUTING.md',
        },
      ],
    },
  ],
  twoslash: {
    compilerOptions: {
      paths: {
        // Source - reference source files so we don't need to build packages to get types (speeds things up)
        vocs: ['./src'],
        'vocs/*': ['./src/*'],
      },
    },
  },
})
