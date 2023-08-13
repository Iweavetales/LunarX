package ReactAppServerRuntime

func (webApp *WebAppStructure) GetReactChunkName() ChunkFileName {
	reactModuleInfo := webApp.ModuleEntries["node_modules/react/index.js"]

	return reactModuleInfo.ChunkName
}

func (webApp *WebAppStructure) GetReactDomChunkName() ChunkFileName {
	reactModuleInfo := webApp.ModuleEntries["node_modules/react-dom/index.js"]

	return reactModuleInfo.ChunkName
}

func (webApp *WebAppStructure) GetReactDomServerChunkName() ChunkFileName {
	reactModuleInfo := webApp.ModuleEntries["node_modules/react-dom/server.browser.js"]

	return reactModuleInfo.ChunkName
}

func (webApp *WebAppStructure) GetReactRouterDomServerChunkName() ChunkFileName {
	reactModuleInfo := webApp.ModuleEntries["node_modules/react-router-dom/server.js"]

	return reactModuleInfo.ChunkName
}
