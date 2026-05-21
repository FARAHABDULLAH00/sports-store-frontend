import React, { useState, useEffect, createContext, useContext } from "react"
import { Link, Route, Routes, useLocation, useNavigate } from "react-router-dom"
import "./App.css"

const API = ""

// Auth Context
const AuthContext = createContext(null)

function useAuth() {
  return useContext(AuthContext)
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/api/auth/me`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.user) setUser(data.user)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const login = (userData) => setUser(userData)
  const logout = async () => {
    await fetch(`${API}/api/auth/logout`, { method: "POST", credentials: "include" })
    setUser(null)
  }

  if (loading) return <div className="loading">Loading...</div>

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// Home Page
function Home() {
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [query, setQuery] = useState("")
  const [sortBy, setSortBy] = useState("ascending")
  const [showForm, setShowForm] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [form, setForm] = useState({ name: "", category: "", brand: "", price: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API}/api/products`, { credentials: "include" })
      const data = await res.json()
      setProducts(data)
    } catch {
      setError("Failed to fetch products")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProducts() }, [])

  const handleSubmit = async () => {
    setError("")
    if (!form.name || !form.category || !form.brand || !form.price)
      return setError("All fields are required")

    const url = editProduct
      ? `${API}/api/products/${editProduct._id}`
      : `${API}/api/products`
    const method = editProduct ? "PUT" : "POST"

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...form, price: Number(form.price) }),
      })
      const data = await res.json()
      if (!res.ok) return setError(data.message)

      await fetchProducts()
      setForm({ name: "", category: "", brand: "", price: "" })
      setShowForm(false)
      setEditProduct(null)
    } catch {
      setError("Something went wrong")
    }
  }

  const handleEdit = (product) => {
    setEditProduct(product)
    setForm({ name: product.name, category: product.category, brand: product.brand, price: product.price })
    setShowForm(true)
    setError("")
  }

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return
    try {
      const res = await fetch(`${API}/api/products/${id}`, {
        method: "DELETE",
        credentials: "include",
      })
      const data = await res.json()
      if (!res.ok) return alert(data.message)
      await fetchProducts()
    } catch {
      alert("Delete failed")
    }
  }

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase())
  )

  const sorted = [...filtered].sort((a, b) =>
    sortBy === "ascending"
      ? a.name.localeCompare(b.name)
      : b.name.localeCompare(a.name)
  )

  const isOwner = (product) =>
    user && product.createdBy && product.createdBy._id === user.id

  return (
    <main className="page">
      <div className="page-header">
        <h1>Sports Products</h1>
        {user && (
          <button className="btn-primary" onClick={() => {
            setShowForm(!showForm)
            setEditProduct(null)
            setForm({ name: "", category: "", brand: "", price: "" })
            setError("")
          }}>
            {showForm ? "Cancel" : "+ Add Product"}
          </button>
        )}
      </div>

      {showForm && user && (
        <div className="form-card">
          <h2>{editProduct ? "Edit Product" : "Add New Product"}</h2>
          {error && <p className="error">{error}</p>}
          <div className="form-grid">
            <input placeholder="Product Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            <input placeholder="Brand" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
            <input type="number" placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </div>
          <button className="btn-primary" onClick={handleSubmit}>
            {editProduct ? "Update Product" : "Add Product"}
          </button>
        </div>
      )}

      <div className="controls">
        <input
          type="search"
          placeholder="Search by product..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="ascending">Ascending</option>
          <option value="descending">Descending</option>
        </select>
      </div>

      {loading ? (
        <p className="loading">Loading products...</p>
      ) : (
        <div className="grid">
          {sorted.map((product) => (
            <div className="card" key={product._id}>
              <h2>{product.name}</h2>
              <p><strong>Category:</strong> {product.category}</p>
              <p><strong>Brand:</strong> {product.brand}</p>
              <p><strong>Price:</strong> ${product.price}</p>
              {product.createdBy && (
                <p className="owner">Added by: {product.createdBy.fullName}</p>
              )}
              {isOwner(product) && (
                <div className="card-actions">
                  <button className="btn-edit" onClick={() => handleEdit(product)}>Edit</button>
                  <button className="btn-delete" onClick={() => handleDelete(product._id)}>Delete</button>
                </div>
              )}
            </div>
          ))}
          {sorted.length === 0 && <p>No products found.</p>}
        </div>
      )}
    </main>
  )
}

// Login Page
function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: "", password: "" })
  const [error, setError] = useState("")

  const handleLogin = async () => {
    setError("")
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) return setError(data.message)
      login(data.user)
      navigate("/")
    } catch {
      setError("Login failed. Try again.")
    }
  }

  return (
    <main className="page form-page">
      <h1>Login</h1>
      {error && <p className="error">{error}</p>}
      <div className="form">
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <button className="btn-primary" onClick={handleLogin}>Login</button>
        <p>Don't have an account? <Link to="/register">Register</Link></p>
      </div>
    </main>
  )
}

// Register Page
function Register() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: "", email: "", password: "" })
  const [error, setError] = useState("")

  const handleRegister = async () => {
    setError("")
    try {
      const res = await fetch(`${API}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) return setError(data.message)
      login(data.user)
      navigate("/")
    } catch {
      setError("Registration failed. Try again.")
    }
  }

  return (
    <main className="page form-page">
      <h1>Register</h1>
      {error && <p className="error">{error}</p>}
      <div className="form">
        <input
          type="text"
          placeholder="Full Name"
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
        />
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <button className="btn-primary" onClick={handleRegister}>Register</button>
        <p>Already have an account? <Link to="/login">Login</Link></p>
      </div>
    </main>
  )
}

// About Page
function About() {
  return (
    <main className="page">
      <h1>About Our Team</h1>
      <p>
        This is a full MERN stack application for managing sports products.
        Users can register, login, and manage their own product listings.
      </p>
    </main>
  )
}

function NotFound() {
  return <h1 className="page">404 Page Not Found</h1>
}

// Navbar with auth state
function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate("/")
  }

  return (
    <nav className="navbar">
      <h2>Sports Store</h2>
      <ul>
        <li><Link to="/">Home</Link></li>
        {user ? (
          <>
            <li><span className="nav-user">👋 {user.fullName}</span></li>
            <li><button className="btn-logout" onClick={handleLogout}>Logout</button></li>
          </>
        ) : (
          <>
            <li><Link to="/login">Login</Link></li>
            <li><Link to="/register">Register</Link></li>
          </>
        )}
        <li><Link to="/about">About</Link></li>
      </ul>
    </nav>
  )
}

function App() {
  const location = useLocation()

  return (
    <AuthProvider>
      <Navbar />
      {location.state && <p>{location.state}</p>}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/about" element={<About />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
