import axios from 'axios';
import React,{ useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = ()=>{

const navigate = useNavigate();
const {setAuthUser} = useAuth();
const [userInput, setUserInput] = useState({});
const [loading, setLoading] = useState(false)


const handelInput =(e)=>{
  setUserInput({
      ...userInput,[e.target.id]: e.target.value
  })
}
console.log(userInput);
const handelSubmit = async(e)=>{
  e.preventDefault();
  setLoading(true)
  try {
    const login = await axios.post(`/api/auth/login`,userInput);
    const data = login.data;
    if (data.success === false){
       setLoading(false)
       Console.log(data.message);
    }
    toast.success(data.message)
    localStorage.setItem('chatapp',JSON.stringify(data));
    setAuthUser(data)
    setLoading(false)
    navigate('/')
   } 
   catch(error){
    setLoading(false)
    console.log(error);
    toast.error(error?.response?.data?.message)
       }
    }


  return(
    <div className='flex flex-col items-center justify-center min-w-full mx-auto p-4'>
      <div className='w-full max-w-md p-6 rounded-lg shadow-xl bg-gray-400 bg-clip-padding backdrop-blur-lg bg-opacity-25'>
        <h1 className='text-3xl font-bold text-center text-gray-300 mb-4'>
          Login <span className='text-gray-950'>Chatters</span>
        </h1>
        <form onSubmit={handelSubmit} className='flex flex-col gap-4'>
          <div>
            <label className='block text-gray-950 font-semibold'>Email:</label>
            <input
              id='email'
              type='email'
              onChange={handelInput}
              placeholder='Enter your email'
              required
              className='w-full input input-bordered h-10 p-2 text-white mt-1'
            />
          </div>
          <div>
            <label className='block text-gray-950 font-semibold'>Password:</label>
            <input
              id='password'
              type='password'
              onChange={handelInput}
              placeholder='Enter your password'
              required
              className='w-full input input-bordered h-10 p-2 text-white mt-1'
            />
          </div>
          <button
            type='submit'
            className='mt-4 w-full bg-gray-950 hover:bg-gray-900 text-white text-lg py-2 rounded-lg transition transform hover:scale-105 disabled:opacity-50'
            disabled={loading}
          >
            {loading ? "loading.." : "Login"}
          </button>
        </form>
        <p className='mt-4 text-center text-sm text-gray-800'>
          Don't have an account?{' '}
          <Link to='/register' className='text-gray-950 font-bold underline hover:text-green-950'>
            Register Now!!
          </Link>
        </p>
      </div>
    </div>
  );

}

export default Login