import React, { useState } from "react"
import axios from "axios"

function Admin() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [healthData, setHealthData] = useState(null)

  const resetStations = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const response = await axios.post("http://localhost:3000/api/admin/resetstations")
      if (response.data.status === "OK") {
        setMessage("Stations reset successfully")
      } else {
        setMessage(response.data.info || "Failed to reset stations")
      }
    } catch (error) {
      setMessage("Error resetting stations: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  const resetPasses = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const response = await axios.post("http://localhost:3000/api/admin/resetpasses")
      if (response.data.status === "OK") {
        setMessage("Passes reset successfully")
      } else {
        setMessage(response.data.info || "Failed to reset passes")
      }
    } catch (error) {
      setMessage("Error resetting passes: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  const addPasses = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const response = await axios.post("http://localhost:3000/api/admin/addpasses")
      if (response.data.status === "OK") {
        setMessage(`Passes added successfully. New passes: ${response.data.newPasses}`)
      } else {
        setMessage(response.data.info || "Failed to add passes")
      }
    } catch (error) {
      setMessage("Error adding passes: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  const performHealthcheck = async () => {
    setLoading(true)
    setMessage(null)
    setHealthData(null)
    try {
      const response = await axios.get("http://localhost:3000/api/admin/healthcheck")
      if (response.data.status === "OK") {
        setHealthData(response.data)
        setMessage("Healthcheck completed successfully!")
      } else {
        setMessage("Healthcheck failed: " + response.data.info)
      }
    } catch (error) {
      setMessage("Error performing healthcheck: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1>Admin Panel</h1>
      <div>
        <button onClick={resetStations} disabled={loading}>
          Reset Stations
        </button>
        <button onClick={resetPasses} disabled={loading}>
          Reset Passes
        </button>
        <button onClick={addPasses} disabled={loading}>
          Add Passes
        </button>
        <button onClick={performHealthcheck} disabled={loading}>
          Healthcheck
        </button>
      </div>
      {loading && <p>Loading...</p>}
      {message && <p>{message}</p>}
      {healthData && (
        <div>
          <h2>Healthcheck Data</h2>
          <p>Database Connection: {healthData.dbconnection}</p>
          <p>Number of Stations: {healthData.n_stations}</p>
          <p>Number of Tags: {healthData.n_tags}</p>
          <p>Number of Passes: {healthData.n_passes}</p>
        </div>
      )}
    </div>
  )
}

export default Admin



