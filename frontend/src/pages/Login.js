import { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Login({ onLogin }) {
  const [employeeId, setEmployeeId] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!employeeId.trim() || !employeeName.trim()) {
      toast.error("Please enter both Employee ID and Name");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/login`, {
        employee_id: employeeId,
        employee_name: employeeName
      });
      
      toast.success("Login successful!");
      onLogin(response.data);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#5F1EBE] to-[#0578C3] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/20">
          <div className="text-center mb-8">
            <img 
              src="https://customer-assets.emergentagent.com/job_eac11c9e-24f7-41ff-a6cd-335ae334f010/artifacts/cznkroka_image.png" 
              alt="HCLTech Logo" 
              className="h-16 mx-auto mb-4"
            />
            <h1 className="text-4xl font-bold text-white mb-2" style={{fontFamily: 'Outfit, sans-serif'}}>Sports Booking</h1>
            <p className="text-white/80 text-base">Sign in to reserve your slot</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <Label htmlFor="employee-id" className="text-white text-sm font-medium">Employee ID</Label>
              <Input
                id="employee-id"
                data-testid="employee-id-input"
                type="text"
                placeholder="Enter your Employee ID"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="mt-2 bg-white/90 border-white/30 focus:border-white focus:ring-white text-gray-900 placeholder:text-gray-500"
              />
            </div>

            <div>
              <Label htmlFor="employee-name" className="text-white text-sm font-medium">Employee Name</Label>
              <Input
                id="employee-name"
                data-testid="employee-name-input"
                type="text"
                placeholder="Enter your Full Name"
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                className="mt-2 bg-white/90 border-white/30 focus:border-white focus:ring-white text-gray-900 placeholder:text-gray-500"
              />
            </div>

            <Button
              type="submit"
              data-testid="login-button"
              disabled={loading}
              className="w-full bg-white text-[#5F1EBE] hover:bg-white/90 font-semibold py-6 rounded-md transition-all duration-200"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center text-white/70 text-sm">
            <p>Admin credentials: ADMIN001 or ADMIN123</p>
          </div>
        </div>
      </div>
    </div>
  );
}