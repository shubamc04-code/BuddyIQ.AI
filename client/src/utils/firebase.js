
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
  authDomain: "buddyiq-b8c53.firebaseapp.com",
  projectId: "buddyiq-b8c53",
  storageBucket: "buddyiq-b8c53.firebasestorage.app",
  messagingSenderId: "718552893748",
  appId: "1:718552893748:web:077bdc34c305672fc23d61"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const provider = new GoogleAuthProvider();//yaha ham google ka use kr rhe h 
//authentication m to isliye hm yaha googleauthprovider ka use kr rhe h 

export {auth, provider}//export isliye kr rhe h taki user kisi bhi 
//email id se login kre to hm use popup de ske 