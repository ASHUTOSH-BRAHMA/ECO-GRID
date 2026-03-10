import axios from "axios"

const api = axios.create({
    baseURL :'http://localhost:8080/api'
})

export const googleauth = (code)=>{
    console.log('Sending auth code',code)
    return api.get(`/google?code=${code}`)
} 