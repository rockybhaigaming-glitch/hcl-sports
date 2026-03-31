import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = user?.is_admin;

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#E5E7EB]">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <h1 
              className="text-2xl font-bold bg-gradient-to-r from-[#5F1EBE] to-[#0578C3] bg-clip-text text-transparent cursor-pointer" 
              style={{fontFamily: 'Outfit, sans-serif'}}
              onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')}
            >
              HCLTech Sports
            </h1>
            
            {!isAdmin && (
              <div className="hidden md:flex space-x-4">
                <Button 
                  variant={location.pathname === '/dashboard' ? 'default' : 'ghost'}
                  onClick={() => navigate('/dashboard')}
                  className={location.pathname === '/dashboard' ? 'bg-gradient-to-r from-[#5F1EBE] to-[#0578C3] text-white' : ''}
                >
                  Book Slots
                </Button>
                <Button 
                  variant={location.pathname === '/my-bookings' ? 'default' : 'ghost'}
                  onClick={() => navigate('/my-bookings')}
                  data-testid="my-bookings-nav"
                  className={location.pathname === '/my-bookings' ? 'bg-gradient-to-r from-[#5F1EBE] to-[#0578C3] text-white' : ''}
                >
                  My Bookings
                </Button>
              </div>
            )}

            {isAdmin && (
              <div className="hidden md:flex space-x-4">
                <Button 
                  variant={location.pathname === '/admin' ? 'default' : 'ghost'}
                  onClick={() => navigate('/admin')}
                  className={location.pathname === '/admin' ? 'bg-gradient-to-r from-[#5F1EBE] to-[#0578C3] text-white' : ''}
                >
                  Dashboard
                </Button>
                <Button 
                  variant={location.pathname === '/admin/bookings' ? 'default' : 'ghost'}
                  onClick={() => navigate('/admin/bookings')}
                  className={location.pathname === '/admin/bookings' ? 'bg-gradient-to-r from-[#5F1EBE] to-[#0578C3] text-white' : ''}
                >
                  Bookings
                </Button>
                <Button 
                  variant={location.pathname === '/admin/slots' ? 'default' : 'ghost'}
                  onClick={() => navigate('/admin/slots')}
                  className={location.pathname === '/admin/slots' ? 'bg-gradient-to-r from-[#5F1EBE] to-[#0578C3] text-white' : ''}
                >
                  Manage Slots
                </Button>
                <Button 
                  variant={location.pathname === '/admin/reports' ? 'default' : 'ghost'}
                  onClick={() => navigate('/admin/reports')}
                  className={location.pathname === '/admin/reports' ? 'bg-gradient-to-r from-[#5F1EBE] to-[#0578C3] text-white' : ''}
                >
                  Reports
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2 text-sm">
              <User className="h-4 w-4 text-[#5F5F5F]" />
              <span className="text-[#0D0D0D] font-medium">{user?.employee_name}</span>
              <span className="text-[#5F5F5F]">({user?.employee_id})</span>
            </div>
            <Button 
              variant="outline" 
              onClick={onLogout}
              data-testid="logout-button"
              className="border-[#E5E7EB] hover:bg-[#F4F5F7]"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}