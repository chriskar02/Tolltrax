"use client"

import React, { useState } from "react"
import axios from "axios"

interface HealthcheckData {
  status: string
  dbconnection: string
  n_stations: number
  n_tags: number
  n_passes: number
}

export default function AdminPanel() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [healthData, setHealthData] = useState<HealthcheckData | null>(null)

  const resetStations = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const response = await axios.post("http://localhost:9115/api/admin/resetstations")
      setMessage(response.data.status === "OK" ? "Stations reset successfully!" : response.data.info)
    } catch (error) {
      setMessage("Error resetting stations: " + (error instanceof Error ? error.message : String(error)))
    } finally {
      setLoading(false)
    }
  }

  const resetPasses = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const response = await axios.post("http://localhost:9115/api/admin/resetpasses")
      setMessage(response.data.status === "OK" ? "Passes reset successfully!" : response.data.info)
    } catch (error) {
      setMessage("Error resetting passes: " + (error instanceof Error ? error.message : String(error)))
    } finally {
      setLoading(false)
    }
  }

  const addPasses = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const response = await axios.post("http://localhost:9115/api/admin/addpasses")
      setMessage(
        response.data.status === "OK"
          ? `Passes added successfully! New passes: ${response.data.newPasses}`
          : response.data.info,
      )
    } catch (error) {
      setMessage("Error adding passes: " + (error instanceof Error ? error.message : String(error)))
    } finally {
      setLoading(false)
    }
  }

  const performHealthcheck = async () => {
    setLoading(true)
    setMessage(null)
    setHealthData(null)
    try {
      const response = await axios.get("http://localhost:9115/api/admin/healthcheck")
      if (response.data.status === "OK") {
        setHealthData(response.data)
        setMessage("Healthcheck completed successfully!")
      } else {
        setMessage("Healthcheck failed: " + response.data.info)
      }
    } catch (error) {
      setMessage("Error performing healthcheck: " + (error instanceof Error ? error.message : String(error)))
    } finally {
      setLoading(false)
    }
  }

  const resetUsers = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const response = await axios.post("http://localhost:9115/api/admin/resetusers")
      setMessage(response.data.status === "OK" ? "Users populated successfully!" : response.data.info)
    } catch (error) {
      setMessage("Error populating users: " + (error instanceof Error ? error.message : String(error)))
    } finally {
      setLoading(false)
    }
  }

  const resetVehicles = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const response = await axios.post("http://localhost:9115/api/admin/resetvehicles")
      setMessage(response.data.status === "OK" ? "Vehicles populated successfully!" : response.data.info)
    } catch (error) {
      setMessage("Error populating vehicles: " + (error instanceof Error ? error.message : String(error)))
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Admin Panel</h1>
      <div className="space-x-2">
        <button
          onClick={resetStations}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
        >
          Reset Stations
        </button>
        <button
          onClick={resetPasses}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-green-300"
        >
          Reset Passes
        </button>
        <button
          onClick={addPasses}
          disabled={loading}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:bg-yellow-300"
        >
          Add Passes
        </button>
        <button
          onClick={performHealthcheck}
          disabled={loading}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-purple-300"
        >
          Healthcheck
        </button>
        <button
          onClick={resetUsers}
          disabled={loading}
          className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:bg-orange-300"
        >
          Populate Users
        </button>
        <button
          onClick={resetVehicles}
          disabled={loading}
          className="px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600 disabled:bg-pink-300"
        >
          Populate Vehicles
        </button>
        <button
          onClick={resetStations}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
        ></button>
      </div>
      {loading && <p className="text-gray-500">Loading...</p>}
      {message && <p className={`mt-2 ${message.includes("Error") ? "text-red-500" : "text-green-500"}`}>{message}</p>}
      {healthData && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h2 className="text-xl font-semibold mb-2">Healthcheck Data</h2>
          <p>Database Connection: {healthData.dbconnection}</p>
          <p>Number of Stations: {healthData.n_stations}</p>
          <p>Number of Tags: {healthData.n_tags}</p>
          <p>Number of Passes: {healthData.n_passes}</p>
        </div>
      )}
    </div>
  )
}



