declare module 'astro:content' {
	interface Render {
		'.mdx': Promise<{
			Content: import('astro').MarkdownInstance<{}>['Content'];
			headings: import('astro').MarkdownHeading[];
			remarkPluginFrontmatter: Record<string, any>;
			components: import('astro').MDXInstance<{}>['components'];
		}>;
	}
}

declare module 'astro:content' {
	interface RenderResult {
		Content: import('astro/runtime/server/index.js').AstroComponentFactory;
		headings: import('astro').MarkdownHeading[];
		remarkPluginFrontmatter: Record<string, any>;
	}
	interface Render {
		'.md': Promise<RenderResult>;
	}

	export interface RenderedContent {
		html: string;
		metadata?: {
			imagePaths: Array<string>;
			[key: string]: unknown;
		};
	}
}

declare module 'astro:content' {
	type Flatten<T> = T extends { [K: string]: infer U } ? U : never;

	export type CollectionKey = keyof AnyEntryMap;
	export type CollectionEntry<C extends CollectionKey> = Flatten<AnyEntryMap[C]>;

	export type ContentCollectionKey = keyof ContentEntryMap;
	export type DataCollectionKey = keyof DataEntryMap;

	type AllValuesOf<T> = T extends any ? T[keyof T] : never;
	type ValidContentEntrySlug<C extends keyof ContentEntryMap> = AllValuesOf<
		ContentEntryMap[C]
	>['slug'];

	/** @deprecated Use `getEntry` instead. */
	export function getEntryBySlug<
		C extends keyof ContentEntryMap,
		E extends ValidContentEntrySlug<C> | (string & {}),
	>(
		collection: C,
		// Note that this has to accept a regular string too, for SSR
		entrySlug: E,
	): E extends ValidContentEntrySlug<C>
		? Promise<CollectionEntry<C>>
		: Promise<CollectionEntry<C> | undefined>;

	/** @deprecated Use `getEntry` instead. */
	export function getDataEntryById<C extends keyof DataEntryMap, E extends keyof DataEntryMap[C]>(
		collection: C,
		entryId: E,
	): Promise<CollectionEntry<C>>;

	export function getCollection<C extends keyof AnyEntryMap, E extends CollectionEntry<C>>(
		collection: C,
		filter?: (entry: CollectionEntry<C>) => entry is E,
	): Promise<E[]>;
	export function getCollection<C extends keyof AnyEntryMap>(
		collection: C,
		filter?: (entry: CollectionEntry<C>) => unknown,
	): Promise<CollectionEntry<C>[]>;

	export function getEntry<
		C extends keyof ContentEntryMap,
		E extends ValidContentEntrySlug<C> | (string & {}),
	>(entry: {
		collection: C;
		slug: E;
	}): E extends ValidContentEntrySlug<C>
		? Promise<CollectionEntry<C>>
		: Promise<CollectionEntry<C> | undefined>;
	export function getEntry<
		C extends keyof DataEntryMap,
		E extends keyof DataEntryMap[C] | (string & {}),
	>(entry: {
		collection: C;
		id: E;
	}): E extends keyof DataEntryMap[C]
		? Promise<DataEntryMap[C][E]>
		: Promise<CollectionEntry<C> | undefined>;
	export function getEntry<
		C extends keyof ContentEntryMap,
		E extends ValidContentEntrySlug<C> | (string & {}),
	>(
		collection: C,
		slug: E,
	): E extends ValidContentEntrySlug<C>
		? Promise<CollectionEntry<C>>
		: Promise<CollectionEntry<C> | undefined>;
	export function getEntry<
		C extends keyof DataEntryMap,
		E extends keyof DataEntryMap[C] | (string & {}),
	>(
		collection: C,
		id: E,
	): E extends keyof DataEntryMap[C]
		? Promise<DataEntryMap[C][E]>
		: Promise<CollectionEntry<C> | undefined>;

	/** Resolve an array of entry references from the same collection */
	export function getEntries<C extends keyof ContentEntryMap>(
		entries: {
			collection: C;
			slug: ValidContentEntrySlug<C>;
		}[],
	): Promise<CollectionEntry<C>[]>;
	export function getEntries<C extends keyof DataEntryMap>(
		entries: {
			collection: C;
			id: keyof DataEntryMap[C];
		}[],
	): Promise<CollectionEntry<C>[]>;

	export function render<C extends keyof AnyEntryMap>(
		entry: AnyEntryMap[C][string],
	): Promise<RenderResult>;

	export function reference<C extends keyof AnyEntryMap>(
		collection: C,
	): import('astro/zod').ZodEffects<
		import('astro/zod').ZodString,
		C extends keyof ContentEntryMap
			? {
					collection: C;
					slug: ValidContentEntrySlug<C>;
				}
			: {
					collection: C;
					id: keyof DataEntryMap[C];
				}
	>;
	// Allow generic `string` to avoid excessive type errors in the config
	// if `dev` is not running to update as you edit.
	// Invalid collection names will be caught at build time.
	export function reference<C extends string>(
		collection: C,
	): import('astro/zod').ZodEffects<import('astro/zod').ZodString, never>;

	type ReturnTypeOrOriginal<T> = T extends (...args: any[]) => infer R ? R : T;
	type InferEntrySchema<C extends keyof AnyEntryMap> = import('astro/zod').infer<
		ReturnTypeOrOriginal<Required<ContentConfig['collections'][C]>['schema']>
	>;

	type ContentEntryMap = {
		"posts": {
"2016-02-21-schedule-task-in-docker.md": {
	id: "2016-02-21-schedule-task-in-docker.md";
  slug: "2016-02-21-schedule-task-in-docker";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"2017-05-11-cyq-containerlize-practice.md": {
	id: "2017-05-11-cyq-containerlize-practice.md";
  slug: "2017-05-11-cyq-containerlize-practice";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"2021-08-01-k8s-cookbook.md": {
	id: "2021-08-01-k8s-cookbook.md";
  slug: "2021-08-01-k8s-cookbook";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"2021-09-11-k8s-crash.md": {
	id: "2021-09-11-k8s-crash.md";
  slug: "2021-09-11-k8s-crash";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"2021-10-23-build-springboot-dev-env-in-vscode.md": {
	id: "2021-10-23-build-springboot-dev-env-in-vscode.md";
  slug: "2021-10-23-build-springboot-dev-env-in-vscode";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"2022-01-23-build-jekyll-on-aliyun-flow.md": {
	id: "2022-01-23-build-jekyll-on-aliyun-flow.md";
  slug: "2022-01-23-build-jekyll-on-aliyun-flow";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"2022-01-30-blog-mobilization.md": {
	id: "2022-01-30-blog-mobilization.md";
  slug: "2022-01-30-blog-mobilization";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"2022-02-26-mac-window-manager.md": {
	id: "2022-02-26-mac-window-manager.md";
  slug: "2022-02-26-mac-window-manager";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"react-native-/2016-03-05-use-docker-build-reactjs.md": {
	id: "react-native-/2016-03-05-use-docker-build-reactjs.md";
  slug: "react-native-/2016-03-05-use-docker-build-reactjs";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"react-native-/2016-05-12-react-native-guide.md": {
	id: "react-native-/2016-05-12-react-native-guide.md";
  slug: "react-native-/2016-05-12-react-native-guide";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"react-native-/2016-10-05-react-native-adopt-to-xcode8.md": {
	id: "react-native-/2016-10-05-react-native-adopt-to-xcode8.md";
  slug: "react-native-/2016-10-05-react-native-adopt-to-xcode8";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"react-native-/2017-03-05-redux-saga.md": {
	id: "react-native-/2017-03-05-redux-saga.md";
  slug: "react-native-/2017-03-05-redux-saga";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"react-native-/2018-02-11-aliyun-fc-RN-hotpatch-backend.md": {
	id: "react-native-/2018-02-11-aliyun-fc-RN-hotpatch-backend.md";
  slug: "react-native-/2018-02-11-aliyun-fc-rn-hotpatch-backend";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"uncategorized/0000-00-00-k8s-paas-index.md": {
	id: "uncategorized/0000-00-00-k8s-paas-index.md";
  slug: "uncategorized/0000-00-00-k8s-paas-index";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"uncategorized/0000-00-00-life-hacks-index.md": {
	id: "uncategorized/0000-00-00-life-hacks-index.md";
  slug: "uncategorized/0000-00-00-life-hacks-index";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"uncategorized/0000-00-00-react-native-index.md": {
	id: "uncategorized/0000-00-00-react-native-index.md";
  slug: "uncategorized/0000-00-00-react-native-index";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"uncategorized/2016-02-21-welcome-to-jekyll.md": {
	id: "uncategorized/2016-02-21-welcome-to-jekyll.md";
  slug: "uncategorized/2016-02-21-welcome-to-jekyll";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"uncategorized/2017-03-11-cyq-app-architecture-evolution.md": {
	id: "uncategorized/2017-03-11-cyq-app-architecture-evolution.md";
  slug: "uncategorized/2017-03-11-cyq-app-architecture-evolution";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
};

	};

	type DataEntryMap = {
		
	};

	type AnyEntryMap = ContentEntryMap & DataEntryMap;

	export type ContentConfig = typeof import("../../src/content/config.js");
}
