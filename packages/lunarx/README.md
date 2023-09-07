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
<a aria-label="Download" href="https://github.com/lunarx/license.md">
    <img alt="" src="https://img.shields.io/npm/dw/lunarx?style=for-the-badge&labelColor=000000">
</a> 
</p> 


React SSR Framework with NodeJS and Deno

The simplified & light SSR front framework, offering greater flexibility than Next.js and Remix.Run, empower to build powerful front-end applications.


# Why LunarX?
* Flexibility in Business Logic Collaboration
* Unrestricted Manipulation and Persistence of Headers in Server-Side Render Pipeline
* Clear Separation Between Backend API and Front-End Components
* Secure Backend Processing Concealment When Using `.server` Extension at second from last 
* Extensive User Customization Options
* Minimal Dependencies on Core Framework
* Loose Coupling with the Framework
* Full Support for Server-Side Processing in All Route Files
* Configurable Front-End App Architecture

## Features

[//]: # (* Supports Deno runtime &#40; in progress &#41;)
* File based routing
* Nested routing
* Scroll position memory
* Server-side fetching
* Supports NodeJS runtime
* Page reload on edit

[//]: # (* SEO &#40;in progress&#41;)
[//]: # (* Fast Refresh aka. HMR &#40;in progress&#41;)

[//]: # (## Future Enhancements)

[//]: # (* Highly customizable with both shallow and deep modifications)

[//]: # (* Support for BUN runtime)

[//]: # (* Support for Go and Rust runtimes)

[//]: # (* Multi-thread optimized server-side processing&#40;for Deno,Bun runtime&#41;)

[//]: # (* Enhanced features for front-end applications)

[//]: # (* SolidJS)


# Getting Started

```shell
# pnpx create-lunarx-app example ( Unavailable yet )

$ pnpm add lunarx
# or
$ npm add lunarx


$ lunarx dev 
$ lunarx start 
$ lunarx build
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

Files ending in `.server.tsx` will only be executed on the server side and won't be exposed to the public.


# Roadmap
1. Support error & 404 page
2. Optimize and persist routing states from upper nested routing rendering & fetch
3. `Server Action` like submit as Post
4. Support deno-runtime
5. 




# Author

Iweavetales@github