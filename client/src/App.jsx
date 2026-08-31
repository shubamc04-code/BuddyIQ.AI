//import React from 'react'

import { Route, Routes } from "react-router-dom"
import Home from "./pages/Home.jsx"
import Auth from "./pages/Auth.jsx"
import { useEffect } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { setUserData } from "./redux/userSlice.js";
import InterviewPage from "./pages/InterviewPage.jsx"
import InterviewHistory from "./pages/interviewHistory.jsx";
import Pricing from "./pages/Pricing.jsx";
import InterviewReports from "./pages/InterviewReports.jsx";

export const ServerUrl = "https://buddyiq-ai.onrender.com";

function App() {

  const dispatch = useDispatch()//user data set krega ye hook
  useEffect(()=>{
    const getuser =async () => {
      try {
        const result = await axios.get(ServerUrl +"/api/user/current-user",
          {withCredentials:true }
        )
       dispatch(setUserData(result.data))//result se jo bhi user ka data aa rha h us ye set kr dega user data m 
      } catch (error) {
          console.log(error)
          dispatch(setUserData(null))//agr kuch bhi error aayegi to wapis se null set kr dega
      }
    }
    getuser()
  },[dispatch])
  
  return (
   <Routes>
    <Route path="/" element={<Home/>}/>
    <Route path="/auth" element={<Auth/>}/>
    <Route path="/interview" element={<InterviewPage/>}/>
    <Route path="/history" element={<InterviewHistory/>}/>
    <Route path="/pricing" element={<Pricing/>}/>
        <Route path="/report/:id" element={<InterviewReports/>}/>
    
   </Routes>
  )
}

export default App
