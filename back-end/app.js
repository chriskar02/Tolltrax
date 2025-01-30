require("dotenv").config()
const express = require("express")
const cors = require("cors")
const app = express()

app.use(cors())
app.use(express.json())

// Αφαιρούμε το test route από εδώ αν υπάρχει
// app.get('/api/test', (req, res) => {
//   res.json({ message: "Test route works!" })
// })

const passesRoutes = require("./routes/passes")
app.use("/api", passesRoutes)

const adminRoutes = require("./routes/admin")
app.use("/api", adminRoutes)

// Catch-all route για debugging
app.use("*", (req, res) => {
  console.log(`Received request for ${req.originalUrl}`)
  res.status(404).send("Route not found")
})

const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})

module.exports = app



require("dotenv").config()
const express = require("express")
const cors = require("cors")
const app = express()

app.use(cors())
app.use(express.json())

// Αφαιρούμε το test route από εδώ αν υπάρχει
// app.get('/api/test', (req, res) => {
//   res.json({ message: "Test route works!" })
// })

const passesRoutes = require("./routes/passes")
app.use("/api", passesRoutes)

const adminRoutes = require("./routes/admin")
app.use("/api", adminRoutes)

// Catch-all route για debugging
app.use("*", (req, res) => {
  console.log(`Received request for ${req.originalUrl}`)
  res.status(404).send("Route not found")
})

const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})

module.exports = app

