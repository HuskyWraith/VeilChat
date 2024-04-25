import React, { useEffect } from "react";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { useState, useContext } from "react";
import {doCreateUserWithEmailAndPassword} from '../firebase/FirebaseFunctions.js';
import AuthContext from "./AuthContext.jsx";
import { State, City } from "country-state-city";
import SocialSignIn from './SocialSignIn.jsx';
function SignUp() {
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [continuePage, setContinuePage]=useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    city: "",
    state: "",
    country: "US",
  });
  const [errors, setErrors] = useState([]);
  const [loading, setLoading]=useState([]);
  const [password, setPassword] = useState("");
  const [repeat_password, setRepeatPassword] = useState("");
  let [user_name, setUserName] = useState("");
  let [userMatch, setUserMatch] = useState(false);
  
  let states = State.getAllStates().filter(
    (state) => state.countryCode === "US"
  );

  let [cities, setCities] = useState([]);
  useEffect(() => {
    let c = City.getAllCities().filter(
      (city) => city.stateCode === formData.state
    );
    setCities(c);
  }, [formData.state]);
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const [strength, setStrength] = useState("weak");
  const [match, setMatch] = useState(false);
  if (currentUser) {
    return <Navigate to='/home' />;
}
  function handlePwdChange(e) {
    let newPwd = e.target.value;
    setPassword(newPwd);
    validatePassword(newPwd);
  }
  function handleUserName(e) {
    let user = e.target.value;
    setUserName(user);
    const regex = /^[^\s]+$/;
    if (regex.test(user)) {
      setUserMatch(true);
    } else {
      setUserMatch(false);
    }
  }
  function validatePassword(password) {
    const hasUpperCase = /[A-Z]/g.test(password);
    const hasLowerCase = /[a-z]/g.test(password);
    const hasNumber = /[0-9]/g.test(password);
    const hasSpecialChar = /[!@#$%^&*()]/g.test(password);

    if (password.length < 8) {
      setStrength("weak");
    } else if (hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar) {
      setStrength("strong");
    } else {
      setStrength("medium");
    }
    return;
  }
  function handleRePwdChange(e) {
    let newPwd = e.target.value;
    setRepeatPassword(newPwd);
    setMatch(password === newPwd);
  }
  if (currentUser) {
    return <Navigate to='/home' />;
}

  const handleSubmit = async(e) => {

    e.preventDefault();
    setLoading(true);

    setErrors([]);
    if (password !== repeat_password) {
      setErrors((prevState) => {
        return [...prevState, "Passwords don't match"];
      });

    }
    if(!userMatch){
      setErrors((prevState) => {
          return [...prevState, "Invalid user name"];
        });
  }
  try
  {
    let response=await fetch("http://localhost:4000/user/checkusername",{
      method:"POST",
      headers: { 'Content-Type': 'application/json' },
      body:JSON.stringify({
        user_name: user_name.trim().toLowerCase()
    })});
    if(!response.ok)
    {
      setErrors((prevState) => {
        return [...prevState, "Username already exists..."];
      });
      return
    }
  }
  catch(e)
  {
    setErrors((prevState) => {
      return [...prevState, e];
    });
    return
  }
  if(!errors.length){
    
     try {
           const userCredential= await doCreateUserWithEmailAndPassword(
                formData.email,
                password,
                user_name              
            );
            console.log("User created successfully:", userCredential);
            
              setContinuePage(true);
              return
        } catch (error) {
            alert(error.code);
            navigate('/signin');
        }
        setLoading(false);
        setContinuePage(true);
  }
  setLoading(false)
  return;
}
        const handleSignUp=async(e)=>
        {
          e.preventDefault();
          setErrors([]);
          setUserMatch(false);
          setMatch(false);
      const regex = /^[A-Za-zÀ-ÿ ]+$/;
    if(!regex.test(formData.first_name.trim()))
    {
        setErrors((prevState) => {
            return [...prevState, "Invalid First name"]
          });
    }
    if(!regex.test(formData.last_name.trim()))
    {
        setErrors((prevState) => {
            return [...prevState, "Invalid Last name"]
          });
    }
    
    let dob=document.getElementById("dob").value;
    console.log(dob);
    dob=new Date(dob);
   
    let yearOfBirth=parseInt(dob.getFullYear());
    let today=new Date()
    let age=parseInt(today.getFullYear())-yearOfBirth;
    if(age<18){
      
      setErrors((prevState) => {
        return [...prevState, "You must be 18 years old to continue..."]
      });
      return
    }
    
    let state=document.getElementById("state").value;
    let city=document.getElementById("city").value;
    if(!cities)
    {
        city=state;
    }
    if(!errors.length>0)
    {
    let response=await fetch("http://localhost:4000/signup",{
        method:"POST",
        headers: { 'Content-Type': 'application/json' },
        body:JSON.stringify(
            {
                "first_name":formData.first_name.trim(),
                "last_name":formData.last_name.trim(),
                "email":formData.email.trim(),
                "user_name":user_name.trim(),
                "password":password,
                "repeat_password":repeat_password,
                "dob":dob,
                "city":city,
                "state":state,
                "country":"US"
            })
    });
    try
    {
    let data=await response.json()
    if (!response.ok) {
        if (data && data.message) {
            setErrors((prevState) => {
                return [...prevState, data.message];
              });
            return
          } else {
            setErrors((prevState) => {
                return [...prevState, "An error occurred while logging in"];
              });
            return
          }
        }
      else{
        setErrors([]);
        setContinuePage(false);
        alert("Sucessfully created your profile");
        navigate('/signin');}
    }
catch(e)
{
    setErrors((prevState) => {
        return [...prevState, e.message];
      });
      return
}}
if(loading)
{
  return <div>loading..</div>
}
return
  };

  return ( 
  <div className="max-w-md mx-auto my-8">
    {!continuePage?
    <div>
      <h2 style={{textAlign:"center", fontWeight:"bold"}}>Create a new profile</h2>
      <div className='card'>
            <form onSubmit={handleSubmit}>
            <div className="mb-4">
            <label
              htmlFor="user_name"
              className="block text-gray-700 text-sm font-bold mb-2">
              Username:
            </label>
            <input
              type="text"
              name="user_name"
              value={formData.user_name}
              required
              onChange={handleUserName}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
            {user_name && (
              <span style={{ color: userMatch ? "green" : "red" }}>
                {userMatch ? "Format Accepted " + "\u2714" : "\u2716"}
              </span>
            )}
          </div>
                <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-gray-700 text-sm font-bold mb-2">
              Email:
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              required
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="password"
              className="block text-gray-700 text-sm font-bold mb-2">
              Password:
            </label>
            <input
              type="password"
              name="password"
              value={password}
              required
              onChange={handlePwdChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
            {password && (
              <span
                style={
                  strength === "weak"
                    ? { color: "red" }
                    : strength === "medium"
                    ? { color: "orange" }
                    : { color: "green" }
                }>
                {strength}
              </span>
            )}
          </div>
          <div className="mb-4">
            <label
              htmlFor="repeat_password"
              className="block text-gray-700 text-sm font-bold mb-2">
              Confirm Password:
            </label>
            <input
              type="password"
              name="repeat_password"
              value={formData.repeat_password}
              required
              onChange={handleRePwdChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
            {repeat_password && (
              <span style={match ? { color: "green" } : { color: "red" }}>
                {match ? "Passwords Match" : "Passwords doesn't Match"}
              </span>
            )}
          </div >
          {errors.length>0 && <ul>
                {errors.map((error)=>(
                    <li key={error}style={{color:"red"}}>
                        {error}
                    </li>
                ))}
                </ul>}
          <div className="flex justify-between items-center">
                <button
                    className="bg-blue-500 hover:bg-blue-700 text-black font-bold py-2 px-2 rounded focus:outline-none focus:shadow-outline"
                    id='submitButton'
                    name='submitButton'
                    type='submit'
                >
                    Continue
                </button>

            <Link to="/signin">
              <button className="bg-gradient-to-r from-green-500 to-green-700 hover:bg-gradient-to-l from-green-700 to-green-500 text-white font-bold py-2 px-4 rounded-full focus:outline-none focus:shadow-lg shadow-green-500/50">
                Already have an account
                </button>

                </Link>
                </div>
            </form>
            <br />
           
            <SocialSignIn />
            
        </div></div>:( <div className="container">
       
         <form
          onSubmit={handleSignUp}
          className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <div className="mb-4">
            <label
              htmlFor="first_name"
              className="block text-gray-700 text-sm font-bold mb-2">
              First Name:
            </label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              required
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="last_name"
              className="block text-gray-700 text-sm font-bold mb-2">
              Last Name:
            </label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              required
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
        <div className="mb-4">
          <label htmlFor="dob"
          className="block text-gray-700 text-sm font-bold mb-2">
            Date of Birth:
          </label>
          <input
              type="date"
              name="dob"
              id="dob"
              required
              min={1900}
              max={2024}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
        </div>
          <div className="mb-4">
            <label
              htmlFor="state"
              className="block text-gray-700 text-sm font-bold mb-2">
              State:
            </label>
            <select
              name="state"
              id="state"
              required
              className=" border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={formData.state}
              onChange={handleChange}>
              <option key="some_random_value" value="select">
                Select
              </option>
              {states.map((state) => (
                <option
                  key={state.latitude + state.longitude}
                  value={state.isoCode}>
                  {state.name}
                </option>
              ))}
            </select>
          </div>
          {formData.state && cities.length > 0 && (
            <div className="mb-4">
              <label
                htmlFor="city"
                className="block text-gray-700 text-sm font-bold mb-2">
                City:
              </label>
              <select
                name="city"
                id="city"
                className=" border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={formData.city}
                required
                onChange={handleChange}>
                {cities.map((city) => (
                  <option
                    key={city.latitude + city.longitude}
                    value={city.isoCode}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* <div className="mb-4">
          <label htmlFor="country" className="block text-gray-700 text-sm font-bold mb-2">Country:</label>
          <input type="text" name="country" value={formData.country} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
        </div> */}
        <div className="container">
            {errors.length>0 && <ul>
                {errors.map((error)=>(
                    <li key={error}style={{color:"red"}}>
                        {error}
                    </li>
                ))}
                </ul>}
        </div>
          <div className="mb-6">
            <div className="flex space-x-10">
              <button type="button" className="bg-gray-500 hover:bg-gray-700 text-black font-bold py-2 px-2 rounded focus:outline-none focus:shadow-outline" onClick={()=>setContinuePage(false)}>back</button>
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-black font-bold py-2 px-2 rounded focus:outline-none focus:shadow-outline">
              Sign Up
            </button>
          
                </div>
          </div>
        </form>
      </div>)}
    </div>
  );
}

export default SignUp;