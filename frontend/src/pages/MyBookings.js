import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
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

export default function MyBookings({ user, onLogout }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    if (user?.token) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/bookings/my`, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });

      setBookings(response?.data || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch bookings");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!selectedBooking) return;

    try {
      await axios.delete(`${API}/bookings/${selectedBooking.booking_id}`, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });

      toast.success("Booking cancelled successfully");

      // Optimistic UI update (faster UX)
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

  const activeBookings = bookings.filter(
    (b) => b.status === "active"
  );
  const cancelledBookings = bookings.filter(
    (b) => b.status === "cancelled"
  );

  return (
    <div className="min-h-screen bg-white">
      <Navbar user={user} onLogout={onLogout} />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-4xl font-bold mb-8">My Bookings</h2>

        {loading ? (
          <div className="text-center py-12">Loading bookings...</div>
        ) : (
          <div className="space-y-8">
            {/* ACTIVE BOOKINGS */}
            <div>
              <h3 className="text-2xl font-semibold mb-4">
                Active Bookings ({activeBookings.length})
              </h3>

              {activeBookings.length === 0 ? (
                <div className="bg-gray-100 rounded-xl p-8 text-center">
                  <p className="text-gray-500">No active bookings</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeBookings.map((booking) => (
                    <div
                      key={booking.booking_id}
                      className="bg-white border rounded-xl p-6 hover:shadow-md transition"
                    >
                      <div className="flex justify-between items-start mb-4">
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
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <p>
                          <span className="font-semibold">Date:</span>{" "}
                          {booking.date}
                        </p>
                        <p>
                          <span className="font-semibold">Time:</span>{" "}
                          {booking.time_slot}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CANCELLED BOOKINGS */}
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
                      <div className="mb-4">
                        <h4 className="text-xl font-bold text-gray-500">
                          {booking.sport}
                        </h4>
                        <p className="text-sm text-gray-500">
                          ID: {booking.booking_id}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <p>
                          <span className="font-semibold">Date:</span>{" "}
                          {booking.date}
                        </p>
                        <p>
                          <span className="font-semibold">Time:</span>{" "}
                          {booking.time_slot}
                        </p>
                        <p className="text-red-600 font-semibold">
                          CANCELLED
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ALERT DIALOG */}
      <AlertDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this booking{" "}
              {selectedBooking && (
                <>
                  for <b>{selectedBooking.sport}</b> on{" "}
                  <b>{selectedBooking.date}</b> at{" "}
                  <b>{selectedBooking.time_slot}</b>?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>No, keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelBooking}
              className="bg-red-500 hover:bg-red-600"
            >
              Yes, cancel booking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}