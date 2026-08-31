import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {useDispatch} from 'react-redux';
import { useSelector } from "react-redux";
import { motion } from "motion/react";
import { BsRobot, BsCoin } from "react-icons/bs";
import { HiOutlineLogout } from "react-icons/hi";
import { FaUserAstronaut } from "react-icons/fa";
import axios from "axios";
import {ServerUrl} from "../App";
import {setUserData} from "../redux/userSlice";
import AuthModel from "./AuthModel";


function Navbar() {
  const { userData } = useSelector((state) => state.user);

  const [showCreditPopup, setShowCreditPopup] = useState(false);
  const [showUserPopup, setShowUserPopup] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showAuth,setShowAuth] = useState(false);

  const handleLogout = async () => {
    try{
           await axios.get(ServerUrl +"/api/auth/logout",{withCredentials:true})
           dispatch(setUserData(null));
           setShowUserPopup(false);
           setShowCreditPopup(false);
           navigate("/");
    }catch(error){
           console.log("logout error",error)
    }
  };

  const userInitial = userData?.name?.charAt(0)?.toUpperCase();
  

  return (
    <div className="bg-[#f3f3f3] flex justify-center px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-6xl bg-white rounded-3xl shadow-sm border border-gray-200 px-8 py-4 flex justify-between items-center relative"
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <div className="bg-black text-white p-2 rounded-lg">
            <BsRobot size={18} />
          </div>

          <div className="font-semibold hidden md:block text-lg">
            BuddyIQ.Ai
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-6">
          {/* Credits */}
          <div className="relative">
            <button
              onClick={() => {
                if(!userData){//agar user login nhi h to auth model open hoga
                  setShowAuth(true)
                  return;
                }
                setShowCreditPopup(!showCreditPopup);
                setShowUserPopup(false);
              }}
              className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full text-md hover:bg-gray-200 transition"
            >
              <BsCoin size={20} />
              {userData?.credits ?? 0}
            </button>

            {showCreditPopup && (
              <div className="absolute right-0 mt-3 w-64 bg-white shadow-xl border border-gray-200 rounded-xl p-5 z-50">
                <p className="text-sm text-gray-600 mb-4">
                  Need more credits to continue interviews?
                </p>

                <button
                  onClick={() => navigate("/pricing")}
                  className="w-full bg-black text-white py-2 rounded-lg text-sm hover:bg-gray-800 transition"
                >
                  Buy More Credits
                </button>
              </div>
            )}
          </div>

          {/* User */}
          <div className="relative">
            <button
              onClick={() => {
                if(!userData){//agar user login nhi h to auth model open hoga
                  setShowAuth(true)
                  return;
                }
                setShowUserPopup(!showUserPopup);
                setShowCreditPopup(false);
              }}
              className="w-9 h-9 bg-black text-white flex items-center justify-center rounded-full font-semibold"
            >
              {userInitial || <FaUserAstronaut size={16} />}
            </button>

            {showUserPopup && (
              <div className="absolute right-0 mt-3 w-48 bg-white shadow-xl border border-gray-200 rounded-xl p-4 z-50">
                <p className="text-md text-blue-500 mb-1 font-medium truncate">
                  {userData?.name || "User"}
                </p>

                <button
                  onClick={() => navigate("/history")}
                  className="w-full text-left text-sm py-2 hover:text-black text-gray-600 transition"
                >
                  Interview History
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full text-left text-sm py-2 flex items-center gap-2 text-red-500 hover:text-red-600 transition">
                  <HiOutlineLogout size={16} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
      { showAuth && <AuthModel onClose={()=>setShowAuth(false)}/>} 
        
    </div>
  );
}

export default Navbar;