import React, { useEffect, useState } from 'react'
import './App.css'
import { supabase } from './supabase-client';

const App = () => {
  const [newTask, setNewTask] = useState({ title: "", description: "" });
  const [task,setTask]=useState([])
  const[newDescription,setNewDescription]=useState("")


  //auth

  const[isSignUp,setIsSignUp]=useState(false);
  const[email,setEmail]=useState("")
  const[password,setPassword]=useState("")

  const[session,setSession]=useState(null)

  const[testImage,setTestImage]=useState(null)

  const fetchSession=async () => {
    const currentSession=await supabase.auth.getSession();
    console.log(currentSession);
    setSession(currentSession.data)
  }

  useEffect(() => {
  
  fetchSession()

  const {data}=supabase.auth.onAuthStateChange((_event,session)=>{
    setSession(session)
  })

  }, [])
  
  

  const fetchTask=async () => {
     const {error,data}=await supabase.from("test").select("*").order("created_at",{ascending:true})
      if(error){
      console.error(error.message)
      return
    }

    setTask(data)
  }
  useEffect(()=>{
    fetchTask()
    
  },[])

  console.log(task)

  const uploadImage=async (file) => {
    const filePath= `${file.name}-${Date.now()}`
    const {error}=await supabase.storage.from("test-image").upload(filePath,file)

    if(error){
      console.log(error.message)
      return null;
    }
    const {data}=await supabase.storage.from("test-image").getPublicUrl(filePath)

    return data.publicUrl
  }
  
  const handleSubmit=async(e)=>{
    e.preventDefault();

    let imageUrl;
    if(testImage){
      imageUrl=await uploadImage(testImage)
    }

    const {error,data}=await supabase.from("test").insert({...newTask,email:session.user.email,image_url: imageUrl})
    .select()
    .single()
    if(error){
      console.error(error.message)
      return
    }
    // setTask((prev)=>[...prev,data])
    setNewTask({title:"",description:""})
  }

   const deleteTask=async(id)=>{
    // e.preventDefault();

    const {error,data}=await supabase.from("test").delete().eq("id",id)
    if(error){
      console.error(error.message)
      return
    }
    fetchTask()
    
  }
   const updateTask=async(id)=>{
   

    const {error,data}=await supabase.from("test").update({description:newDescription}).eq("id",id)
    if(error){
      console.error(error.message)
      return
    }
    setNewTask({title:"",description:""})
  }


  //auth

  const authSubmit=async (e) => {
    e.preventDefault();
    if(isSignUp){
      const {error}=supabase.auth.signUp({email,password})

      if(error){
        console.log(error)
        return
      }
    }else{
      const {error}=supabase.auth.signInWithPassword({email,password})

      if(error){
        console.log(error)
        return
      }
    }
  }
  const logout=async () => {
    await supabase.auth.signOut()
  }


  useEffect(()=>{
    const channel=supabase.channel("test-channel")
    channel.on("postgres_changes",{event:"INSERT",schema:"public",table:"test"},(payload)=>{
      const newTask=payload.new;

      setTask((prev)=>[...prev,newTask])
    }
  ).subscribe((status)=>{
    console.log(status)
  })
   return () => {
    supabase.removeChannel(channel);
  };
  },[])

  const handleFileChange=(e)=>{
    if(e.target.files && e.target.files.length>0){
      setTestImage(e.target.files[0]);
    }
  }



 
  return (
    
    <div>
      {" "}
      <h1>Todo List</h1>
      <form action="" onSubmit={handleSubmit}>
        <div>
          <input
            type="text"
            placeholder="New Todo..."
            onChange={(e) => setNewTask((prev) => ({ ...prev, title: e.target.value }))}
          />
          <br />

          <br />
          <input
            type="text"
            placeholder="Discription..."

            onChange={(e) => setNewTask((prev) => ({ ...prev, description: e.target.value }))}
          />
        </div>
        <br />

        <br />
        <input type="file" accept='image/*' onChange={handleFileChange} />
        <br />

        <br />

        <button> Add Task</button>
        </form>
        <ul>
          {task.map((todo,key) => (
            <li key={key}>
              <p>Title : {todo.title}</p>
              <p>Description : {todo.description}</p>

              <textarea placeholder='Updated description...'onChange={(e)=>setNewDescription(e.target.value)}/>

              <button onClick={()=>updateTask(todo.id)} >Edit Task</button>
              <button onClick={()=>deleteTask(todo.id)} > Delete Task</button>
            </li>
          ))}
        </ul>

        <h1>
          {isSignUp ? "Sign Up" : "Sign In"}
        </h1>
        <input type="email"placeholder='Enter your email' onChange={(e)=>setEmail(e.target.value)} />
        <input type="password" placeholder='Enter your password' onChange={(e)=>setPassword(e.target.value)} />
        <button onClick={authSubmit}>Click </button>
        <button onClick={logout}>Logout</button>
    </div>
  )
}

export default App
