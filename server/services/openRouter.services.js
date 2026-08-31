// IN THIS CODE WE ARE UNDERSATND HOW TO USE THE OPENROUTER AI AND HOW WE GET THE DATA WITH THE OPENROUTER AI URL
import axios from "axios";

export const askAi = async  (messages)=>{
       try {
         if(!messages || !Array.isArray(messages) || messages.length===0
        ){
            return new Error("Message Array is empty.")
         }
         const response = await axios.post('https://openrouter.ai/api/v1/chat/completions',
            {

            model:"openai/gpt-4o-mini",//body ke ander hamne model or message diya h 
            messages:messages

         },
        {
             headers: {
             Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
             'Content-Type': 'application/json',
              },
        });
        const content = response?.data?.choices?.[0]?.message?.content;
        if(!content || !content.trim()){
               throw new Error("AI return Empty Array")
        }
        return content ;
     
       } catch (error) {
          console.error("OpenRouter Error:", error.response?.data || error.message);
          throw new Error("OpenROuter Ai Error")
       }
} 