import { Link, Outlet, useSearchParams } from "react-router-dom"

export function ProductLayout() {
  const [searchParams, setSearchParams] = useSearchParams({ n: 3 })
  const number = searchParams.get("n")

  return (
    <>
      <nav>
        <Link to="/products/1">Product 1</Link>
        <br />
        <Link to="/products/2">Product 2</Link>
        <br />
        <Link to={`/products/${number}`}>
          Product {number}
        </Link>
        <br />
        <Link to="/products/new">
          New Product
        </Link>
      </nav>

      <input
        type="number"
        value={number}
        onChange={(e) =>
          setSearchParams({ n: e.target.value })
        }
      />

      <Outlet />
    </>
  )
}