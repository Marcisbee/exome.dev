import { defineConfig } from "vocs";

import exome from "exome/package.json" assert { type: "json" };

export default defineConfig({
	title: "Exome",
	iconUrl: {
		light: "/icon.svg",
		dark: "/icon.svg",
	},
	logoUrl: {
		light: "/logo-title-dark.svg",
		dark: "/logo-title-light.svg",
	},
	socials: [
		{
			icon: "github",
			link: "https://github.com/Marcisbee/exome",
		},
		{
			icon: "x",
			link: "https://twitter.com/marcisbee",
		},
	],
	sidebar: [
		{
			text: "Getting Started",
			link: "/getting-started",
		},

		{
			text: "Basics",
			link: "/basics",
			items: [
				{
					text: "Stores",
					link: "/basics/#stores",
				},
				{
					text: "Properties",
					link: "/basics/#properties",
				},
				{
					text: "Actions",
					link: "/basics/#actions",
				},
				{
					text: "Async Actions",
					link: "/basics/#async-actions",
				},
				{
					text: "Effects",
					link: "/basics/#effects",
				},
			],
		},

		{
			text: "Advanced",
			link: "/advanced",
			items: [
				{
					text: "Middleware",
					link: "/advanced/#middleware",
				},
				{
					text: "Update",
					link: "/advanced/#update",
				},
				{
					text: "Save & Load",
					link: "/advanced/#save--load",
				},
				{
					text: "Instance id",
					link: "/advanced/#instance-id",
				},
			],
		},

		{
			text: "Guides",
			link: "/guides",
			items: [
				{
					text: "Folder structure",
					link: "/guides#folder-structure",
				},
				{
					text: "Nested stores",
					link: "/guides#nested-stores",
				},
				{
					text: "Testing",
					link: "/guides#testing",
				},
				{
					text: "Devtools",
					link: "/guides#devtools",
				},
				{
					text: "Custom integration",
					link: "/guides#custom-integration",
				},
			],
		},

		{
			text: "Tutorials",
			items: [
				{
					text: "@TODO: Todo App",
					// link: '/tutorials/todo-app',
				},
				{
					text: "@TODO: Movie DB app",
					// link: '/tutorials/todo-app',
				},
				{
					text: "@TODO: Cookie Clicker Game",
					// link: '/tutorials/cookie-clicker-game',
				},
			],
		},

		{
			text: "API reference",
			items: [
				{
					text: "exome",
					link: "/api/exome",
				},
				{
					text: "exome/devtools",
					link: "/api/devtools",
				},
				{
					text: "exome/utils",
					link: "/api/utils",
				},
				{
					text: "exome/state",
					link: "/api/state",
				},
				{
					text: "exome/ghost",
					link: "/api/ghost",
				},
				{
					text: "Integrations",
					items: [
						{
							text: "exome/react",
							link: "/api/react",
						},
						{
							text: "exome/preact",
							link: "/api/preact",
						},
						{
							text: "exome/vue",
							link: "/api/vue",
						},
						{
							text: "exome/lit",
							link: "/api/lit",
						},
						{
							text: "exome/rxjs",
							link: "/api/rxjs",
						},
						{
							text: "exome/svelte",
							link: "/api/svelte",
						},
						{
							text: "exome/solid",
							link: "/api/solid",
						},
						{
							text: "exome/angular",
							link: "/api/angular",
						},
					],
				},
			],
		},
	],
	topNav: [
		{ text: "Guide & API", link: "/getting-started" },
		// { text: 'Blog', link: '/blog' },
		{
			text: exome.version,
			items: [
				{
					text: "Changelog",
					link: "https://github.com/Marcisbee/exome/blob/main/CHANGELOG.md",
				},
				{
					text: "Contributing",
					link: "https://github.com/Marcisbee/exome/blob/main/.github/CONTRIBUTING.md",
				},
			],
		},
	],
	twoslash: {
		compilerOptions: {
			paths: {
				// Source - reference source files so we don't need to build packages to get types (speeds things up)
				vocs: ["./src"],
				"vocs/*": ["./src/*"],
			},
		},
	},
});
