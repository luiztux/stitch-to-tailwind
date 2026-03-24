import { initializeApp } from "firebase/app"
import { getAnalytics } from "firebase/analytics"

const firebaseConfig = {
  apiKey: "AIzaSyBHUBv6aXiDg8BM7HCe3SjnlOxtUkwaDyo",
  authDomain: "luiz-e9f1d.firebaseapp.com",
  projectId: "luiz-e9f1d",
  storageBucket: "luiz-e9f1d.appspot.com",
  messagingSenderId: "1052856851193",
  appId: "1:1052856851193:web:0b1fb5605ab2a4c8802028",
  measurementId: "G-CCWLQK9XRY",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const analytics = getAnalytics(app)

export { app, analytics }
