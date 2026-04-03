import { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import Navbar from "@/components/Navbar";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://hcl-sports.onrender.com";
const API = `${BACKEND_URL}/api`;

const SPORTS = ["Cricket", "Basketball", "Badminton", "Volleyball"];

const TIME_SLOTS = [
  "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00",
  "19:00", "20:00", "21:00"
];

export default function AdminSlots({ user, onLogout }) {
  const [selectedSport, setSelectedSport] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [blocking, setBlocking] = useState(false);

  const handleBlockSlot = async () => {
    if (!selectedSport || !selectedDate || !selectedTimeSlot) {
      toast.error("Please select sport, date, and time slot");
      return;
    }

    setBlocking(true);

    try {
      await axios.post(
        `${API}/admin/slots/block`,
        {
          sport: selectedSport,
          date: format(selectedDate, "yyyy-MM-dd"),
          time_slot: selectedTimeSlot,
        },
        {
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        }
      );

      toast.success("Slot blocked for maintenance");

      // Reset selections
      setSelectedSport("");
      setSelectedTimeSlot("");
    } catch (error) {
      console.error(error);
      toast.error(
        error?.response?.data?.detail || "Failed to block slot"
      );
    } finally {
      setBlocking(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar user={user} onLogout={onLogout} />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-4xl font-bold mb-8">
          Manage Slots
        </h2>

        <div className="bg-white border rounded-xl p-8">
          <h3 className="text-2xl font-bold mb-6">
            Block Slot for Maintenance
          </h3>

          <p className="text-gray-500 mb-6">
            Block specific slots that are unavailable.
          </p>

          <div className="space-y-6">
            {/* SPORT */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Select Sport
              </label>

              <Select
                value={selectedSport}
                onValueChange={setSelectedSport}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a sport" />
                </SelectTrigger>

                <SelectContent>
                  {SPORTS.map((sport) => (
                    <SelectItem key={sport} value={sport}>
                      {sport}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* DATE */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Select Date
              </label>

              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border"
              />
            </div>

            {/* TIME SLOT */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Select Time Slot
              </label>

              <Select
                value={selectedTimeSlot}
                onValueChange={setSelectedTimeSlot}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a time slot" />
                </SelectTrigger>

                <SelectContent>
                  {TIME_SLOTS.map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      {slot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* SUMMARY */}
            <div className="p-4 bg-gray-100 rounded-lg">
              <p className="text-sm text-gray-500">
                Selected Slot:
              </p>

              <p className="font-semibold">
                {selectedSport &&
                selectedDate &&
                selectedTimeSlot
                  ? `${selectedSport} - ${format(
                      selectedDate,
                      "PPP"
                    )} at ${selectedTimeSlot}`
                  : "Please make selections above"}
              </p>
            </div>

            {/* BUTTON */}
            <Button
              onClick={handleBlockSlot}
              disabled={
                blocking ||
                !selectedSport ||
                !selectedDate ||
                !selectedTimeSlot
              }
              className="bg-red-500 hover:bg-red-600 text-white px-8 py-6"
            >
              {blocking ? "Blocking..." : "Block Slot"}
            </Button>
          </div>
        </div>

        {/* NOTE */}
        <div className="mt-8 bg-blue-100 border rounded-xl p-6">
          <h4 className="font-semibold mb-2">Note:</h4>

          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
            <li>Blocked slots cannot be booked by users</li>
            <li>
              Existing bookings must be cancelled before blocking
            </li>
            <li>
              Use for maintenance, weather, or special events
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
