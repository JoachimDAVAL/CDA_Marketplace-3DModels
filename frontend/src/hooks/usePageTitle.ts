import { useEffect } from 'react'

export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = `${title} — Abstract`
    return () => { document.title = 'Abstract' }
  }, [title])
}
