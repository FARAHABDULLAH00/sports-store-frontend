import { useEffect } from "react"
import { useNavigate } from "react-router-dom"

export function NotFound() {
  const navigate = useNavigate()

  useEffect(() => {
    setTimeout(() => {
      navigate("/", { state: "Error: Page not found" })
    }, 1000)
  }, [navigate])

  return <h1>Not Found</h1>
}