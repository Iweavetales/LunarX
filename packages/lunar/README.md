<p align="center" style="text-align: center">
    <img src="https://raw.githubusercontent.com/Iweavetales/LunarX/main/assets/emblem.svg" width="200" title="Lunarx Emblem">
</p>

<p align="center">
<a aria-label="NPM version" href="https://www.npmjs.com/package/lunarx">
    <img alt="" src="https://img.shields.io/npm/v/lunarx.svg?style=for-the-badge&labelColor=000000">
</a>
<a aria-label="License" href="https://github.com/lunarx/license.md">
    <img alt="" src="https://img.shields.io/npm/l/lunarx.svg?style=for-the-badge&labelColor=000000">
</a> 
</p>

[//]: # ([![NPM Downloads][downloads-image]][downloads-url])
[//]: # (![Lunar Emblem]&#40;./assets/emblem.svg&#41;)



React SSR Framework with NodeJS and Deno

The simplified & light SSR front framework, offering greater flexibility than Next.js and Remix.Run, empower to build powerful front-end applications.


# Why Lunar?
* Flexible collaboration in business logic
* Intuitive division between backend API and front-end components
* Backend API abstraction (or "Concealed backend API" if you're implying security or hiding)
* Versatile user customization options
* Minimal core framework dependencies
* Loosely coupled with the framework

## Features
* Supports Deno runtime ( in progress )
* File based routing
* Nested routing
* Scroll position memory
* Server-side fetching
* Supports NodeJS runtime
* Page reload on edit
* SEO (in progress)
* Fast Refresh aka. HMR (in progress)

## Future Enhancements
* Highly customizable with both shallow and deep modifications
* Support for BUN runtime
* Support for Go and Rust runtimes
* Multi-thread optimized server-side processing(for Deno,Bun runtime)
* Enhanced features for front-end applications
* SolidJS


# Getting Started

```shell
# pnpx create-lunarx-app example ( Unavailable yet )

$ pnpm add lunarx
# or
$ npm add lunarx


$ lunar dev 
$ lunar start 
$ lunar build
```

## Project structure
You could refer `/examples/basic` or `/tests/samples/basic` for now.

# Architecture
## Response-Render Pipeline
1.
2.

## Application Build 
### Bundler
Lunar uses `esbuild` to quickly create a split-bundle source structure.

### Transpiler
Lunar uses `SWC` for transpile to ensure compatibility with both client-side and Node.js runtimes.


## Server Side Script

Files ending in .server.tsx will only be executed on the server side and won't be exposed to the public.

# Author

Iweavetales@github