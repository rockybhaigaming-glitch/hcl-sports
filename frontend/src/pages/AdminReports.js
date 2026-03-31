import { useState, useEffect } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
const API = `${BACKEND_URL}/api`;

export default function AdminReports({ user, onLogout }) {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.token) {
      fetchReports();
    }
  }, [user]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/admin/reports`, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });

      setReports(response?.data || null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch reports");
      setReports(null);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Safe sport chart data
  const sportChartData = reports?.bookings_by_sport
    ? Object.entries(reports.bookings_by_sport).map(
        ([sport, count]) => ({
          sport,
          bookings: count,
        })
      )
    : [];

  // ✅ Safe + correct date sorting
  const dateChartData = reports?.bookings_by_date
    ? Object.entries(reports.bookings_by_date)
        .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
        .map(([date, count]) => ({
          date,
          bookings: count,
        }))
    : [];

  return (
    <div className="min-h-screen bg-white">
      <Navbar user={user} onLogout={onLogout} />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-4xl font-bold mb-8">
          Reports & Analytics
        </h2>

        {loading ? (
          <div className="text-center py-12">
            Loading reports...
          </div>
        ) : reports ? (
          <div className="space-y-8">
            {/* SUMMARY */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border rounded-xl p-6">
                <h3 className="text-lg text-gray-500 mb-2">
                  Total Bookings
                </h3>
                <p className="text-4xl font-bold">
                  {reports.total_bookings || 0}
                </p>
              </div>

              <div className="bg-white border rounded-xl p-6">
                <h3 className="text-lg text-gray-500 mb-2">
                  Active Bookings
                </h3>
                <p className="text-4xl font-bold text-green-600">
                  {reports.active_bookings || 0}
                </p>
              </div>

              <div className="bg-white border rounded-xl p-6">
                <h3 className="text-lg text-gray-500 mb-2">
                  Cancelled Bookings
                </h3>
                <p className="text-4xl font-bold text-red-600">
                  {reports.cancelled_bookings || 0}
                </p>
              </div>
            </div>

            {/* SPORT CHART */}
            <div className="bg-white border rounded-xl p-8">
              <h3 className="text-2xl font-bold mb-6">
                Bookings by Sport
              </h3>

              {sportChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={sportChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="sport" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="bookings" fill="#0578C3" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500">No data available</p>
              )}
            </div>

            {/* DATE CHART */}
            {dateChartData.length > 0 && (
              <div className="bg-white border rounded-xl p-8">
                <h3 className="text-2xl font-bold mb-6">
                  Bookings by Date
                </h3>

                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dateChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="bookings" fill="#5F1EBE" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* BREAKDOWN */}
            {reports?.bookings_by_sport && (
              <div className="bg-white border rounded-xl p-8">
                <h3 className="text-2xl font-bold mb-6">
                  Detailed Breakdown
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(
                    reports.bookings_by_sport
                  ).map(([sport, count]) => (
                    <div
                      key={sport}
                      className="p-4 bg-blue-100 rounded-lg"
                    >
                      <p className="text-sm text-gray-500">
                        {sport}
                      </p>
                      <p className="text-2xl font-bold">
                        {count} bookings
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-gray-500">
            No report data available
          </div>
        )}
      </div>
    </div>
  );
}