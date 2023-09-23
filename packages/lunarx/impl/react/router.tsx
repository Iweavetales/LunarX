import React, { useContext, useEffect, useId } from "react"
import { AppRoutingContext } from "./lib/router-context"
import { useNavigate } from "react-router"
import { NavigateOptions } from "./lib/app-routing-provider"

export function Link(props: {
  href: string
  children?: React.ReactNode
  className?: string
  options?: NavigateOptions
}) {
  const router = useRouter()

  return (
    <a
      onClick={(e) => {
        e.preventDefault()

        // location.href = props.href;
        router.push(props.href, props.options)
      }}
      href={props.href}
      className={props.className}
    >
      {props.children}
    </a>
  )
}

/**
 * url 새로고침을 하지 않고 현재 페이지의 내용을 새로 로드하여 UI에 반영하는 함수
 * location.reload() 와 비슷 하지만,
 * 현재 페이지 상태를 어느정도 유지 하면서 서버측 데이터를 다시 로딩하는 목적으로 사용 할 수 있다.
 */
export const useSoftReload = () => {
  return useContext(AppRoutingContext).softReload
}

export type pushMethod = (href: string, options?: NavigateOptions) => void
export { NavigateOptions }
export const useRouter = (): { push: pushMethod } => {
  const routerContext = useContext(AppRoutingContext)
  const navigate = useNavigate()

  return {
    push: (href, options) => {
      routerContext.prepareNavigate(
        href,
        () => {
          // 실제 URL 이동
          navigate(href, {
            state: {
              id: `${Date.now()}-${Math.random() * 1000}`,
            },
            preventScrollReset: true,
          })
        },
        options
      )
    },
  }
}

/**
 * useBlockRouting
 * If you use this Hook
 * You could block route navigating
 * @param active
 * @param blockingCallback?
 *  If blockingCallback return true, Will not block to navigate route
 */
export const useBlockRouting = (
  active = true,
  blockingCallback?: () => boolean
) => {
  const routerContext = useContext(AppRoutingContext)
  const id = useId()

  const unloadListener = (event: any) => {
    if (blockingCallback && blockingCallback() === true) {
      return true
    }

    event.preventDefault()
    return (event.returnValue = "")
  }

  const onBeforeRoutingHandler = () => {
    if (blockingCallback) {
      return blockingCallback()
    }

    return false
  }

  useEffect(() => {
    if (active) {
      window.addEventListener("beforeunload", unloadListener)
      routerContext.onBeforeRouting(id, onBeforeRoutingHandler)
      return () => {
        routerContext.offBeforeRouting(id, onBeforeRoutingHandler)
        window.removeEventListener("beforeunload", unloadListener)
      }
    }
  }, [active])

  return null
}
