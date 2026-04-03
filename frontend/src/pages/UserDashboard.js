import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { format } from "date-fns";
import Navbar from "@/components/Navbar";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://hcl-sports.onrender.com";
const API = `${BACKEND_URL}/api`;

const SPORTS_DATA = [
  { name: "Cricket", image: "https://images.pexels.com/photos/24394759/pexels-photo-24394759.jpeg" },
  { name: "Basketball", image: "https://images.pexels.com/photos/5407033/pexels-photo-5407033.jpeg" },
  { name: "Badminton", image: "https://images.pexels.com/photos/3660204/pexels-photo-3660204.jpeg" },
  { name: "Volleyball", image: "https://images.pexels.com/photos/32602955/pexels-photo-32602955.jpeg" }
];

export default function UserDashboard({ user, onLogout }) {
  const [selectedSport, setSelectedSport] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [slots, setSlots] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bookingCount, setBookingCount] = useState(0);

  useEffect(() => {
    if (selectedSport && selectedDate) {
      fetchSlots();
      checkBookingCount();
    }
  }, [selectedSport, selectedDate]);

  const fetchSlots = async () => {
    if (!selectedDate) return;

    setLoading(true);
    try {
      const response = await axios.get(`${API}/slots`, {
        params: {
          sport: selectedSport,
          date: format(selectedDate, "yyyy-MM-dd")
        },
        headers: {
          Authorization: `Bearer ${user?.token}`
        }
      });

      setSlots(response?.data?.slots || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch slots");
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const checkBookingCount = async () => {
    if (!selectedDate) return;

    try {
      const response = await axios.get(`${API}/bookings/my`, {
        headers: {
          Authorization: `Bearer ${user?.token}`
        }
      });

      const today = format(selectedDate, "yyyy-MM-dd");

      const todayBookings = (response?.data || []).filter(
        (b) => b.date === today && b.status === "active"
      );

      setBookingCount(todayBookings.length);
    } catch (error) {
      console.error("Failed to check booking count", error);
      setBookingCount(0);
    }
  };

  const handleSlotSelect = (timeSlot) => {
    setSelectedSlots((prev) => {
      if (prev.includes(timeSlot)) {
        return prev.filter((s) => s !== timeSlot);
      } else {
        if (prev.length + bookingCount >= 2) {
          toast.error("Maximum 2 bookings per day allowed");
          return prev;
        }
        return [...prev, timeSlot];
      }
    });
  };

  const handleBooking = async () => {
    if (!selectedDate) {
      toast.error("Invalid date selected");
      return;
    }

    if (selectedSlots.length === 0) {
      toast.error("Please select at least one slot");
      return;
    }

    setLoading(true);

    try {
      await Promise.all(
        selectedSlots.map((timeSlot) =>
          axios.post(
            `${API}/bookings`,
            {
              sport: selectedSport,
              date: format(selectedDate, "yyyy-MM-dd"),
              time_slot: timeSlot
            },
            {
              headers: {
                Authorization: `Bearer ${user?.token}`
              }
            }
          )
        )
      );

      toast.success(`${selectedSlots.length} slot(s) booked successfully!`);
      setSelectedSlots([]);
      fetchSlots();
      checkBookingCount();
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.detail || "Booking failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      <Navbar user={user} onLogout={onLogout} />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {!selectedSport ? (
          <div>
            <h2 className="text-4xl font-bold mb-8">Select a Sport</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {SPORTS_DATA.map((sport) => (
                <button
                  key={sport.name}
                  onClick={() => setSelectedSport(sport.name)}
                  className="group relative overflow-hidden rounded-xl border border-gray-200 hover:border-blue-500 transition-all duration-200 hover:shadow-md"
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={sport.image}
                      alt={sport.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                    <h3 className="text-white text-2xl font-bold">
                      {sport.name}
                    </h3>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedSport(null);
                    setSelectedSlots([]);
                  }}
                  className="mb-4"
                >
                  ← Back to Sports
                </Button>

                <h2 className="text-4xl font-bold">{selectedSport}</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* DATE */}
              <div>
                <div className="bg-white border rounded-xl p-6">
                  <h3 className="text-xl font-semibold mb-4">
                    Select Date
                  </h3>

                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    className="rounded-md border"
                  />

                  <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                    <p className="text-sm text-gray-500">Selected Date:</p>
                    <p className="font-semibold">
                      {selectedDate ? format(selectedDate, "PPP") : "-"}
                    </p>

                    <p className="text-sm text-gray-500 mt-2">
                      Bookings today: {bookingCount}/2
                    </p>
                  </div>
                </div>
              </div>

              {/* SLOTS */}
              <div className="lg:col-span-2">
                <div className="bg-white border rounded-xl p-6">
                  <h3 className="text-xl font-semibold mb-4">
                    Available Slots (7 AM - 10 PM)
                  </h3>

                  {loading ? (
                    <div className="text-center py-12">Loading...</div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {slots.map((slot) => {
                          const isAvailable = slot.status === "available";
                          const isDisabled =
                            slot.status !== "available";
                          const isSelected = selectedSlots.includes(
                            slot.time_slot
                          );

                          return (
                            <button
                              key={slot.time_slot}
                              onClick={() =>
                                isAvailable &&
                                handleSlotSelect(slot.time_slot)
                              }
                              disabled={isDisabled}
                              className={`p-4 rounded-md border font-medium transition
                                ${
                                  isSelected
                                    ? "bg-blue-600 text-white"
                                    : ""
                                }
                                ${
                                  isAvailable && !isSelected
                                    ? "bg-white hover:border-blue-500"
                                    : ""
                                }
                                ${
                                  isDisabled
                                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                    : ""
                                }
                              `}
                            >
                              {slot.time_slot}
                            </button>
                          );
                        })}
                      </div>

                      {selectedSlots.length > 0 && (
                        <div className="mt-6 p-4 bg-blue-100 rounded-lg">
                          <p className="font-semibold mb-2">
                            Selected Slots: {selectedSlots.join(", ")}
                          </p>

                          <Button
                            onClick={handleBooking}
                            disabled={loading}
                          >
                            Confirm Booking ({selectedSlots.length})
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
