import { createSlice } from "@reduxjs/toolkit";


const userSlice = createSlice({
    name:"user",
    initialState:{
        userData:null
    },
    reducers:{
        setUserData:(state ,action )=>{
    state.userData=action.payload
        }
    }
})

export const {setUserData} = userSlice.actions //jisko change krna ho use export kra  do 
 export default userSlice.reducer //fir userslice ko export kr do 