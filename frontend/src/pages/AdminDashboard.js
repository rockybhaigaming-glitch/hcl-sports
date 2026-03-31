import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { format, addDays } from "date-fns";
import { CalendarCheck, Users, TrendingUp } from "lucide-react";
import Navbar from "@/components/Navbar";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
const API = `${BACKEND_URL}/api`;

export default function AdminDashboard({ user, onLogout }) {
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(addDays(new Date(), 6));
  const [releasing, setReleasing] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (user?.token) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/admin/reports`, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });

      setStats(response?.data || null);
    } catch (error) {
      console.error("Failed to fetch stats", error);
      setStats(null);
    }
  };

  const handleReleaseSlots = async () => {
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }

    // ✅ Fix: prevent invalid range
    if (startDate > endDate) {
      toast.error("Start date cannot be after end date");
      return;
    }

    setReleasing(true);

    try {
      const response = await axios.post(
        `${API}/admin/slots/release`,
        {
          start_date: format(startDate, "yyyy-MM-dd"),
          end_date: format(endDate, "yyyy-MM-dd"),
        },
        {
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        }
      );

      toast.success(response?.data?.message || "Slots released");
      fetchStats();
    } catch (error) {
      console.error(error);
      toast.error(
        error?.response?.data?.detail || "Failed to release slots"
      );
    } finally {
      setReleasing(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar user={user} onLogout={onLogout} />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-4xl font-bold mb-8">Admin Dashboard</h2>

        {/* STATS */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white border rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <CalendarCheck className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-500">
                  Total Bookings
                </h3>
              </div>
              <p className="text-4xl font-bold">
                {stats.total_bookings || 0}
              </p>
            </div>

            <div className="bg-white border rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-green-500 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-500">
                  Active Bookings
                </h3>
              </div>
              <p className="text-4xl font-bold text-green-600">
                {stats.active_bookings || 0}
              </p>
            </div>

            <div className="bg-white border rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-red-500 rounded-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-500">
                  Cancelled
                </h3>
              </div>
              <p className="text-4xl font-bold text-red-600">
                {stats.cancelled_bookings || 0}
              </p>
            </div>
          </div>
        )}

        {/* RELEASE SLOTS */}
        <div className="bg-white border rounded-xl p-8">
          <h3 className="text-2xl font-bold mb-6">
            Release Weekly Slots
          </h3>

          <p className="text-gray-500 mb-6">
            Select the date range to release slots for booking.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold mb-2">
                Start Date
              </label>
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(date) => date && setStartDate(date)}
                className="rounded-md border"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                End Date
              </label>
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={(date) => date && setEndDate(date)}
                className="rounded-md border"
              />
            </div>
          </div>

          <div className="p-4 bg-gray-100 rounded-lg mb-6">
            <p className="text-sm text-gray-500">Selected Range:</p>
            <p className="font-semibold">
              {startDate && endDate
                ? `${format(startDate, "PPP")} to ${format(endDate, "PPP")}`
                : "Please select dates"}
            </p>
          </div>

          <Button
            onClick={handleReleaseSlots}
            disabled={releasing || !startDate || !endDate}
            className="px-8 py-6"
          >
            {releasing ? "Releasing Slots..." : "Release Slots"}
          </Button>
        </div>

        {/* SPORT STATS */}
        {stats?.bookings_by_sport && (
          <div className="mt-8 bg-white border rounded-xl p-8">
            <h3 className="text-2xl font-bold mb-6">
              Bookings by Sport
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(stats.bookings_by_sport || {}).map(
                ([sport, count]) => (
                  <div key={sport} className="p-4 bg-gray-100 rounded-lg">
                    <p className="text-sm text-gray-500">{sport}</p>
                    <p className="text-2xl font-bold">{count}</p>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}