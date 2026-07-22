// @ts-check

/**
 * Listens for postMessage events from the preview iframe (console output,
 * runtime errors, navigation requests) and forwards them to the app.
 *
 * @param {{ onLog: (entry:{method:string,text:string}) => void,
 *           onError: (entry:{message:string,source?:string,line?:number,column?:number,stack?:string}) => void,
 *           onNavigate: (path:string) => void }} handlers
 */
export function initConsoleBridge(handlers) {
  window.addEventListener('message', (e) => {
    const data = e.data
    if (!data || data.__iwide !== true) return
    if (data.kind === 'console') handlers.onLog(data.payload)
    else if (data.kind === 'error') handlers.onError(data.payload)
    else if (data.kind === 'navigate') handlers.onNavigate(data.payload.path)
  })
}
