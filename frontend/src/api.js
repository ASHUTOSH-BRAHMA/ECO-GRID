import axios from "axios"
import { API_BASE_URL } from "./config"

const api = axios.create({
    baseURL : API_BASE_URL
})

export const googleauth = (code)=>{
    console.log('Sending auth code',code)
    return api.get(`/google?code=${code}`)
} 
