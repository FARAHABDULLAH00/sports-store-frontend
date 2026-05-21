import { useParams, useOutletContext } from "react-router-dom"

export function Product() {
  const { id } = useParams()
  const obj = useOutletContext()

  return (
    <h1>
      Product {id} {obj.hello}
    </h1>
  )
}