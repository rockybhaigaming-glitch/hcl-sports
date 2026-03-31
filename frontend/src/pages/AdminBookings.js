import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Trash2, Search } from "lucide-react";
import Navbar from "@/components/Navbar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
const API = `${BACKEND_URL}/api`;

export default function AdminBookings({ user, onLogout }) {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    if (user?.token) {
      fetchBookings();
    }
  }, [user]);

  useEffect(() => {
    const query = searchQuery.toLowerCase();

    const filtered = bookings.filter((b) => {
      return (
        (b.employee_name || "").toLowerCase().includes(query) ||
        (b.employee_id || "").toLowerCase().includes(query) ||
        (b.sport || "").toLowerCase().includes(query) ||
        (b.date || "").includes(query)
      );
    });

    setFilteredBookings(filtered);
  }, [searchQuery, bookings]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/admin/bookings`, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });

      const data = response?.data || [];
      setBookings(data);
      setFilteredBookings(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch bookings");
      setBookings([]);
      setFilteredBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!selectedBooking) return;

    try {
      await axios.delete(
        `${API}/admin/bookings/${selectedBooking.booking_id}`,
        {
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        }
      );

      toast.success("Booking cancelled successfully");

      // ✅ Optimistic update (no refetch needed)
      setBookings((prev) =>
        prev.map((b) =>
          b.booking_id === selectedBooking.booking_id
            ? { ...b, status: "cancelled" }
            : b
        )
      );

      setCancelDialogOpen(false);
      setSelectedBooking(null);
    } catch (error) {
      console.error(error);
      toast.error(
        error?.response?.data?.detail || "Failed to cancel booking"
      );
    }
  };

  const activeBookings = filteredBookings.filter(
    (b) => b.status === "active"
  );
  const cancelledBookings = filteredBookings.filter(
    (b) => b.status === "cancelled"
  );

  return (
    <div className="min-h-screen bg-white">
      <Navbar user={user} onLogout={onLogout} />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-4xl font-bold">All Bookings</h2>

          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />

            <Input
              type="text"
              placeholder="Search bookings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading bookings...</div>
        ) : (
          <div className="space-y-8">
            {/* ACTIVE */}
            <div>
              <h3 className="text-2xl font-semibold mb-4">
                Active Bookings ({activeBookings.length})
              </h3>

              {activeBookings.length === 0 ? (
                <div className="bg-gray-100 rounded-xl p-8 text-center">
                  <p className="text-gray-500">
                    No active bookings
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeBookings.map((booking) => (
                    <div
                      key={booking.booking_id}
                      className="bg-white border rounded-xl p-6 hover:shadow-md transition"
                    >
                      <div className="flex justify-between mb-4">
                        <div>
                          <h4 className="text-xl font-bold text-blue-600">
                            {booking.sport}
                          </h4>
                          <p className="text-sm text-gray-500">
                            ID: {booking.booking_id}
                          </p>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setCancelDialogOpen(true);
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>

                      <p><b>Employee:</b> {booking.employee_name}</p>
                      <p className="text-sm text-gray-500">
                        {booking.employee_id}
                      </p>
                      <p><b>Date:</b> {booking.date}</p>
                      <p><b>Time:</b> {booking.time_slot}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CANCELLED */}
            <div>
              <h3 className="text-2xl font-semibold mb-4">
                Cancelled Bookings ({cancelledBookings.length})
              </h3>

              {cancelledBookings.length === 0 ? (
                <div className="bg-gray-100 rounded-xl p-8 text-center">
                  <p className="text-gray-500">
                    No cancelled bookings
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cancelledBookings.map((booking) => (
                    <div
                      key={booking.booking_id}
                      className="bg-gray-200 border rounded-xl p-6 opacity-70"
                    >
                      <h4 className="text-xl font-bold text-gray-500">
                        {booking.sport}
                      </h4>

                      <p className="text-sm text-gray-500">
                        ID: {booking.booking_id}
                      </p>

                      <p><b>Employee:</b> {booking.employee_name}</p>
                      <p className="text-sm text-gray-500">
                        {booking.employee_id}
                      </p>
                      <p><b>Date:</b> {booking.date}</p>
                      <p><b>Time:</b> {booking.time_slot}</p>

                      <p className="text-red-600 font-semibold mt-2">
                        CANCELLED
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* DIALOG */}
      <AlertDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedBooking && (
                <>
                  Cancel <b>{selectedBooking.employee_name}</b>'s booking for{" "}
                  <b>{selectedBooking.sport}</b> on{" "}
                  <b>{selectedBooking.date}</b> at{" "}
                  <b>{selectedBooking.time_slot}</b>?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>No</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelBooking}
              className="bg-red-500 hover:bg-red-600"
            >
              Yes, Cancel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}