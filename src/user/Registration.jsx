import React from 'react'
import {Formik,useFormik} from "formik";
import { signUpSchema } from '../schemas';
import Rform from '../components/Registration/Rform';

const initialValues ={
  email : "",
  password : ""

}

const Registration = () => {
    const {values, errors, touched, handleBlur , handleChange , handleSubmit  } = useFormik({
    initialValues : initialValues,
    validationSchema : signUpSchema,
    onSubmit : (values,action)=>{
      console.log(values.email);
      console.log(values.password);
      alert("Login...");
      action.resetForm();
    }
  });  
  
  
   return(
    <div className="flex justify-center p-5 bg-gray-200">
     <div className="flex justify-center shadow-xl/30 rounded-2xl bg-white">
     
     <div className="h-175 overflow-hidden rounded-l-2xl">
        <img className="object-fit-contain" src="/img1.jpg" alt="" />
      </div>
       <div className=" rounded-l-2xl w-150 py-25 mt-10 flex justify-center">
        <img  src="/logo.png" className="h-25 w-75 absolute top-15 rounded-xl" alt="" />

        <Rform/>
        

      </div>
      
     </div>
    </div>
  )
}

export default Registration;
