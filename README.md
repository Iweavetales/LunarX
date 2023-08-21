<p align="center" style="text-align: center">
    <img src="./assets/emblem.svg" width="200" title="Lunar Emblem">
</p>

<p align="center">
<a aria-label="NPM version" href="https://www.npmjs.com/package/@lunargate/lunar">
    <img alt="" src="https://img.shields.io/npm/v/@lunargate/lunar.svg?style=for-the-badge&labelColor=000000">
</a>
<a aria-label="License" href="https://github.com/lunargate/lunar/license.md">
    <img alt="" src="https://img.shields.io/npm/l/@lunargate/lunar.svg?style=for-the-badge&labelColor=000000">
</a> 
</p>

[//]: # ([![NPM Downloads][downloads-image]][downloads-url])
[//]: # (![Lunar Emblem]&#40;./assets/emblem.svg&#41;)
 


React SSR Framework with NodeJS and Deno

A simplified SSR framework, offering greater flexibility than Next.js and Remix.Run, designed to build powerful front-end applications.


# Why Lunar?
* Flexible collaboration in business logic
* Intuitive division between backend API and front-end components
* Backend API abstraction (or "Concealed backend API" if you're implying security or hiding)
* Versatile user customization options
* Minimal core framework dependencies
* Loosely coupled with the framework

## Features 
* Supports Deno runtime
* File based routing
* Nested routing
* Scroll position memory
* Server-side rendering (note: this seems repetitive given the React SSR mention)
* TypeScript support
* Supports NodeJS runtime
* SEO (in progress)
* HMR (in progress)

## Future Enhancements
* Highly customizable with both shallow and deep modifications
* Support for BUN runtime
* Support for Go and Rust runtimes 
* Multi-thread optimized server-side processing(for Deno,Bun runtime)
* Enhanced features for front-end applications


# Getting Started



# Architecture
## Response-Render Pipeline
1. 
2. 

## Build 
### Bundler  
Lunar uses `esbuild` to quickly create a split-bundle source structure.

### Transpiler  
Lunar uses `SWC` for transpile to ensure compatibility with both client-side and Node.js runtimes.


## Server Side Script

Files ending in .server.tsx will only be executed on the server side and won't be exposed to the public.
